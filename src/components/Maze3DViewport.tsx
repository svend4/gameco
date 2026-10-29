import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BackgroundStyle,
  HeroAvatar,
  MazeData,
  MazeEnemy,
  Position,
} from '../game/rules';

export type Camera3DMode = 'chase' | 'diorama';

interface Maze3DViewportProps {
  maze: MazeData;
  playerPos: Position;
  starsRemaining: Position[];
  chestsRemaining: Position[];
  enemies: MazeEnemy[];
  activeHero: HeroAvatar;
  cameraMode: Camera3DMode;
  boardShake: boolean;
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

  // Badge circle backdrop
  ctx.beginPath();
  ctx.arc(128, 128, 112, 0, Math.PI * 2);
  ctx.fillStyle = bgHex;
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = borderHex;
  ctx.stroke();

  // Inner highlight ring
  ctx.beginPath();
  ctx.arc(128, 128, 96, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.stroke();

  // Crisp centered emoji
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

function createFloorGridTexture(maxAnisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1b152c';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle tile border frame
  ctx.strokeStyle = '#36295a';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 244);

  // Corner rivets
  ctx.fillStyle = '#58428c';
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

  // Grayscale bump map for stone micro-relief
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

function createWallBlockTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#38324c';
  ctx.fillRect(0, 0, 256, 256);

  // Architectural masonry courses
  ctx.strokeStyle = '#252036';
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

  // Subtle top bevel glow line
  ctx.fillStyle = 'rgba(167, 139, 250, 0.22)';
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
  playerPos,
  starsRemaining,
  chestsRemaining,
  enemies,
  activeHero,
  cameraMode,
  boardShake,
  onMoveStep,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Store latest props in refs so React HUD updates never tear down the WebGL canvas
  const stateRef = useRef({
    maze,
    playerPos,
    starsRemaining,
    chestsRemaining,
    enemies,
    activeHero,
    cameraMode,
    boardShake,
    onMoveStep,
  });

  useEffect(() => {
    stateRef.current = {
      maze,
      playerPos,
      starsRemaining,
      chestsRemaining,
      enemies,
      activeHero,
      cameraMode,
      boardShake,
      onMoveStep,
    };
  }, [
    maze,
    playerPos,
    starsRemaining,
    chestsRemaining,
    enemies,
    activeHero,
    cameraMode,
    boardShake,
    onMoveStep,
  ]);

  // Rebuild trigger refs
  const rebuildLevelRef = useRef<(() => void) | null>(null);
  const rebuildHeroTexturesRef = useRef<(() => void) | null>(null);
  const syncDynamicEntitiesRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    rebuildLevelRef.current?.();
  }, [maze]);

  useEffect(() => {
    rebuildHeroTexturesRef.current?.();
  }, [
    activeHero.baseEmoji,
    activeHero.accessoryEmoji,
    activeHero.flagEmoji,
    activeHero.backgroundStyle,
  ]);

  useEffect(() => {
    syncDynamicEntitiesRef.current?.();
  }, [starsRemaining, chestsRemaining, enemies]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software-WebGL detection from GPU renderer string (never userAgent)
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

    // 2. Scene, Fog & Studio Environment Map (RoomEnvironment)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x130e24);
    scene.fog = new THREE.FogExp2(0x130e24, 0.018);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Camera
    const camera = new THREE.PerspectiveCamera(46, initW / initH, 0.5, 140);
    camera.position.set(0, 18, 14);

    // 4. Balanced 3-Point Warm/Cool Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xa78bfa, 0x160f29, 1.35);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe8c2, 2.1);
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

    // Shared Textures & Materials
    const contactShadowTex = createContactShadowTexture();
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadowDiscGeo = new THREE.CircleGeometry(0.82, 20);
    shadowDiscGeo.rotateX(-Math.PI / 2);

    const floorTextures = createFloorGridTexture(maxAnisotropy);
    const wallTex = createWallBlockTexture(maxAnisotropy);

    // Groups for scene organization
    const levelGroup = new THREE.Group();
    scene.add(levelGroup);

    const collectiblesGroup = new THREE.Group();
    scene.add(collectiblesGroup);

    const enemiesGroup = new THREE.Group();
    scene.add(enemiesGroup);

    // Interactive floor tiles for click-to-move raycasting
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
    // COMPOSITE 7-PART 3D HERO AVATAR RIG (THREE.Group)
    // =========================================================
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // Part 1: Contact Shadow Disc flush on ground (y = 0.015)
    const heroShadow = new THREE.Mesh(shadowDiscGeo, contactShadowMat);
    heroShadow.position.y = 0.015;
    heroGroup.add(heroShadow);

    // Part 2: Brushed Metallic Hover Pedestal Base
    const pedestalGeo = new THREE.CylinderGeometry(0.62, 0.74, 0.22, 24);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x2e2252,
      metalness: 0.85,
      roughness: 0.2,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = 0.11;
    heroGroup.add(pedestalMesh);

    // Part 3: Glowing Elemental Energy Ring
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

    // Part 4: Sculpted Hero Chassis / Armor Collar
    const torsoGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.55, 20);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x6750a4,
      roughness: 0.6,
      metalness: 0.25,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 0.52;
    heroGroup.add(torsoMesh);

    // Part 5: 3D Holographic Medallion Frame + Emoji Billboard Sprite
    const heroFloatPivot = new THREE.Group();
    heroFloatPivot.position.y = 1.25;
    heroGroup.add(heroFloatPivot);

    const heroSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const heroSprite = new THREE.Sprite(heroSpriteMat);
    heroSprite.scale.set(1.38, 1.38, 1);
    heroFloatPivot.add(heroSprite);

    // Part 6: Orbiting Weapon / Accessory Satellite
    const orbitPivot = new THREE.Group();
    orbitPivot.position.y = 1.25;
    heroGroup.add(orbitPivot);

    const accSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const accSprite = new THREE.Sprite(accSpriteMat);
    accSprite.position.set(0.85, 0.32, 0.25);
    accSprite.scale.set(0.65, 0.65, 1);
    orbitPivot.add(accSprite);

    // Part 7: Flag / Emblem Crest Satellite
    const flagSpriteMat = new THREE.SpriteMaterial({ color: 0xffffff });
    const flagSprite = new THREE.Sprite(flagSpriteMat);
    flagSprite.position.set(-0.82, -0.2, 0.25);
    flagSprite.scale.set(0.6, 0.6, 1);
    orbitPivot.add(flagSprite);

    // Helper to convert (r, c) grid coords to 3D world (x, z)
    const gridToWorld = (r: number, c: number, rows: number, cols: number) => {
      const offsetX = -((cols - 1) * TILE_SIZE) / 2;
      const offsetZ = -((rows - 1) * TILE_SIZE) / 2;
      return {
        x: offsetX + c * TILE_SIZE,
        z: offsetZ + r * TILE_SIZE,
      };
    };

    const rebuildHeroTextures = () => {
      const { activeHero: h } = stateRef.current;
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
    };
    rebuildHeroTexturesRef.current = rebuildHeroTextures;
    rebuildHeroTextures();

    // Shared Geometries & Materials for Collectibles and Enemies
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

    const starIconTex = createEmojiCanvasTexture('⭐', '#451a03', '#fbbf24', maxAnisotropy);
    const chestIconTex = createEmojiCanvasTexture('🎁', '#451a03', '#f59e0b', maxAnisotropy);
    const exitIconTex = createEmojiCanvasTexture('🏁', '#064e3b', '#34d399', maxAnisotropy);

    // Map of enemy meshes by id for smooth interpolation
    const enemyMeshesMap = new Map<
      string,
      {
        group: THREE.Group;
        telegraphRing: THREE.Mesh;
        emojiTag: string;
      }
    >();

    const syncDynamicEntities = () => {
      const { maze: m, starsRemaining: stars, chestsRemaining: chests, enemies: ens } =
        stateRef.current;

      // 1. Rebuild Stars & Chests
      while (collectiblesGroup.children.length > 0) {
        collectiblesGroup.remove(collectiblesGroup.children[0]);
      }

      stars.forEach((sPos) => {
        const w = gridToWorld(sPos.r, sPos.c, m.rows, m.cols);
        // 4-part Composite Star Shrine Group
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

      chests.forEach((cPos) => {
        const w = gridToWorld(cPos.r, cPos.c, m.rows, m.cols);
        // 5-part Composite 3D Treasure Chest Group
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

      // 2. Sync Enemy 3D Rigs
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
          // Build 5-part Composite Enemy Rig
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

        // Update telegraph ring state
        const mat = entry.telegraphRing.material as THREE.MeshBasicMaterial;
        mat.opacity = enemy.telegraphing ? 0.85 : 0.22;
        entry.telegraphRing.scale.setScalar(enemy.telegraphing ? 1.18 : 1.0);
      });
    };
    syncDynamicEntitiesRef.current = syncDynamicEntities;

    const rebuildLevelGeometry = () => {
      const { maze: m, playerPos: pPos } = stateRef.current;

      while (levelGroup.children.length > 0) {
        levelGroup.remove(levelGroup.children[0]);
      }
      floorTiles.length = 0;
      enemyMeshesMap.clear();
      while (enemiesGroup.children.length > 0) {
        enemiesGroup.remove(enemiesGroup.children[0]);
      }

      const boardW = m.cols * TILE_SIZE;
      const boardH = m.rows * TILE_SIZE;

      // Outer Dark Platform Pedestal under the entire 3D Labyrinth
      const platformGeo = new THREE.BoxGeometry(boardW + 2.4, 0.8, boardH + 2.4);
      const platformMat = new THREE.MeshStandardMaterial({
        color: 0x140f26,
        roughness: 0.8,
        metalness: 0.2,
      });
      const platformMesh = new THREE.Mesh(platformGeo, platformMat);
      platformMesh.position.y = -0.42;
      platformMesh.receiveShadow = !isSoftwareGl;
      levelGroup.add(platformMesh);

      // Count walls for InstancedMesh
      const wallCoords: { r: number; c: number }[] = [];
      const walkableCoords: { r: number; c: number }[] = [];

      for (let r = 0; r < m.rows; r++) {
        for (let c = 0; c < m.cols; c++) {
          if (m.grid[r][c] === 'WALL') {
            wallCoords.push({ r, c });
          } else {
            walkableCoords.push({ r, c });
          }
        }
      }

      // Walkable Floor Tiles (for raycasting clicks + tactile grid look)
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

      // InstancedMesh for 3D Labyrinth Walls (Primary Block + Top Neon Bevel Cap)
      const wallHeight = 1.55;
      const wallGeo = new THREE.BoxGeometry(TILE_SIZE * 0.96, wallHeight, TILE_SIZE * 0.96);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: wallTex,
        roughness: 0.65,
        metalness: 0.22,
      });
      const wallInstanced = new THREE.InstancedMesh(wallGeo, wallMat, wallCoords.length);
      wallInstanced.castShadow = !isSoftwareGl;
      wallInstanced.receiveShadow = !isSoftwareGl;

      const capGeo = new THREE.BoxGeometry(TILE_SIZE * 0.86, 0.12, TILE_SIZE * 0.86);
      const capMat = new THREE.MeshStandardMaterial({
        color: 0x7c3aed,
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

        // Subtle per-instance color tint
        const shade = isBorder ? 0x9f85e8 : 0xc4b5fd;
        _dummyColor.setHex(shade);
        wallInstanced.setColorAt(idx, _dummyColor);

        // Top bevel cap
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

      // 6-Part Composite 3D Exit Portal Gate at maze.exit
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
      exitGateGroup.add(exitSprite);

      levelGroup.add(exitGateGroup);

      // Position Hero immediately at current playerPos
      const startW = gridToWorld(pPos.r, pPos.c, m.rows, m.cols);
      heroGroup.position.set(startW.x, 0, startW.z);

      syncDynamicEntities();
    };

    rebuildLevelRef.current = rebuildLevelGeometry;
    rebuildLevelGeometry();

    // Raycaster for clicking adjacent 3D floor tiles
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

    // ResizeObserver for crisp responsive viewport
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

    // Pre-warm shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 5. Animation Loop with Clamped dt, Exponential Damping & Software-WebGL afterDraw Pacing
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let lastAdjacentKey = '';

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
      const rawDt = clock.getDelta();
      const dt = Math.min(rawDt, 0.05);
      const elapsed = clock.getElapsedTime();

      const {
        maze: m,
        playerPos: pPos,
        enemies: ens,
        cameraMode: camMode,
        boardShake: shake,
      } = stateRef.current;

      // 1. Smoothly damp Hero position to target grid tile
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

      // Hero bobbing & orbiting accessory animation
      heroFloatPivot.position.y = 1.25 + Math.sin(elapsed * 3.2) * 0.08;
      orbitPivot.rotation.y = elapsed * 1.4;

      // Update blue highlight rings on adjacent walkable tiles when player moves
      const adjKey = `${pPos.r},${pPos.c}`;
      if (adjKey !== lastAdjacentKey) {
        lastAdjacentKey = adjKey;
        while (adjacentRingsGroup.children.length > 0) {
          adjacentRingsGroup.remove(adjacentRingsGroup.children[0]);
        }
        const dirs = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        dirs.forEach(([dr, dc]) => {
          const nr = pPos.r + dr;
          const nc = pPos.c + dc;
          if (
            nr >= 0 &&
            nr < m.rows &&
            nc >= 0 &&
            nc < m.cols &&
            m.grid[nr][nc] !== 'WALL'
          ) {
            const rw = gridToWorld(nr, nc, m.rows, m.cols);
            const rMesh = new THREE.Mesh(highlightRingGeo, highlightRingMat);
            rMesh.position.set(rw.x, 0.02, rw.z);
            adjacentRingsGroup.add(rMesh);
          }
        });
      }

      // 2. Smoothly damp Enemies & spin Star crystals
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

      // 3. Camera Choreography (Chase Cam vs Tactical Diorama Overview)
      const shakeOffset = shake ? Math.sin(elapsed * 60) * 0.35 : 0;
      if (camMode === 'chase') {
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
      } else {
        // Full 3D Diorama view of the entire labyrinth
        const span = Math.max(m.rows, m.cols) * TILE_SIZE;
        _targetCamPos.set(shakeOffset, span * 1.28, span * 0.76);
        _targetLookAt.set(0, -0.6, 1.4);
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
