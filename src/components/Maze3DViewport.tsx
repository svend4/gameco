import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BackgroundStyle,
  BiomeKey,
  BIOMES,
  FamiliarCompanion,
  HeroAvatar,
  MazeData,
  MazeEnemy,
  Position,
  SECTOR_WEATHERS_CATALOG,
  SectorWeatherKey,
} from '../game/rules';

export type Camera3DMode = '1.5d-wave' | '2.5d-diorama' | '3d-chase' | '3.5d-quantum';

export interface VfxBurstPayload {
  id: number;
  r: number;
  c: number;
  colorHex: number;
}

interface Maze3DViewportProps {
  maze: MazeData;
  biomeKey: BiomeKey;
  playerPos: Position;
  starsRemaining: Position[];
  chestsRemaining: Position[];
  shrinesRemaining: Position[];
  keyCollected: boolean;
  enemies: MazeEnemy[];
  activeHero: HeroAvatar;
  activeFamiliar?: FamiliarCompanion;
  cameraMode: Camera3DMode;
  boardShake: boolean;
  phaseGatesOpen?: boolean;
  enemyFrozenTurns?: number;
  sectorWeather?: SectorWeatherKey;
  historyPositions?: Position[];
  quantumTarget?: Position | null;
  vfxBurst?: VfxBurstPayload | null;
  onMoveStep: (dr: number, dc: number) => void;
}

const TILE_SIZE = 2.0;

const ELEMENTAL_HEX: Record<BackgroundStyle, number> = {
  Cosmic: 0xe94057,
  Neon: 0x2bd2ff,
  Ocean: 0x00aaff,
  Forest: 0x38ef7d,
  Gold: 0xf59e0b,
};

// Pre-allocated scratch math objects (zero GC inside animation loop)
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();
const _dummyMat = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _dummyScale = new THREE.Vector3();
const _dummyColor = new THREE.Color();

function createEmojiCanvasTexture(
  emoji: string,
  bgHex: string,
  borderHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 256, 256);

  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.fillStyle = bgHex;
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = borderHex;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(128, 128, 96, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();

  ctx.font = '132px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji || '🦊', 128, 134);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  tex.needsUpdate = true;
  return tex;
}

function createFloorGridTexture(
  fillHex: string,
  strokeHex: string,
  maxAnisotropy: number
): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = fillHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = strokeHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 244);

  ctx.fillStyle = strokeHex;
  [22, 234].forEach((x) => {
    [22, 234].forEach((y) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.anisotropy = maxAnisotropy;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 128;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, 128, 128);
  bCtx.strokeStyle = '#ffffff';
  bCtx.lineWidth = 4;
  bCtx.strokeRect(4, 4, 120, 120);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap };
}

function createWallBlockTexture(
  fillHex: string,
  strokeHex: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = fillHex;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = strokeHex;
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 248);
  ctx.beginPath();
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 128);
  ctx.moveTo(64, 128);
  ctx.lineTo(64, 256);
  ctx.moveTo(192, 128);
  ctx.lineTo(192, 256);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.fillRect(8, 8, 240, 18);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export const Maze3DViewport: React.FC<Maze3DViewportProps> = ({
  maze,
  biomeKey,
  playerPos,
  starsRemaining,
  chestsRemaining,
  shrinesRemaining,
  keyCollected,
  enemies,
  activeHero,
  activeFamiliar,
  cameraMode,
  boardShake,
  phaseGatesOpen = false,
  enemyFrozenTurns = 0,
  historyPositions = [],
  quantumTarget = null,
  vfxBurst = null,
  onMoveStep,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const stateRef = useRef({
    maze,
    biomeKey,
    playerPos,
    starsRemaining,
    chestsRemaining,
    shrinesRemaining,
    keyCollected,
    enemies,
    activeHero,
    activeFamiliar,
    cameraMode,
    boardShake,
    phaseGatesOpen,
    enemyFrozenTurns,
    historyPositions,
    quantumTarget,
    vfxBurst,
    onMoveStep,
  });

  useEffect(() => {
    stateRef.current = {
      maze,
      biomeKey,
      playerPos,
      starsRemaining,
      chestsRemaining,
      shrinesRemaining,
      keyCollected,
      enemies,
      activeHero,
      activeFamiliar,
      cameraMode,
      boardShake,
      phaseGatesOpen,
      enemyFrozenTurns,
      historyPositions,
      quantumTarget,
      vfxBurst,
      onMoveStep,
    };
  }, [
    maze,
    biomeKey,
    playerPos,
    starsRemaining,
    chestsRemaining,
    shrinesRemaining,
    keyCollected,
    enemies,
    activeHero,
    activeFamiliar,
    cameraMode,
    boardShake,
    phaseGatesOpen,
    enemyFrozenTurns,
    historyPositions,
    quantumTarget,
    vfxBurst,
    onMoveStep,
  ]);

  const rebuildLevelRef = useRef<(() => void) | null>(null);
  const rebuildHeroTexturesRef = useRef<(() => void) | null>(null);
  const syncDynamicEntitiesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    rebuildLevelRef.current?.();
  }, [maze, biomeKey]);

  useEffect(() => {
    rebuildHeroTexturesRef.current?.();
  }, [
    activeHero.baseEmoji,
    activeHero.accessoryEmoji,
    activeHero.flagEmoji,
    activeHero.backgroundStyle,
    activeFamiliar?.emoji,
  ]);

  useEffect(() => {
    syncDynamicEntitiesRef.current?.();
  }, [
    starsRemaining,
    chestsRemaining,
    shrinesRemaining,
    keyCollected,
    phaseGatesOpen,
    enemyFrozenTurns,
    enemies,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const initW = container.clientWidth || 800;
    const initH = container.clientHeight || 600;
    renderer.setSize(initW, initH);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x130e24);
    scene.fog = new THREE.FogExp2(0x130e24, 0.018);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(46, initW / initH, 0.5, 140);
    camera.position.set(0, 18, 14);

    // 3-Point Warm/Cool Studio Lighting Rig + Hero Dynamic Torchlight
    const hemiLight = new THREE.HemisphereLight(0xa78bfa, 0x160f29, 1.3);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe8c2, 2.0);
    keyLight.position.set(16, 28, 18);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 75;
      const d = 22;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-18, 16, -16);
    scene.add(rimLight);

    // Dynamic Torchlight PointLight attached to Hero (for Medieval Citadel Torchlight Mode)
    const heroTorchLight = new THREE.PointLight(0xff9933, 0, 15, 1.5);
    heroTorchLight.position.set(0, 2.2, 0);

    const contactShadowTex = createContactShadowTexture();
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadowDiscGeo = new THREE.CircleGeometry(0.82, 20);
    shadowDiscGeo.rotateX(-Math.PI / 2);

    const levelGroup = new THREE.Group();
    scene.add(levelGroup);

    const collectiblesGroup = new THREE.Group();
    scene.add(collectiblesGroup);

    const enemiesGroup = new THREE.Group();
    scene.add(enemiesGroup);

    const floorTiles: THREE.Mesh[] = [];
    const highlightRingGeo = new THREE.RingGeometry(0.45, 0.65, 24);
    highlightRingGeo.rotateX(-Math.PI / 2);
    const highlightRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const adjacentRingsGroup = new THREE.Group();
    scene.add(adjacentRingsGroup);

    // =========================================================
    // COMPOSITE 8-PART 3D HERO + FAMILIAR AVATAR RIG (THREE.Group)
    // =========================================================
    const heroGroup = new THREE.Group();
    heroGroup.add(heroTorchLight);
    scene.add(heroGroup);

    const heroShadow = new THREE.Mesh(shadowDiscGeo, contactShadowMat);
    heroShadow.position.y = 0.015;
    heroGroup.add(heroShadow);

    const pedestalGeo = new THREE.CylinderGeometry(0.62, 0.74, 0.22, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x2e2252,
      metalness: 0.85,
      roughness: 0.2,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = 0.11;
    heroGroup.add(pedestalMesh);

    const ringGeo = new THREE.TorusGeometry(0.68, 0.06, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    const heroRingMat = new THREE.MeshStandardMaterial({
      color: 0xe94057,
      emissive: 0xe94057,
      emissiveIntensity: 0.85,
      roughness: 0.3,
      metalness: 0.5,
    });
    const heroRingMesh = new THREE.Mesh(ringGeo, heroRingMat);
    heroRingMesh.position.y = 0.23;
    heroGroup.add(heroRingMesh);

    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.55, 20);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x6750a4,
      roughness: 0.6,
      metalness: 0.25,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 0.52;
    heroGroup.add(torsoMesh);

    const heroFloatPivot = new THREE.Group();
    heroFloatPivot.position.y = 1.25;
    heroGroup.add(heroFloatPivot);

    const heroSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const heroSprite = new THREE.Sprite(heroSpriteMat);
    heroSprite.scale.set(1.38, 1.38, 1);
    heroFloatPivot.add(heroSprite);

    const orbitPivot = new THREE.Group();
    orbitPivot.position.y = 1.25;
    heroGroup.add(orbitPivot);

    const accSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const accSprite = new THREE.Sprite(accSpriteMat);
    accSprite.position.set(0.85, 0.32, 0.25);
    accSprite.scale.set(0.65, 0.65, 1);
    orbitPivot.add(accSprite);

    const flagSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const flagSprite = new THREE.Sprite(flagSpriteMat);
    flagSprite.position.set(-0.82, -0.2, 0.25);
    flagSprite.scale.set(0.6, 0.6, 1);
    orbitPivot.add(flagSprite);

    // 8th Part: 3D Companion Familiar Sprite orbiting overhead
    const familiarSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const familiarSprite = new THREE.Sprite(familiarSpriteMat);
    familiarSprite.position.set(0.0, 0.58, -0.88);
    familiarSprite.scale.set(0.68, 0.68, 1);
    orbitPivot.add(familiarSprite);

    const gridToWorld = (r: number, c: number, rows: number, cols: number) => {
      const offsetX = -((cols - 1) * TILE_SIZE) / 2;
      const offsetZ = -((rows - 1) * TILE_SIZE) / 2;
      return {
        x: offsetX + c * TILE_SIZE,
        z: offsetZ + r * TILE_SIZE,
      };
    };

    const rebuildHeroTextures = () => {
      const { activeHero: h, activeFamiliar: fam } = stateRef.current;
      const elemHex = ELEMENTAL_HEX[h.backgroundStyle] ?? 0xe94057;
      heroRingMat.color.setHex(elemHex);
      heroRingMat.emissive.setHex(elemHex);
      torsoMat.color.setHex(elemHex);

      const hexStr = `#${elemHex.toString(16).padStart(6, '0')}`;
      if (heroSpriteMat.map) heroSpriteMat.map.dispose();
      heroSpriteMat.map = createEmojiCanvasTexture(h.baseEmoji, hexStr, '#ffffff', maxAnisotropy);
      heroSpriteMat.needsUpdate = true;

      if (accSpriteMat.map) accSpriteMat.map.dispose();
      accSpriteMat.map = createEmojiCanvasTexture(
        h.accessoryEmoji,
        '#ffffff',
        hexStr,
        maxAnisotropy
      );
      accSpriteMat.needsUpdate = true;

      if (flagSpriteMat.map) flagSpriteMat.map.dispose();
      flagSpriteMat.map = createEmojiCanvasTexture(
        h.flagEmoji,
        '#1e1b2e',
        '#fbbf24',
        maxAnisotropy
      );
      flagSpriteMat.needsUpdate = true;

      if (familiarSpriteMat.map) familiarSpriteMat.map.dispose();
      familiarSpriteMat.map = createEmojiCanvasTexture(
        fam?.emoji ?? '🦉',
        '#0f172a',
        '#38bdf8',
        maxAnisotropy
      );
      familiarSpriteMat.needsUpdate = true;
    };
    rebuildHeroTexturesRef.current = rebuildHeroTextures;
    rebuildHeroTextures();

    // Shared Geometries & Materials for Collectibles, Traps, Portals, Keys, Shrines, Enemies
    const starOctaGeo = new THREE.OctahedronGeometry(0.42, 0);
    const starOctaMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      metalness: 0.8,
      roughness: 0.18,
    });
    const starBaseGeo = new THREE.CylinderGeometry(0.36, 0.46, 0.14, 16);
    const starBaseMat = new THREE.MeshStandardMaterial({
      color: 0x3b2d66,
      metalness: 0.6,
      roughness: 0.45,
    });

    const chestBoxGeo = new THREE.BoxGeometry(0.76, 0.48, 0.56);
    const chestLidGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.76, 16, 1, false, 0, Math.PI);
    chestLidGeo.rotateZ(Math.PI / 2);
    const chestWoodMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.7,
      metalness: 0.2,
    });
    const chestGoldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      metalness: 0.9,
      roughness: 0.2,
    });

    const shrinePillarGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.75, 8);
    const shrinePillarMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      metalness: 0.5,
      roughness: 0.3,
    });

    const portalTorusGeo = new THREE.TorusGeometry(0.58, 0.08, 12, 28);
    portalTorusGeo.rotateX(Math.PI / 2);
    const portalMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8,
    });

    const spikeConeGeo = new THREE.ConeGeometry(0.16, 0.42, 8);
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      metalness: 0.85,
      roughness: 0.25,
    });

    const starIconTex = createEmojiCanvasTexture('⭐', '#451a03', '#fbbf24', maxAnisotropy);
    const chestIconTex = createEmojiCanvasTexture('🎁', '#451a03', '#f59e0b', maxAnisotropy);
    const keyIconTex = createEmojiCanvasTexture('🗝️', '#451a03', '#fde047', maxAnisotropy);
    const leverClosedTex = createEmojiCanvasTexture('🎚️', '#3b0764', '#c084fc', maxAnisotropy);
    const leverOpenTex = createEmojiCanvasTexture('🎚️', '#064e3b', '#34d399', maxAnisotropy);
    const merchantIconTex = createEmojiCanvasTexture('🐪', '#451a03', '#fbbf24', maxAnisotropy);
    const shrineIconTex = createEmojiCanvasTexture('⛩️', '#064e3b', '#34d399', maxAnisotropy);
    const portalIconTex = createEmojiCanvasTexture('🌀', '#083344', '#22d3ee', maxAnisotropy);
    const exitIconTex = createEmojiCanvasTexture('🏁', '#064e3b', '#34d399', maxAnisotropy);
    const lockedExitTex = createEmojiCanvasTexture('🔒', '#450a0a', '#f43f5e', maxAnisotropy);

    let exitGateSprite: THREE.Sprite | null = null;
    let exitArchBarMesh: THREE.Mesh | null = null;
    const phaseGateMeshes: THREE.Mesh[] = [];

    const enemyMeshesMap = new Map<
      string,
      {
        group: THREE.Group;
        telegraphRing: THREE.Mesh;
        emojiTag: string;
      }
    >();

    const syncDynamicEntities = () => {
      const {
        maze: m,
        starsRemaining: stars,
        chestsRemaining: chests,
        shrinesRemaining: shrines,
        keyCollected: hasKey,
        phaseGatesOpen: gatesOpen,
        enemyFrozenTurns: frozenTurns,
        enemies: ens,
      } = stateRef.current;

      while (collectiblesGroup.children.length > 0) {
        collectiblesGroup.remove(collectiblesGroup.children[0]);
      }

      // Update Exit Gate Lock/Unlock visual state
      if (exitGateSprite) {
        (exitGateSprite.material as THREE.SpriteMaterial).map = hasKey
          ? exitIconTex
          : lockedExitTex;
        (exitGateSprite.material as THREE.SpriteMaterial).needsUpdate = true;
      }
      if (exitArchBarMesh) {
        exitArchBarMesh.visible = !hasKey;
      }

      // 1. Stars ⭐
      stars.forEach((sPos) => {
        const w = gridToWorld(sPos.r, sPos.c, m.rows, m.cols);
        const sGroup = new THREE.Group();
        sGroup.position.set(w.x, 0, w.z);

        const sShadow = new THREE.Mesh(shadowDiscGeo, contactShadowMat);
        sShadow.position.y = 0.015;
        sShadow.scale.setScalar(0.75);
        sGroup.add(sShadow);

        const sPedestal = new THREE.Mesh(starBaseGeo, starBaseMat);
        sPedestal.position.y = 0.07;
        sGroup.add(sPedestal);

        const sCrystal = new THREE.Mesh(starOctaGeo, starOctaMat);
        sCrystal.position.y = 0.65;
        sCrystal.name = 'spinCrystal';
        sGroup.add(sCrystal);

        const sSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: starIconTex }));
        sSprite.position.set(0, 1.32, 0);
        sSprite.scale.set(0.72, 0.72, 1);
        sGroup.add(sSprite);

        collectiblesGroup.add(sGroup);
      });

      // 2. Treasure Chests 🎁
      chests.forEach((cPos) => {
        const w = gridToWorld(cPos.r, cPos.c, m.rows, m.cols);
        const cGroup = new THREE.Group();
        cGroup.position.set(w.x, 0, w.z);

        const cShadow = new THREE.Mesh(shadowDiscGeo, contactShadowMat);
        cShadow.position.y = 0.015;
        cShadow.scale.setScalar(0.85);
        cGroup.add(cShadow);

        const box = new THREE.Mesh(chestBoxGeo, chestWoodMat);
        box.position.y = 0.24;
        cGroup.add(box);

        const lid = new THREE.Mesh(chestLidGeo, chestGoldMat);
        lid.position.y = 0.48;
        cGroup.add(lid);

        const cSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: chestIconTex }));
        cSprite.position.set(0, 1.15, 0);
        cSprite.scale.set(0.75, 0.75, 1);
        cGroup.add(cSprite);

        collectiblesGroup.add(cGroup);
      });

      // 3. Golden Key 🗝️ (if not collected yet)
      if (!hasKey && m.keyPos) {
        const w = gridToWorld(m.keyPos.r, m.keyPos.c, m.rows, m.cols);
        const kGroup = new THREE.Group();
        kGroup.position.set(w.x, 0, w.z);

        const kPedestal = new THREE.Mesh(starBaseGeo, chestGoldMat);
        kPedestal.position.y = 0.08;
        kGroup.add(kPedestal);

        const kCrystal = new THREE.Mesh(starOctaGeo, chestGoldMat);
        kCrystal.position.y = 0.65;
        kCrystal.name = 'spinCrystal';
        kGroup.add(kCrystal);

        const kSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: keyIconTex }));
        kSprite.position.set(0, 1.35, 0);
        kSprite.scale.set(0.85, 0.85, 1);
        kGroup.add(kSprite);

        collectiblesGroup.add(kGroup);
      }

      // 3b. Architect's Lever 🎚️ (toggles 4.0D Phase Gates 🟪)
      if (m.leverPos) {
        const w = gridToWorld(m.leverPos.r, m.leverPos.c, m.rows, m.cols);
        const lGroup = new THREE.Group();
        lGroup.position.set(w.x, 0, w.z);

        const lPedestal = new THREE.Mesh(starBaseGeo, portalMat);
        lPedestal.position.y = 0.08;
        lGroup.add(lPedestal);

        const lSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: gatesOpen ? leverOpenTex : leverClosedTex })
        );
        lSprite.position.set(0, 1.15, 0);
        lSprite.scale.set(0.82, 0.82, 1);
        lGroup.add(lSprite);

        collectiblesGroup.add(lGroup);
      }

      // 3c. Wandering Caravan Merchant 🐪 (Alchemist Bazaar in 3D Maze)
      if (m.merchantPos) {
        const w = gridToWorld(m.merchantPos.r, m.merchantPos.c, m.rows, m.cols);
        const mGroup = new THREE.Group();
        mGroup.position.set(w.x, 0, w.z);

        const mCarpet = new THREE.Mesh(portalTorusGeo, chestGoldMat);
        mCarpet.position.y = 0.07;
        mGroup.add(mCarpet);

        const mPedestal = new THREE.Mesh(starBaseGeo, chestWoodMat);
        mPedestal.position.y = 0.14;
        mGroup.add(mPedestal);

        const mSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: merchantIconTex }));
        mSprite.position.set(0, 1.24, 0);
        mSprite.scale.set(0.88, 0.88, 1);
        mGroup.add(mSprite);

        collectiblesGroup.add(mGroup);
      }

      // 4. Ancient Shrines ⛩️
      shrines.forEach((shPos) => {
        const w = gridToWorld(shPos.r, shPos.c, m.rows, m.cols);
        const shGroup = new THREE.Group();
        shGroup.position.set(w.x, 0, w.z);

        const pillar = new THREE.Mesh(shrinePillarGeo, shrinePillarMat);
        pillar.position.y = 0.38;
        shGroup.add(pillar);

        const shSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: shrineIconTex }));
        shSprite.position.set(0, 1.25, 0);
        shSprite.scale.set(0.82, 0.82, 1);
        sGroupAdd(shGroup, shSprite);

        collectiblesGroup.add(shGroup);
      });

      function sGroupAdd(g: THREE.Group, s: THREE.Object3D) {
        g.add(s);
      }

      // 5. Quantum Portals 🌀 (A and B)
      if (m.portals) {
        [m.portals.a, m.portals.b].forEach((pPos) => {
          const w = gridToWorld(pPos.r, pPos.c, m.rows, m.cols);
          const pGroup = new THREE.Group();
          pGroup.position.set(w.x, 0, w.z);

          const ring = new THREE.Mesh(portalTorusGeo, portalMat);
          ring.position.y = 0.08;
          pGroup.add(ring);

          const pSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: portalIconTex }));
          pSprite.position.set(0, 0.95, 0);
          pSprite.scale.set(0.75, 0.75, 1);
          pGroup.add(pSprite);

          collectiblesGroup.add(pGroup);
        });
      }

      // 6. Mechanical Floor Spike Traps ⚙️
      m.traps.forEach((tPos) => {
        const w = gridToWorld(tPos.r, tPos.c, m.rows, m.cols);
        const tGroup = new THREE.Group();
        tGroup.position.set(w.x, 0, w.z);

        const offsets = [
          [-0.3, -0.3],
          [0.3, -0.3],
          [-0.3, 0.3],
          [0.3, 0.3],
        ];
        offsets.forEach(([ox, oz]) => {
          const cone = new THREE.Mesh(spikeConeGeo, spikeMat);
          cone.position.set(ox, 0.21, oz);
          tGroup.add(cone);
        });
        collectiblesGroup.add(tGroup);
      });

      // 7. Sync Enemy 3D Rigs
      const activeIds = new Set(ens.map((e) => e.id));
      for (const [id, entry] of enemyMeshesMap.entries()) {
        if (!activeIds.has(id)) {
          enemiesGroup.remove(entry.group);
          enemyMeshesMap.delete(id);
        }
      }

      ens.forEach((enemy) => {
        const w = gridToWorld(enemy.r, enemy.c, m.rows, m.cols);
        let entry = enemyMeshesMap.get(enemy.id);
        if (!entry) {
          const eGroup = new THREE.Group();
          eGroup.position.set(w.x, 0, w.z);

          const eShadow = new THREE.Mesh(shadowDiscGeo, contactShadowMat);
          eShadow.position.y = 0.015;
          eGroup.add(eShadow);

          const teleGeo = new THREE.RingGeometry(0.55, 0.78, 24);
          teleGeo.rotateX(-Math.PI / 2);
          const teleMat = new THREE.MeshBasicMaterial({
            color: 0xf43f5e,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const teleRing = new THREE.Mesh(teleGeo, teleMat);
          teleRing.position.y = 0.025;
          eGroup.add(teleRing);

          const bodyColor =
            enemy.policy === 'CHASER'
              ? 0xe11d48
              : enemy.policy === 'PATROLLER'
              ? 0x9333ea
              : 0xd97706;

          const bodyCone = new THREE.Mesh(
            new THREE.ConeGeometry(0.52, 0.9, 16),
            new THREE.MeshStandardMaterial({
              color: bodyColor,
              roughness: 0.45,
              metalness: 0.4,
            })
          );
          bodyCone.position.y = 0.48;
          eGroup.add(bodyCone);

          const crownSpikes = new THREE.Mesh(
            new THREE.TorusGeometry(0.38, 0.06, 8, 16),
            new THREE.MeshStandardMaterial({
              color: 0xfbbf24,
              metalness: 0.85,
              roughness: 0.2,
            })
          );
          crownSpikes.rotation.x = Math.PI / 2;
          crownSpikes.position.y = 0.55;
          eGroup.add(crownSpikes);

          const eTex = createEmojiCanvasTexture(
            enemy.emoji,
            '#3b071e',
            '#fb7185',
            maxAnisotropy
          );
          const eSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: eTex }));
          eSprite.position.set(0, 1.32, 0);
          eSprite.scale.set(1.12, 1.12, 1);
          eGroup.add(eSprite);

          enemiesGroup.add(eGroup);
          entry = { group: eGroup, telegraphRing: teleRing, emojiTag: enemy.emoji };
          enemyMeshesMap.set(enemy.id, entry);
        }

        const mat = entry.telegraphRing.material as THREE.MeshBasicMaterial;
        if (frozenTurns > 0) {
          mat.color.setHex(0x22d3ee);
          mat.opacity = 0.9;
          entry.telegraphRing.scale.setScalar(1.24);
        } else {
          mat.color.setHex(0xf43f5e);
          mat.opacity = enemy.telegraphing ? 0.85 : 0.22;
          entry.telegraphRing.scale.setScalar(enemy.telegraphing ? 1.18 : 1.0);
        }
      });
    };
    syncDynamicEntitiesRef.current = syncDynamicEntities;

    const rebuildLevelGeometry = () => {
      const { maze: m, biomeKey: bKey, playerPos: pPos } = stateRef.current;
      const biome = BIOMES[bKey] ?? BIOMES.CYBER_NEON;

      // Update scene atmosphere & lighting to match active Biome!
      scene.background = new THREE.Color(biome.skyHex);
      scene.fog = new THREE.FogExp2(biome.fogHex, biome.fogDensity);
      keyLight.color.setHex(biome.keyLightHex);
      rimLight.color.setHex(biome.rimLightHex);

      // In Medieval Citadel biome, dim global lights and activate warm Hero Torchlight!
      if (bKey === 'MEDIEVAL_CITADEL') {
        keyLight.intensity = 0.85;
        hemiLight.intensity = 0.55;
        heroTorchLight.intensity = 4.2;
      } else {
        keyLight.intensity = 2.0;
        hemiLight.intensity = 1.3;
        heroTorchLight.intensity = 0;
      }

      const floorTextures = createFloorGridTexture(
        biome.floorFill,
        biome.floorStroke,
        maxAnisotropy
      );
      const wallTex = createWallBlockTexture(biome.wallFill, biome.wallStroke, maxAnisotropy);

      while (levelGroup.children.length > 0) {
        levelGroup.remove(levelGroup.children[0]);
      }
      floorTiles.length = 0;
      phaseGateMeshes.length = 0;
      enemyMeshesMap.clear();
      while (enemiesGroup.children.length > 0) {
        enemiesGroup.remove(enemiesGroup.children[0]);
      }

      const boardW = m.cols * TILE_SIZE;
      const boardH = m.rows * TILE_SIZE;

      const platformGeo = new THREE.BoxGeometry(boardW + 2.4, 0.8, boardH + 2.4);
      const platformMat = new THREE.MeshStandardMaterial({
        color: biome.skyHex,
        roughness: 0.8,
        metalness: 0.2,
      });
      const platformMesh = new THREE.Mesh(platformGeo, platformMat);
      platformMesh.position.y = -0.42;
      platformMesh.receiveShadow = !isSoftwareGl;
      levelGroup.add(platformMesh);

      const wallCoords: { r: number; c: number }[] = [];
      const walkableCoords: { r: number; c: number }[] = [];
      const phaseSet = new Set((m.phaseGates ?? []).map((g) => `${g.r},${g.c}`));

      for (let r = 0; r < m.rows; r++) {
        for (let c = 0; c < m.cols; c++) {
          if (phaseSet.has(`${r},${c}`)) {
            walkableCoords.push({ r, c });
          } else if (m.grid[r][c] === 'WALL') {
            wallCoords.push({ r, c });
          } else {
            walkableCoords.push({ r, c });
          }
        }
      }

      const tileGeo = new THREE.PlaneGeometry(TILE_SIZE * 0.98, TILE_SIZE * 0.98);
      tileGeo.rotateX(-Math.PI / 2);
      const tileMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: floorTextures.map,
        bumpMap: floorTextures.bumpMap,
        bumpScale: 0.03,
        roughness: 0.72,
        metalness: 0.15,
      });

      walkableCoords.forEach(({ r, c }) => {
        const w = gridToWorld(r, c, m.rows, m.cols);
        const fMesh = new THREE.Mesh(tileGeo, tileMat);
        fMesh.position.set(w.x, 0.005, w.z);
        fMesh.receiveShadow = !isSoftwareGl;
        fMesh.userData = { r, c };
        levelGroup.add(fMesh);
        floorTiles.push(fMesh);
      });

      const wallHeight = 1.55;
      const wallGeo = new THREE.BoxGeometry(TILE_SIZE * 0.96, wallHeight, TILE_SIZE * 0.96);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: wallTex,
        roughness: 0.65,
        metalness: 0.22,
      });

      // 4.0D Dynamic Phase Gates (Tesseract Monoliths that slide down into the floor when lever is activated!)
      const phaseGateMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x7e22ce,
        emissiveIntensity: 0.55,
        roughness: 0.25,
        metalness: 0.75,
        transparent: true,
        opacity: 0.88,
      });
      (m.phaseGates ?? []).forEach(({ r, c }) => {
        const w = gridToWorld(r, c, m.rows, m.cols);
        const gMesh = new THREE.Mesh(wallGeo, phaseGateMat);
        gMesh.position.set(w.x, wallHeight / 2, w.z);
        levelGroup.add(gMesh);
        phaseGateMeshes.push(gMesh);
      });
      const wallInstanced = new THREE.InstancedMesh(wallGeo, wallMat, wallCoords.length);
      wallInstanced.castShadow = !isSoftwareGl;
      wallInstanced.receiveShadow = !isSoftwareGl;

      const capGeo = new THREE.BoxGeometry(TILE_SIZE * 0.86, 0.12, TILE_SIZE * 0.86);
      const capMat = new THREE.MeshStandardMaterial({
        color: biome.capHex,
        roughness: 0.25,
        metalness: 0.7,
      });
      const capInstanced = new THREE.InstancedMesh(capGeo, capMat, wallCoords.length);

      wallCoords.forEach(({ r, c }, idx) => {
        const w = gridToWorld(r, c, m.rows, m.cols);
        const isBorder = r === 0 || c === 0 || r === m.rows - 1 || c === m.cols - 1;
        const hScale = isBorder ? 1.15 : 0.95 + ((r * 7 + c * 13) % 5) * 0.03;

        _dummyPos.set(w.x, (wallHeight * hScale) / 2, w.z);
        _dummyQuat.identity();
        _dummyScale.set(1, hScale, 1);
        _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
        wallInstanced.setMatrixAt(idx, _dummyMat);

        const shade = isBorder ? biome.borderTintHex : biome.innerTintHex;
        _dummyColor.setHex(shade);
        wallInstanced.setColorAt(idx, _dummyColor);

        _dummyPos.set(w.x, wallHeight * hScale + 0.05, w.z);
        _dummyScale.set(1, 1, 1);
        _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
        capInstanced.setMatrixAt(idx, _dummyMat);
      });

      wallInstanced.instanceMatrix.needsUpdate = true;
      if (wallInstanced.instanceColor) wallInstanced.instanceColor.needsUpdate = true;
      wallInstanced.computeBoundingSphere();

      capInstanced.instanceMatrix.needsUpdate = true;
      capInstanced.computeBoundingSphere();

      levelGroup.add(wallInstanced);
      levelGroup.add(capInstanced);

      // 6-Part Composite 3D Exit Portal Gate at maze.exit (with Iron Portcullis Bar when locked)
      const exitW = gridToWorld(m.exit.r, m.exit.c, m.rows, m.cols);
      const exitGateGroup = new THREE.Group();
      exitGateGroup.position.set(exitW.x, 0, exitW.z);

      const pillarGeo = new THREE.CylinderGeometry(0.16, 0.2, 1.85, 14);
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        metalness: 0.75,
        roughness: 0.25,
      });
      const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
      leftPillar.position.set(-0.68, 0.92, 0);
      exitGateGroup.add(leftPillar);

      const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
      rightPillar.position.set(0.68, 0.92, 0);
      exitGateGroup.add(rightPillar);

      const archLintel = new THREE.Mesh(
        new THREE.BoxGeometry(1.65, 0.26, 0.36),
        new THREE.MeshStandardMaterial({
          color: 0xfbbf24,
          metalness: 0.85,
          roughness: 0.2,
        })
      );
      archLintel.position.set(0, 1.9, 0);
      exitGateGroup.add(archLintel);

      const lockBarMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.32, 0.14, 0.14),
        new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          emissive: 0xe11d48,
          emissiveIntensity: 0.6,
        })
      );
      lockBarMesh.position.set(0, 0.85, 0);
      exitArchBarMesh = lockBarMesh;
      exitGateGroup.add(lockBarMesh);

      const vortexDisc = new THREE.Mesh(
        new THREE.CircleGeometry(0.68, 24),
        new THREE.MeshBasicMaterial({
          color: 0x34d399,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      vortexDisc.rotation.x = -Math.PI / 2;
      vortexDisc.position.y = 0.03;
      exitGateGroup.add(vortexDisc);

      const exitSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: exitIconTex }));
      exitSprite.position.set(0, 1.15, 0);
      exitSprite.scale.set(0.95, 0.95, 1);
      exitGateSprite = exitSprite;
      exitGateGroup.add(exitSprite);

      levelGroup.add(exitGateGroup);

      const startW = gridToWorld(pPos.r, pPos.c, m.rows, m.cols);
      heroGroup.position.set(startW.x, 0, startW.z);

      syncDynamicEntities();
    };

    rebuildLevelRef.current = rebuildLevelGeometry;
    rebuildLevelGeometry();

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(floorTiles, false);
      if (hits.length > 0) {
        const hitTile = hits[0].object;
        const { r, c } = hitTile.userData as { r: number; c: number };
        const { playerPos: curP, onMoveStep: moveCb } = stateRef.current;
        const dr = r - curP.r;
        const dc = c - curP.c;
        if (Math.abs(dr) + Math.abs(dc) === 1) {
          moveCb(dr, dc);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // =========================================================
    // 1.5D / 2.5D / 3.5D INTERMEDIATE DIMENSIONAL VFX RIGS
    // =========================================================
    // 1.5D Waveguide Nodes & Ribbon
    const pathNodeGeo = new THREE.OctahedronGeometry(0.18, 0);
    const pathNodeMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.7,
    });
    const pathRingGeo = new THREE.RingGeometry(0.14, 0.24, 16);
    pathRingGeo.rotateX(-Math.PI / 2);
    const pathRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const pathGuideGroup = new THREE.Group();
    scene.add(pathGuideGroup);

    const waveguideLineMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.75,
    });
    const maxWavePoints = 80;
    const waveguidePositions = new Float32Array(maxWavePoints * 3);
    const waveguideGeo = new THREE.BufferGeometry();
    waveguideGeo.setAttribute('position', new THREE.BufferAttribute(waveguidePositions, 3));
    waveguideGeo.setDrawRange(0, 0);
    const waveguideLine = new THREE.Line(waveguideGeo, waveguideLineMat);
    scene.add(waveguideLine);

    // 2.5D Zero-GC Instanced Particle Burst Engine (48 Ballistic Crystal Shards)
    const PARTICLE_COUNT = 48;
    const shardGeo = new THREE.OctahedronGeometry(0.14, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.8,
    });
    const particleInstanced = new THREE.InstancedMesh(shardGeo, shardMat, PARTICLE_COUNT);
    particleInstanced.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particleInstanced);

    const partPosX = new Float32Array(PARTICLE_COUNT);
    const partPosY = new Float32Array(PARTICLE_COUNT);
    const partPosZ = new Float32Array(PARTICLE_COUNT);
    const partVelX = new Float32Array(PARTICLE_COUNT);
    const partVelY = new Float32Array(PARTICLE_COUNT);
    const partVelZ = new Float32Array(PARTICLE_COUNT);
    const partLife = new Float32Array(PARTICLE_COUNT);
    const partMaxLife = new Float32Array(PARTICLE_COUNT);
    let particleCursor = 0;

    // Hide all particles initially
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      _dummyPos.set(0, -10, 0);
      _dummyQuat.identity();
      _dummyScale.setScalar(0.001);
      _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
      particleInstanced.setMatrixAt(i, _dummyMat);
      _dummyColor.setHex(0xfbbf24);
      particleInstanced.setColorAt(i, _dummyColor);
    }
    particleInstanced.instanceMatrix.needsUpdate = true;
    if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;

    const triggerParticleBurst = (wx: number, wz: number, colorHex: number, count: number = 20) => {
      shardMat.emissive.setHex(colorHex);
      for (let k = 0; k < count; k++) {
        const idx = (particleCursor + k) % PARTICLE_COUNT;
        const angle = (Math.PI * 2 * k) / count + (k % 3) * 0.2;
        const speed = 2.2 + (k % 5) * 0.65;
        partPosX[idx] = wx + Math.cos(angle) * 0.2;
        partPosY[idx] = 0.65 + (k % 3) * 0.15;
        partPosZ[idx] = wz + Math.sin(angle) * 0.2;
        partVelX[idx] = Math.cos(angle) * speed;
        partVelY[idx] = 4.2 + (k % 4) * 1.1;
        partVelZ[idx] = Math.sin(angle) * speed;
        partMaxLife[idx] = 0.75 + (k % 3) * 0.18;
        partLife[idx] = partMaxLife[idx];
        _dummyColor.setHex(k % 2 === 0 ? colorHex : 0xffffff);
        particleInstanced.setColorAt(idx, _dummyColor);
      }
      particleCursor = (particleCursor + count) % PARTICLE_COUNT;
      if (particleInstanced.instanceColor) particleInstanced.instanceColor.needsUpdate = true;
    };

    // 3.5D Quantum-Chrono Afterimage Ghosts (4 Past Positions + Temporal Ribbon)
    const MAX_GHOSTS = 4;
    const ghostColors = [0x22d3ee, 0x38bdf8, 0x818cf8, 0xe879f9];
    const ghostConeGeo = new THREE.ConeGeometry(0.38, 0.78, 12);
    const ghostRingGeo = new THREE.TorusGeometry(0.48, 0.04, 8, 20);
    ghostRingGeo.rotateX(Math.PI / 2);

    const ghostMeshes: THREE.Group[] = [];
    const chronoGhostsGroup = new THREE.Group();
    scene.add(chronoGhostsGroup);

    for (let g = 0; g < MAX_GHOSTS; g++) {
      const gGroup = new THREE.Group();
      const gMat = new THREE.MeshBasicMaterial({
        color: ghostColors[g],
        transparent: true,
        opacity: 0.44 - g * 0.08,
        wireframe: g % 2 === 1,
        depthWrite: false,
      });
      const cone = new THREE.Mesh(ghostConeGeo, gMat);
      cone.position.y = 0.45;
      gGroup.add(cone);

      const ring = new THREE.Mesh(
        ghostRingGeo,
        new THREE.MeshBasicMaterial({
          color: ghostColors[g],
          transparent: true,
          opacity: 0.6 - g * 0.1,
          depthWrite: false,
        })
      );
      ring.position.y = 0.12;
      gGroup.add(ring);

      gGroup.visible = false;
      chronoGhostsGroup.add(gGroup);
      ghostMeshes.push(gGroup);
    }

    const chronoRibbonPos = new Float32Array((MAX_GHOSTS + 1) * 3);
    const chronoRibbonGeo = new THREE.BufferGeometry();
    chronoRibbonGeo.setAttribute('position', new THREE.BufferAttribute(chronoRibbonPos, 3));
    chronoRibbonGeo.setDrawRange(0, 0);
    const chronoRibbonLine = new THREE.Line(
      chronoRibbonGeo,
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
    );
    scene.add(chronoRibbonLine);

    // 3.5D Quantum Phase Target Portal (Landing Tile Across Wall for [Q])
    const quantumTargetGroup = new THREE.Group();
    quantumTargetGroup.visible = false;
    scene.add(quantumTargetGroup);

    const qOuterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.64, 0.055, 10, 28),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      })
    );
    qOuterRing.rotation.x = Math.PI / 2;
    qOuterRing.position.y = 0.08;
    quantumTargetGroup.add(qOuterRing);

    const qInnerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.42, 0.04, 10, 24),
      new THREE.MeshBasicMaterial({
        color: 0xe879f9,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      })
    );
    qInnerRing.rotation.x = Math.PI / 2;
    qInnerRing.position.y = 0.24;
    quantumTargetGroup.add(qInnerRing);

    const qPillarGeo = new THREE.CylinderGeometry(0.36, 0.36, 3.2, 16, 1, true);
    const qPillarMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.24,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const qPillarMesh = new THREE.Mesh(qPillarGeo, qPillarMat);
    qPillarMesh.position.y = 1.6;
    quantumTargetGroup.add(qPillarMesh);

    // 3.5D Astral X-Ray Beacon Pillar above Golden Key / Exit
    const astralKeyBeacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 4.2, 14, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.28,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    astralKeyBeacon.visible = false;
    scene.add(astralKeyBeacon);

    // 4.5D Atmospheric Weather Anomaly Field (Zero-GC Points Buffer)
    const WEATHER_COUNT = 36;
    const weatherPositions = new Float32Array(WEATHER_COUNT * 3);
    for (let w = 0; w < WEATHER_COUNT; w++) {
      weatherPositions[w * 3] = ((w % 6) - 2.5) * 3.8;
      weatherPositions[w * 3 + 1] = 0.5 + (w % 5) * 0.9;
      weatherPositions[w * 3 + 2] = (Math.floor(w / 6) - 2.5) * 3.8;
    }
    const weatherGeo = new THREE.BufferGeometry();
    weatherGeo.setAttribute('position', new THREE.BufferAttribute(weatherPositions, 3));
    const weatherMat = new THREE.PointsMaterial({
      color: 0xc084fc,
      size: 0.22,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const weatherPoints = new THREE.Points(weatherGeo, weatherMat);
    scene.add(weatherPoints);

    let lastFrameTime = performance.now();
    const startTime = lastFrameTime;
    let frameId = 0;
    let isDisposed = false;
    let lastAdjacentKey = '';
    let lastBurstId = -1;
    let currentWaveNodesCount = 0;

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    const currentLookAt = new THREE.Vector3(0, 0, 0);

    function tick() {
      if (isDisposed) return;
      const now = performance.now();
      const rawDt = Math.max(0.001, (now - lastFrameTime) / 1000);
      lastFrameTime = now;
      const dt = Math.min(rawDt, 0.05);
      const elapsed = (now - startTime) / 1000;

      const {
        maze: m,
        playerPos: pPos,
        starsRemaining: stars,
        keyCollected: hasKey,
        enemies: ens,
        cameraMode: camMode,
        boardShake: shake,
        phaseGatesOpen: gatesOpen,
        historyPositions: histPos,
        quantumTarget: qTarget,
        vfxBurst: burst,
      } = stateRef.current;

      // Animate 4.0D Phase Gates sliding smoothly into/out of floor
      const targetGateY = gatesOpen ? -0.68 : 0.78;
      phaseGateMeshes.forEach((gMesh) => {
        gMesh.position.y = THREE.MathUtils.damp(gMesh.position.y, targetGateY, 8, dt);
      });

      const targetHeroW = gridToWorld(pPos.r, pPos.c, m.rows, m.cols);
      heroGroup.position.x = THREE.MathUtils.damp(
        heroGroup.position.x,
        targetHeroW.x,
        12,
        dt
      );
      heroGroup.position.z = THREE.MathUtils.damp(
        heroGroup.position.z,
        targetHeroW.z,
        12,
        dt
      );

      heroFloatPivot.position.y = 1.25 + Math.sin(elapsed * 3.2) * 0.08;
      orbitPivot.rotation.y = elapsed * 1.4;

      // Trigger 2.5D Ballistic Particle Burst when vfxBurst event fires
      if (burst && burst.id !== lastBurstId) {
        lastBurstId = burst.id;
        const bw = gridToWorld(burst.r, burst.c, m.rows, m.cols);
        triggerParticleBurst(bw.x, bw.z, burst.colorHex, 24);
      }

      const adjKey = `${pPos.r},${pPos.c}:${stars.length}:${hasKey ? 1 : 0}:${gatesOpen ? 1 : 0}`;
      if (adjKey !== lastAdjacentKey) {
        if (lastAdjacentKey !== '') {
          // Small footstep spark burst on movement
          triggerParticleBurst(targetHeroW.x, targetHeroW.z, 0x38bdf8, 8);
        }
        lastAdjacentKey = adjKey;
        while (adjacentRingsGroup.children.length > 0) {
          adjacentRingsGroup.remove(adjacentRingsGroup.children[0]);
        }
        while (pathGuideGroup.children.length > 0) {
          pathGuideGroup.remove(pathGuideGroup.children[0]);
        }
        const phaseGateLookup = new Set((m.phaseGates ?? []).map((g) => `${g.r},${g.c}`));
        const isTileOpen = (rr: number, cc: number) =>
          rr >= 0 &&
          rr < m.rows &&
          cc >= 0 &&
          cc < m.cols &&
          (m.grid[rr][cc] !== 'WALL' || (gatesOpen && phaseGateLookup.has(`${rr},${cc}`)));

        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        dirs.forEach(([dr, dc]) => {
          const nr = pPos.r + dr;
          const nc = pPos.c + dc;
          if (isTileOpen(nr, nc)) {
            const rw = gridToWorld(nr, nc, m.rows, m.cols);
            const rMesh = new THREE.Mesh(highlightRingGeo, highlightRingMat);
            rMesh.position.set(rw.x, 0.02, rw.z);
            adjacentRingsGroup.add(rMesh);
          }
        });

        // Priority BFS target: Key 🗝️ (if locked) -> Nearest Star ⭐ -> Exit 🏁
        const goal =
          !hasKey && m.keyPos
            ? m.keyPos
            : stars.length > 0
            ? stars.reduce((best, curr) => {
                const bDist = Math.abs(best.r - pPos.r) + Math.abs(best.c - pPos.c);
                const cDist = Math.abs(curr.r - pPos.r) + Math.abs(curr.c - pPos.c);
                return cDist < bDist ? curr : best;
              }, stars[0])
            : m.exit;

        const queue: { r: number; c: number; path: { r: number; c: number }[] }[] = [
          { r: pPos.r, c: pPos.c, path: [] },
        ];
        const seen = new Set<string>([`${pPos.r},${pPos.c}`]);
        let foundPath: { r: number; c: number }[] = [];

        while (queue.length > 0) {
          const cur = queue.shift()!;
          if (cur.r === goal.r && cur.c === goal.c) {
            foundPath = cur.path;
            break;
          }
          for (const [dr, dc] of dirs) {
            const nr = cur.r + dr;
            const nc = cur.c + dc;
            const key = `${nr},${nc}`;
            if (isTileOpen(nr, nc) && !seen.has(key)) {
              seen.add(key);
              queue.push({ r: nr, c: nc, path: [...cur.path, { r: nr, c: nc }] });
            }
          }
        }

        const trimmedPath = foundPath.slice(0, maxWavePoints - 1);
        currentWaveNodesCount = trimmedPath.length;
        trimmedPath.forEach((step) => {
          const sw = gridToWorld(step.r, step.c, m.rows, m.cols);
          const nodeGroup = new THREE.Group();
          nodeGroup.position.set(sw.x, 0.02, sw.z);

          const baseRing = new THREE.Mesh(pathRingGeo, pathRingMat);
          nodeGroup.add(baseRing);

          const crystalNode = new THREE.Mesh(pathNodeGeo, pathNodeMat);
          crystalNode.position.y = 0.18;
          crystalNode.name = 'waveCrystal';
          nodeGroup.add(crystalNode);

          pathGuideGroup.add(nodeGroup);
        });
      }

      // 1.5D Spectral Waveguide Animation: sinusoidal travelling wave along BFS path
      const isWaveMode = camMode === '1.5d-wave';
      const waveAmp = isWaveMode ? 0.44 : 0.16;
      const waveFreq = isWaveMode ? 5.2 : 3.4;

      if (currentWaveNodesCount > 0) {
        waveguidePositions[0] = heroGroup.position.x;
        waveguidePositions[1] = 0.35;
        waveguidePositions[2] = heroGroup.position.z;

        pathGuideGroup.children.forEach((nodeGroup, idx) => {
          const phase = idx * 0.65 - elapsed * waveFreq;
          const waveVal = Math.pow(Math.max(0, Math.cos(phase)), 2);
          const yHeight = 0.14 + waveAmp * waveVal;
          const crystal = nodeGroup.getObjectByName('waveCrystal');
          if (crystal) {
            crystal.position.y = yHeight;
            crystal.rotation.y = elapsed * 2.5 + idx * 0.4;
            const s = (isWaveMode ? 0.95 : 0.72) + waveVal * (isWaveMode ? 0.65 : 0.32);
            crystal.scale.setScalar(s);
          }
          const ptIdx = (idx + 1) * 3;
          if (ptIdx + 2 < waveguidePositions.length) {
            waveguidePositions[ptIdx] = nodeGroup.position.x;
            waveguidePositions[ptIdx + 1] = yHeight;
            waveguidePositions[ptIdx + 2] = nodeGroup.position.z;
          }
        });
        waveguideGeo.attributes.position.needsUpdate = true;
        waveguideGeo.setDrawRange(0, Math.min(maxWavePoints, currentWaveNodesCount + 1));
        waveguideLineMat.opacity = isWaveMode ? 0.92 : 0.45;
      } else {
        waveguideGeo.setDrawRange(0, 0);
      }

      // 2.5D Ballistic Particle Physics Step (Zero GC)
      let anyParticleActive = false;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (partLife[i] > 0) {
          anyParticleActive = true;
          partLife[i] = Math.max(0, partLife[i] - dt);
          partVelY[i] -= 15.5 * dt; // Gravity
          partPosX[i] += partVelX[i] * dt;
          partPosY[i] += partVelY[i] * dt;
          partPosZ[i] += partVelZ[i] * dt;

          // Floor bounce at y = 0.08
          if (partPosY[i] < 0.08) {
            partPosY[i] = 0.08;
            partVelY[i] = -partVelY[i] * 0.48;
            partVelX[i] *= 0.75;
            partVelZ[i] *= 0.75;
          }

          const lifeRatio = partLife[i] / Math.max(0.01, partMaxLife[i]);
          _dummyPos.set(partPosX[i], partPosY[i], partPosZ[i]);
          _dummyQuat.setFromAxisAngle(_dummyScale.set(0, 1, 0), elapsed * 6 + i);
          _dummyScale.setScalar(Math.max(0.001, lifeRatio * 1.15));
          _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
          particleInstanced.setMatrixAt(i, _dummyMat);
        } else {
          _dummyPos.set(0, -10, 0);
          _dummyScale.setScalar(0.001);
          _dummyMat.compose(_dummyPos, _dummyQuat, _dummyScale);
          particleInstanced.setMatrixAt(i, _dummyMat);
        }
      }
      if (anyParticleActive) {
        particleInstanced.instanceMatrix.needsUpdate = true;
      }

      // 4.5D Sector Weather Anomaly Particle Drift (Zero GC)
      const wKey = stateRef.current.sectorWeather ?? 'CLEAR_AETHER';
      const wMeta = SECTOR_WEATHERS_CATALOG[wKey] ?? SECTOR_WEATHERS_CATALOG.CLEAR_AETHER;
      weatherMat.color.setHex(wMeta.particleColorHex);
      for (let w = 0; w < WEATHER_COUNT; w++) {
        const wyIdx = w * 3 + 1;
        if (wKey === 'METEOR_EMBER') {
          weatherPositions[wyIdx] -= dt * 2.1;
          if (weatherPositions[wyIdx] < 0.2) weatherPositions[wyIdx] = 4.6;
        } else if (wKey === 'CHRONO_MIST') {
          weatherPositions[wyIdx] += dt * 0.9;
          if (weatherPositions[wyIdx] > 4.6) weatherPositions[wyIdx] = 0.3;
        } else {
          weatherPositions[wyIdx] = 1.2 + Math.sin(elapsed * 2.2 + w) * 0.85;
        }
      }
      weatherGeo.attributes.position.needsUpdate = true;

      // 3.5D Quantum-Chrono Afterimage Ghosts & Temporal Ribbon
      const isQuantumMode = camMode === '3.5d-quantum';
      const recentHist = (histPos ?? []).slice(-MAX_GHOSTS).reverse();
      chronoRibbonPos[0] = heroGroup.position.x;
      chronoRibbonPos[1] = 0.48;
      chronoRibbonPos[2] = heroGroup.position.z;
      let ribbonCount = 1;

      for (let g = 0; g < MAX_GHOSTS; g++) {
        const gMesh = ghostMeshes[g];
        const snapPos = recentHist[g];
        if (snapPos && (isQuantumMode || g < 2)) {
          const gw = gridToWorld(snapPos.r, snapPos.c, m.rows, m.cols);
          gMesh.visible = true;
          gMesh.position.set(gw.x, Math.sin(elapsed * 4 + g) * 0.06, gw.z);
          gMesh.rotation.y = -elapsed * 1.8 + g * 0.5;
          const scaleFactor = isQuantumMode ? 1.0 - g * 0.14 : 0.78 - g * 0.15;
          gMesh.scale.setScalar(Math.max(0.35, scaleFactor));

          chronoRibbonPos[ribbonCount * 3] = gw.x;
          chronoRibbonPos[ribbonCount * 3 + 1] = 0.45;
          chronoRibbonPos[ribbonCount * 3 + 2] = gw.z;
          ribbonCount++;
        } else {
          gMesh.visible = false;
        }
      }
      chronoRibbonGeo.attributes.position.needsUpdate = true;
      chronoRibbonGeo.setDrawRange(0, ribbonCount > 1 ? ribbonCount : 0);

      // 3.5D Quantum Phase Target Portal (Landing Tile Across Wall for [Q])
      if (qTarget) {
        const qw = gridToWorld(qTarget.r, qTarget.c, m.rows, m.cols);
        quantumTargetGroup.visible = true;
        quantumTargetGroup.position.set(qw.x, 0, qw.z);
        qOuterRing.rotation.z = elapsed * 2.4;
        qInnerRing.rotation.z = -elapsed * 3.2;
        const pulse = 0.92 + Math.sin(elapsed * 5) * 0.12;
        qOuterRing.scale.setScalar(pulse);
        qPillarMat.opacity = isQuantumMode ? 0.34 : 0.18;
      } else {
        quantumTargetGroup.visible = false;
      }

      // 3.5D Astral Key/Exit Beacon Pillar
      if ((isQuantumMode || isWaveMode) && (!hasKey && m.keyPos)) {
        const kw = gridToWorld(m.keyPos.r, m.keyPos.c, m.rows, m.cols);
        astralKeyBeacon.visible = true;
        astralKeyBeacon.position.set(kw.x, 2.1, kw.z);
        astralKeyBeacon.rotation.y = elapsed * 1.5;
      } else {
        astralKeyBeacon.visible = false;
      }

      collectiblesGroup.children.forEach((cGroup) => {
        const crystal = cGroup.getObjectByName('spinCrystal');
        if (crystal) {
          crystal.rotation.y = elapsed * 2.2;
          crystal.position.y = 0.65 + Math.sin(elapsed * 3 + cGroup.position.x) * 0.08;
        }
      });

      ens.forEach((enemy) => {
        const entry = enemyMeshesMap.get(enemy.id);
        if (entry) {
          const ew = gridToWorld(enemy.r, enemy.c, m.rows, m.cols);
          entry.group.position.x = THREE.MathUtils.damp(
            entry.group.position.x,
            ew.x,
            9,
            dt
          );
          entry.group.position.z = THREE.MathUtils.damp(
            entry.group.position.z,
            ew.z,
            9,
            dt
          );
        }
      });

      // Smoothly interpolate Camera FOV & Projection Position for 1.5D / 2.5D / 3.0D / 3.5D modes
      const targetFov =
        camMode === '2.5d-diorama'
          ? 28
          : camMode === '1.5d-wave'
          ? 42
          : camMode === '3.5d-quantum'
          ? 54
          : 46;
      if (Math.abs(camera.fov - targetFov) > 0.05) {
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 6, dt);
        camera.updateProjectionMatrix();
      }

      const shakeOffset = shake ? Math.sin(elapsed * 60) * 0.35 : 0;
      if (camMode === '3d-chase') {
        _targetCamPos.set(
          heroGroup.position.x + shakeOffset,
          11.5,
          heroGroup.position.z + 9.2
        );
        _targetLookAt.set(
          heroGroup.position.x,
          0.5,
          heroGroup.position.z - 0.8
        );
      } else if (camMode === '3.5d-quantum') {
        _targetCamPos.set(
          heroGroup.position.x + Math.sin(elapsed * 0.6) * 1.4 + shakeOffset,
          13.2,
          heroGroup.position.z + 10.4
        );
        _targetLookAt.set(
          heroGroup.position.x,
          0.4,
          heroGroup.position.z - 0.5
        );
      } else if (camMode === '1.5d-wave') {
        const span = Math.max(m.rows, m.cols) * TILE_SIZE;
        _targetCamPos.set(
          heroGroup.position.x * 0.45 + shakeOffset,
          span * 0.92,
          heroGroup.position.z * 0.45 + span * 0.52
        );
        _targetLookAt.set(heroGroup.position.x * 0.35, 0, heroGroup.position.z * 0.35);
      } else {
        // '2.5d-diorama' HD-2D Tilt-Shift Isometric Projection (FOV 28°)
        const span = Math.max(m.rows, m.cols) * TILE_SIZE;
        _targetCamPos.set(shakeOffset, span * 1.72, span * 1.05);
        _targetLookAt.set(0, -0.5, 0.8);
      }

      camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetCamPos.x, 7, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetCamPos.y, 7, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetCamPos.z, 7, dt);

      currentLookAt.x = THREE.MathUtils.damp(currentLookAt.x, _targetLookAt.x, 9, dt);
      currentLookAt.y = THREE.MathUtils.damp(currentLookAt.y, _targetLookAt.y, 9, dt);
      currentLookAt.z = THREE.MathUtils.damp(currentLookAt.z, _targetLookAt.z, 9, dt);
      camera.lookAt(currentLookAt);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="maze-3d-canvas-container"
      className="w-full h-full relative overflow-hidden select-none"
    />
  );
};
