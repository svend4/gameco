import React, { useEffect, useRef, useState } from 'react';
import {
  advanceBoxBreathingTimer,
  ALCHEMICAL_SIGILS,
  BiomeKey,
  BIOMES,
  calculateCarouselFusionScore,
  calculateFunnelHit,
  calculateNavigatorCoherence,
  computeTransitRewardConversion,
  getBestScoreForAttraction,
  getBreathPhaseInfo,
  HarmonyRecord,
  LIMINAL_NODES,
  mergeBubbleRadii,
  NOTE_LABELS,
  PENTATONIC_NOTES,
  project3DPoint,
  rotate3DPoint,
  StargateThemePreset,
  SURREAL_THEMES,
  TESSERACT_EDGES,
  TESSERACT_VERTICES,
  TransitRewardPackage,
} from '../game/rules';
import { soundFX } from '../game/sound';

export type TransitTabKey = 'graph' | 'funnel' | 'carousel' | 'bubbles';

interface LiminalStargateTransitModalProps {
  isOpen: boolean;
  currentLevel: number;
  currentBiome: BiomeKey;
  records: HarmonyRecord[];
  totalBreathingSec: number;
  mazesClearedCount: number;
  themeIndex: number;
  onSelectThemeIndex: (idx: number) => void;
  onSaveHarmonyRecord: (attractionName: string, score: number, chainLen: number) => void;
  onAddBreathingSeconds: (sec: number) => void;
  onCompleteTransit: (targetBiome: BiomeKey, rewards: TransitRewardPackage) => void;
  onClose: () => void;
}

interface Star3D {
  x: number;
  y: number;
  z: number;
  speed: number;
  colorIndex: number;
}

interface DreamSphere {
  id: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  noteIndex: number;
  speed: number;
  rotationAngle: number;
  isCaught: boolean;
  isMissed: boolean;
  fadeAlpha: number;
  trail: Array<{ x: number; y: number; z: number }>;
}

interface FunnelBurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

interface CarouselStar {
  id: number;
  baseX: number;
  baseY: number;
  baseZ: number;
  rotatedX: number;
  rotatedY: number;
  rotatedZ: number;
  color: string;
  colorIndex: number;
  isSelected: boolean;
  pulse: number;
}

interface EtherealBubble {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  noteIndex: number;
  z: number;
  wobble: number;
  isPopped: boolean;
  popProgress: number;
  sigilIndex: number;
}

export const LiminalStargateTransitModal: React.FC<LiminalStargateTransitModalProps> = ({
  isOpen,
  currentLevel,
  currentBiome,
  records,
  totalBreathingSec,
  mazesClearedCount,
  themeIndex,
  onSelectThemeIndex,
  onSaveHarmonyRecord,
  onAddBreathingSeconds,
  onCompleteTransit,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TransitTabKey>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-4');
  const [targetBiome, setTargetBiome] = useState<BiomeKey>(currentBiome);
  const [vfxOverdrive, setVfxOverdrive] = useState<boolean>(true);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [sessionHarmonyGained, setSessionHarmonyGained] = useState<number>(0);
  const [sessionBreathingSec, setSessionBreathingSec] = useState<number>(0);

  // Funnel state
  const [funnelScore, setFunnelScore] = useState<number>(0);
  const [funnelStreak, setFunnelStreak] = useState<number>(0);
  const [funnelMaxStreak, setFunnelMaxStreak] = useState<number>(0);

  // Carousel state
  const [carouselScore, setCarouselScore] = useState<number>(0);
  const [carouselScaleCount, setCarouselScaleCount] = useState<number>(0);
  const [carouselSelectedCount, setCarouselSelectedCount] = useState<number>(0);

  // Bubbles & Breathing state
  const [bubblesScore, setBubblesScore] = useState<number>(0);
  const [bubblesSplitCount, setBubblesSplitCount] = useState<number>(0);
  const [breathActive, setBreathActive] = useState<boolean>(false);
  const [breathPhase, setBreathPhase] = useState<0 | 1 | 2 | 3>(0);
  const [breathPhaseTimer, setBreathPhaseTimer] = useState<number>(4);

  const theme: StargateThemePreset =
    SURREAL_THEMES[themeIndex % SURREAL_THEMES.length] ?? SURREAL_THEMES[0];

  const activeNode =
    LIMINAL_NODES.find((n) => n.id === selectedNodeId) ?? LIMINAL_NODES[3];

  const telemetry = calculateNavigatorCoherence(
    records,
    totalBreathingSec + sessionBreathingSec,
    mazesClearedCount
  );

  const liveTotalHarmony =
    sessionHarmonyGained + funnelScore + carouselScore + bubblesScore;

  const rewardPreview = computeTransitRewardConversion(
    liveTotalHarmony,
    sessionBreathingSec,
    telemetry.coherenceIndex
  );

  // Refs for 60fps canvases
  const holoBadgeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const holoPulseRef = useRef<number>(0.8);

  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shockwaveRef = useRef<number>(1.0);

  const funnelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const funnelStateRef = useRef({
    funnelX: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    spheres: [] as DreamSphere[],
    stars: [] as Star3D[],
    bursts: [] as FunnelBurstParticle[],
    nextId: 1,
    stargateAngle: 0,
    kawooshPulse: 0.9,
    gridOffset: 0,
  });

  const carouselCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const carouselStateRef = useRef({
    stars: [] as CarouselStar[],
    selectedIds: [] as number[],
    angleX: 0.25,
    angleY: 0,
    angle4D: 0,
    score: 0,
    scaleCount: 0,
    fusionFlash: 0,
  });

  const bubblesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesStateRef = useRef({
    bubbles: [] as EtherealBubble[],
    score: 0,
    splitCount: 0,
    nextId: 1,
  });

  const reactorCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTargetBiome(currentBiome);
      shockwaveRef.current = 1.25;
      soundFX.playStargateKawoosh();
    }
  }, [isOpen, currentBiome]);

  // 10-Note Pentatonic trigger
  const triggerSynthNote = (idx: number) => {
    setActiveNoteIdx(idx);
    holoPulseRef.current = 1.4;
    soundFX.playPentatonicNote(idx, 340);
    setTimeout(() => {
      setActiveNoteIdx((prev) => (prev === idx ? null : prev));
    }, 260);
  };

  // ==========================================================================
  // 0. HEADER 4D-TESSERACT × STARGATE HOLO-SHADER
  // ==========================================================================
  useEffect(() => {
    if (!isOpen) return;
    let animId = 0;
    let t = 0;
    const renderHolo = () => {
      t += vfxOverdrive ? 0.028 : 0.015;
      holoPulseRef.current = Math.max(0, holoPulseRef.current * 0.94);
      const canvas = holoBadgeCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const cx = w / 2;
          const cy = h / 2;
          ctx.clearRect(0, 0, w, h);

          const bgGrad = ctx.createRadialGradient(cx, cy, 3, cx, cy, w * 0.52);
          bgGrad.addColorStop(0, `${theme.secondaryAccent}44`);
          bgGrad.addColorStop(0.5, `${theme.primaryAccent}22`);
          bgGrad.addColorStop(1, 'rgba(5, 7, 15, 0)');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const projectedVerts: Array<{ x: number; y: number }> = [];
          const scale4D = 22 + holoPulseRef.current * 9;

          for (const [vx, vy, vz, vw] of TESSERACT_VERTICES) {
            const cos1 = Math.cos(t * 0.9);
            const sin1 = Math.sin(t * 0.9);
            const x1 = vx * cos1 - vw * sin1;
            const w1 = vx * sin1 + vw * cos1;

            const cos2 = Math.cos(t * 0.65);
            const sin2 = Math.sin(t * 0.65);
            const z2 = vz * cos2 - w1 * sin2;
            const w2 = vz * sin2 + w1 * cos2;

            const d4 = 2.6 / (2.6 - w2 * 0.45);
            const rot3 = rotate3DPoint(
              x1 * d4 * scale4D,
              vy * d4 * scale4D,
              z2 * d4 * scale4D,
              0.35,
              t * 0.5
            );
            const p2 = project3DPoint(rot3.rx, rot3.ry, rot3.rz, cx, cy, 180, 180);
            projectedVerts.push({ x: p2.px, y: p2.py });
          }

          ctx.strokeStyle = `${theme.secondaryAccent}99`;
          ctx.lineWidth = 1.2;
          for (const [a, b] of TESSERACT_EDGES) {
            ctx.beginPath();
            ctx.moveTo(projectedVerts[a].x, projectedVerts[a].y);
            ctx.lineTo(projectedVerts[b].x, projectedVerts[b].y);
            ctx.stroke();
          }

          const gateR = 42 + Math.sin(t * 2) * 1.5 + holoPulseRef.current * 5;
          ctx.strokeStyle = theme.primaryAccent;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.arc(cx, cy, gateR, 0, Math.PI * 2);
          ctx.stroke();

          for (let c = 0; c < 9; c++) {
            const ang = (c / 9) * Math.PI * 2 + t * 0.35;
            const chX = cx + Math.cos(ang) * gateR;
            const chY = cy + Math.sin(ang) * gateR;
            ctx.fillStyle = c % 2 === 0 ? theme.starColor : theme.secondaryAccent;
            ctx.beginPath();
            ctx.arc(chX, chY, 3, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      animId = requestAnimationFrame(renderHolo);
    };
    animId = requestAnimationFrame(renderHolo);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, theme, vfxOverdrive]);

  // ==========================================================================
  // 1. TAB 1: OBSIDIAN × STARGATE 4D NODE-ROOM-TRANSIT GRAPH
  // ==========================================================================
  useEffect(() => {
    if (!isOpen || activeTab !== 'graph') return;
    let animId = 0;
    let t = 0;
    const bgStars = Array.from({ length: 48 }, (_, i) => ({
      x: (i * 137.5) % 740,
      y: (i * 89.3) % 340,
      r: (i % 3) * 0.65 + 0.7,
      phase: i * 0.6,
    }));

    const renderGraph = () => {
      t += 0.022;
      shockwaveRef.current = Math.max(0, shockwaveRef.current * 0.96);
      const canvas = graphCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const axisNode = LIMINAL_NODES[3];
          const axX = axisNode.x * w;
          const axY = axisNode.y * h;

          // Deep Obsidian Cosmic Nebula Backdrop
          const nebulaGrad = ctx.createRadialGradient(axX, axY, 8, axX, axY, w * 0.58);
          nebulaGrad.addColorStop(0, `${theme.secondaryAccent}38`);
          nebulaGrad.addColorStop(0.4, `${theme.primaryAccent}1E`);
          nebulaGrad.addColorStop(0.8, '#070916');
          nebulaGrad.addColorStop(1, '#04060E');
          ctx.fillStyle = nebulaGrad;
          ctx.fillRect(0, 0, w, h);

          for (const st of bgStars) {
            const alpha = 0.25 + 0.45 * Math.sin(t * 2 + st.phase);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';

          // Central Stargate Event Horizon around Axis Mundi (Node 4)
          const gateRadius = 92 + Math.sin(t * 1.6) * 4;
          const kawooshR = gateRadius * (0.35 + shockwaveRef.current * 0.85);
          const kwGrad = ctx.createRadialGradient(axX, axY, 2, axX, axY, kawooshR);
          kwGrad.addColorStop(0, '#FFFFFF');
          kwGrad.addColorStop(0.3, `${theme.secondaryAccent}AA`);
          kwGrad.addColorStop(0.7, `${theme.primaryAccent}44`);
          kwGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = kwGrad;
          ctx.beginPath();
          ctx.arc(axX, axY, kawooshR, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `${theme.secondaryAccent}88`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(axX, axY, gateRadius, 0, Math.PI * 2);
          ctx.stroke();

          // 36 Stargate glyph ticks + 9 Chevrons
          for (let g = 0; g < 36; g++) {
            const ang = (g / 36) * Math.PI * 2 - t * 0.4;
            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(axX + Math.cos(ang) * (gateRadius - 4), axY + Math.sin(ang) * (gateRadius - 4));
            ctx.lineTo(axX + Math.cos(ang) * (gateRadius + 4), axY + Math.sin(ang) * (gateRadius + 4));
            ctx.stroke();
          }

          for (let c = 0; c < 9; c++) {
            const ang = (c / 9) * Math.PI * 2 + t * 0.25;
            const chX = axX + Math.cos(ang) * gateRadius;
            const chY = axY + Math.sin(ang) * gateRadius;
            ctx.fillStyle = c % 2 === 0 ? theme.starColor : theme.primaryAccent;
            ctx.beginPath();
            ctx.arc(chX, chY, 5 + shockwaveRef.current * 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Curved Wormhole Conduits & Flowing Quantum Packets
          for (const node of LIMINAL_NODES) {
            const x1 = node.x * w;
            const y1 = node.y * h;
            for (const targetId of node.connectedTo) {
              if (node.id < targetId) {
                const target = LIMINAL_NODES.find((n) => n.id === targetId);
                if (target) {
                  const x2 = target.x * w;
                  const y2 = target.y * h;
                  const isHighlighted =
                    node.id === selectedNodeId || target.id === selectedNodeId;

                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2 - 18 * Math.sin(t + node.x * 4);

                  ctx.strokeStyle = isHighlighted
                    ? theme.secondaryAccent
                    : 'rgba(148, 163, 184, 0.28)';
                  ctx.lineWidth = isHighlighted ? 2.6 : 1.2;
                  ctx.beginPath();
                  ctx.moveTo(x1, y1);
                  ctx.quadraticCurveTo(midX, midY, x2, y2);
                  ctx.stroke();

                  if (isHighlighted) {
                    for (let pIdx = 0; pIdx < 2; pIdx++) {
                      const prog = (t * 0.55 + pIdx * 0.5) % 1;
                      const px = x1 + (x2 - x1) * prog;
                      const py = y1 + (y2 - y1) * prog;
                      ctx.fillStyle = pIdx === 0 ? '#FFFFFF' : theme.starColor;
                      ctx.beginPath();
                      ctx.arc(px, py, 4.2, 0, Math.PI * 2);
                      ctx.fill();
                    }
                  }
                }
              }
            }
          }
          ctx.restore();

          // Hexagonal Faceted Obsidian Nodes (Rooms / Vessels)
          for (const node of LIMINAL_NODES) {
            const nx = node.x * w;
            const ny = node.y * h;
            const isSelected = node.id === selectedNodeId;
            const isNeighbor = activeNode.connectedTo.includes(node.id);
            const r = isSelected ? 19 : isNeighbor ? 14 : 11;

            const auraGrad = ctx.createRadialGradient(nx, ny, 2, nx, ny, r * 2.2);
            auraGrad.addColorStop(
              0,
              isSelected
                ? `${theme.primaryAccent}99`
                : isNeighbor
                ? `${theme.secondaryAccent}66`
                : 'rgba(99, 102, 241, 0.25)'
            );
            auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(nx, ny, r * 2.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#080A14';
            ctx.strokeStyle = isSelected
              ? '#FFFFFF'
              : isNeighbor
              ? theme.secondaryAccent
              : 'rgba(255,255,255,0.5)';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.beginPath();
            for (let side = 0; side < 6; side++) {
              const hAng = (side / 6) * Math.PI * 2 + (isSelected ? t * 0.8 : 0);
              const hx = nx + Math.cos(hAng) * r;
              const hy = ny + Math.sin(hAng) * r;
              if (side === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isSelected ? theme.primaryAccent : theme.starColor;
            ctx.beginPath();
            ctx.arc(nx, ny, isSelected ? 6 : 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = isSelected
              ? "bold 11.5px 'Plus Jakarta Sans', sans-serif"
              : "600 10.5px 'Plus Jakarta Sans', sans-serif";
            ctx.fillStyle = isSelected ? '#FFFFFF' : 'rgba(226, 232, 240, 0.9)';
            ctx.textAlign = 'center';
            ctx.fillText(node.title, nx, ny - r - 8);
          }
        }
      }
      animId = requestAnimationFrame(renderGraph);
    };
    animId = requestAnimationFrame(renderGraph);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, selectedNodeId, theme, activeNode]);

  // ==========================================================================
  // 2. TAB 2: GRAVITY FUNNEL STARGATE 4D ROAD
  // ==========================================================================
  const spawnCatchExplosion = (px: number, py: number, color: string) => {
    const st = funnelStateRef.current;
    st.kawooshPulse = 1.0;
    for (let i = 0; i < 18; i++) {
      const ang = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
      const spd = 2.0 + Math.random() * 5.5;
      st.bursts.push({
        x: px,
        y: py,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        color: i % 3 === 0 ? '#FFFFFF' : color,
        alpha: 1,
        size: 2.5 + Math.random() * 3.5,
      });
    }
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'funnel') return;
    const st = funnelStateRef.current;
    if (st.stars.length === 0) {
      st.stars = Array.from({ length: 65 }, (_, idx) => ({
        x: (Math.random() - 0.5) * 1100,
        y: (Math.random() - 0.5) * 650,
        z: Math.random() * 900 + 80,
        speed: 5 + Math.random() * 7,
        colorIndex: idx % 4,
      }));
    }

    let animId = 0;
    const renderFunnel = () => {
      const canvas = funnelCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const horizonY = height * 0.28;
          const focalLength = 300;

          st.stargateAngle += vfxOverdrive ? 0.024 : 0.012;
          st.kawooshPulse = Math.max(0, st.kawooshPulse * 0.94);
          st.gridOffset = (st.gridOffset + (vfxOverdrive ? 9 : 5)) % 120;

          ctx.clearRect(0, 0, width, height);

          // 1. Starfield
          for (const star of st.stars) {
            star.z -= star.speed * (vfxOverdrive ? 1.25 : 0.85);
            if (star.z <= 12) {
              star.z = 950;
              star.x = (Math.random() - 0.5) * 1100;
              star.y = (Math.random() - 0.5) * 650;
            }
            const proj = project3DPoint(star.x, star.y, star.z, centerX, horizonY, focalLength);
            ctx.fillStyle =
              star.colorIndex === 0 ? '#FFFFFF' : theme.bubbleColors[star.colorIndex % 4];
            ctx.beginPath();
            ctx.arc(proj.px, proj.py, Math.max(1, 2.6 * proj.scale), 0, Math.PI * 2);
            ctx.fill();
          }

          // 2. Stargate Event Horizon at Vanishing Point
          const gateRadius = 56 + st.kawooshPulse * 12;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          const eventGrad = ctx.createRadialGradient(
            centerX,
            horizonY,
            4,
            centerX,
            horizonY,
            gateRadius
          );
          eventGrad.addColorStop(0, '#FFFFFF');
          eventGrad.addColorStop(0.3, `${theme.secondaryAccent}CC`);
          eventGrad.addColorStop(0.7, `${theme.primaryAccent}66`);
          eventGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = eventGrad;
          ctx.beginPath();
          ctx.arc(centerX, horizonY, gateRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = theme.secondaryAccent;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(centerX, horizonY, gateRadius, 0, Math.PI * 2);
          ctx.stroke();

          for (let c = 0; c < 9; c++) {
            const cAng = (c / 9) * Math.PI * 2 + st.stargateAngle;
            const cx = centerX + Math.cos(cAng) * (gateRadius + 2);
            const cy = horizonY + Math.sin(cAng) * (gateRadius + 2);
            ctx.fillStyle = c % 2 === 0 ? theme.starColor : theme.primaryAccent;
            ctx.beginPath();
            ctx.arc(cx, cy, 4.8 + st.kawooshPulse * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // 3. Pseudo-Obsidian Mirror 3D Perspective Ramp
          const horizonW = 42;
          const bottomW = Math.min(410, width * 0.46);
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(centerX - horizonW, horizonY);
          ctx.lineTo(centerX + horizonW, horizonY);
          ctx.lineTo(centerX + bottomW, height);
          ctx.lineTo(centerX - bottomW, height);
          ctx.closePath();

          const rampGrad = ctx.createLinearGradient(0, horizonY, 0, height);
          rampGrad.addColorStop(0, 'rgba(5, 7, 16, 0.96)');
          rampGrad.addColorStop(0.5, 'rgba(12, 14, 30, 0.92)');
          rampGrad.addColorStop(0.85, `${theme.primaryAccent}24`);
          rampGrad.addColorStop(1, `${theme.secondaryAccent}3B`);
          ctx.fillStyle = rampGrad;
          ctx.fill();
          ctx.clip();

          for (let g = 0; g < 8; g++) {
            const zVal = ((g * 120 - st.gridOffset + 960) % 900) + 20;
            const s = focalLength / (focalLength + zVal);
            const y = horizonY + (height - horizonY) * s;
            const w = bottomW * s;
            ctx.strokeStyle = `${theme.primaryAccent}77`;
            ctx.lineWidth = 1.4 * s + 0.5;
            ctx.beginPath();
            ctx.moveTo(centerX - w, y);
            ctx.lineTo(centerX + w, y);
            ctx.stroke();
          }

          const roadLanes = [-135, -45, 45, 135];
          const topScale = focalLength / (focalLength + 950);
          for (const xl of roadLanes) {
            ctx.strokeStyle = `${theme.secondaryAccent}55`;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(centerX + xl * topScale, horizonY);
            ctx.lineTo(centerX + xl, height);
            ctx.stroke();
          }
          ctx.restore();

          // Labels for Parallel Space-Time Streams at bottom
          ctx.font = "600 10.5px 'JetBrains Mono', monospace";
          ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
          ctx.textAlign = 'center';
          ctx.fillText('ПОТОК ПРОШЛОГО (-t)', centerX - 180, height - 10);
          ctx.fillText('ОСЕВОЙ АСТРАЛ (t₀)', centerX, height - 10);
          ctx.fillText('ВЕРОЯТНОЕ БУДУЩЕЕ (+t)', centerX + 180, height - 10);

          // Spawn musical spheres
          if (st.spheres.length < 6 && Math.random() < 0.065) {
            const laneOffsets = [-165, -80, 0, 80, 165];
            const laneX = laneOffsets[Math.floor(Math.random() * laneOffsets.length)];
            const noteIdx = Math.floor(Math.random() * PENTATONIC_NOTES.length);
            st.spheres.push({
              id: st.nextId++,
              x: laneX,
              y: 0,
              z: 880,
              radius: 22,
              color: theme.bubbleColors[noteIdx % theme.bubbleColors.length],
              noteIndex: noteIdx,
              speed: 7.5 + Math.random() * 4.5,
              rotationAngle: 0,
              isCaught: false,
              isMissed: false,
              fadeAlpha: 1,
              trail: [],
            });
          }

          const remaining: DreamSphere[] = [];
          for (const sp of st.spheres) {
            if (sp.isCaught) {
              sp.y -= 6;
              sp.radius += 2;
              sp.fadeAlpha -= 0.09;
              if (sp.fadeAlpha > 0.02) remaining.push(sp);
            } else if (sp.isMissed) {
              sp.y += 8;
              sp.radius *= 0.92;
              sp.fadeAlpha -= 0.09;
              if (sp.fadeAlpha > 0.02) remaining.push(sp);
            } else {
              sp.trail.unshift({ x: sp.x, y: sp.y, z: sp.z });
              if (sp.trail.length > 6) sp.trail.pop();
              sp.z -= sp.speed;
              sp.rotationAngle += 0.08;
              sp.y = -Math.sin(sp.z * 0.022) * 14;

              if (sp.z <= 18) {
                const dist = Math.abs(sp.x - st.funnelX);
                if (dist < 76) {
                  sp.isCaught = true;
                  const next = calculateFunnelHit(st.score, st.streak, st.maxStreak, true);
                  st.score = next.score;
                  st.streak = next.streak;
                  st.maxStreak = next.maxStreak;
                  setFunnelScore(st.score);
                  setFunnelStreak(st.streak);
                  setFunnelMaxStreak(st.maxStreak);
                  spawnCatchExplosion(centerX + sp.x, height - 54, sp.color);
                  soundFX.playPentatonicNote(sp.noteIndex, 340);
                } else {
                  sp.isMissed = true;
                  const next = calculateFunnelHit(st.score, st.streak, st.maxStreak, false);
                  st.streak = next.streak;
                  setFunnelStreak(0);
                }
              }
              remaining.push(sp);
            }
          }
          st.spheres = remaining;

          // Draw spheres from back to front
          const sortedSpheres = [...st.spheres].sort((a, b) => b.z - a.z);
          for (const sp of sortedSpheres) {
            const s = focalLength / Math.max(15, focalLength + sp.z);
            const sx = centerX + sp.x * s;
            const sy = horizonY + (height - 54 - horizonY) * s + sp.y * s;
            const sr = Math.max(4, sp.radius * s);

            ctx.save();
            ctx.globalAlpha = Math.max(0, sp.fadeAlpha);
            const sphereGrad = ctx.createRadialGradient(
              sx - sr * 0.3,
              sy - sr * 0.3,
              sr * 0.1,
              sx,
              sy,
              sr
            );
            sphereGrad.addColorStop(0, '#FFFFFF');
            sphereGrad.addColorStop(0.45, sp.color);
            sphereGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
            ctx.fillStyle = sphereGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, sr, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Draw Funnel Collector Ship at bottom
          const collectorX = centerX + st.funnelX;
          const collectorY = height - 44;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.strokeStyle = theme.secondaryAccent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(collectorX, collectorY, 54, 15, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = `${theme.primaryAccent}55`;
          ctx.beginPath();
          ctx.ellipse(collectorX, collectorY, 44, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Update bursts
          const nextBursts: FunnelBurstParticle[] = [];
          for (const b of st.bursts) {
            b.x += b.vx;
            b.y += b.vy;
            b.alpha -= 0.04;
            if (b.alpha > 0.02) {
              nextBursts.push(b);
              ctx.fillStyle = b.color;
              ctx.globalAlpha = b.alpha;
              ctx.beginPath();
              ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
          st.bursts = nextBursts;
        }
      }
      animId = requestAnimationFrame(renderFunnel);
    };
    animId = requestAnimationFrame(renderFunnel);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, theme, vfxOverdrive]);

  // ==========================================================================
  // 3. TAB 3: CELESTIAL CAROUSEL 4D-TESSERACT × OBSIDIAN GRAPH
  // ==========================================================================
  const initCarouselStars = () => {
    const stars: CarouselStar[] = [];
    for (let i = 0; i < 18; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / 18);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 155;
      const cIdx = i % theme.bubbleColors.length;
      stars.push({
        id: i + 1,
        baseX: radius * Math.sin(phi) * Math.cos(theta),
        baseY: radius * Math.cos(phi),
        baseZ: radius * Math.sin(phi) * Math.sin(theta),
        rotatedX: 0,
        rotatedY: 0,
        rotatedZ: 0,
        color: theme.bubbleColors[cIdx],
        colorIndex: cIdx,
        isSelected: false,
        pulse: i * 0.4,
      });
    }
    carouselStateRef.current.stars = stars;
    carouselStateRef.current.selectedIds = [];
    setCarouselSelectedCount(0);
  };

  const triggerAutoConstellationFusion = () => {
    const st = carouselStateRef.current;
    if (st.stars.length === 0) initCarouselStars();
    const targetColorIdx = Math.floor(Math.random() * theme.bubbleColors.length);
    const matching = st.stars.filter((s) => s.colorIndex === targetColorIdx).slice(0, 3);
    const count = Math.max(3, matching.length);
    const next = calculateCarouselFusionScore(st.score, st.scaleCount, count);
    st.score = next.score;
    st.scaleCount = next.scaleCount;
    st.fusionFlash = 1.0;
    setCarouselScore(st.score);
    setCarouselScaleCount(st.scaleCount);
    soundFX.playPentatonicArpeggio(targetColorIdx);
    st.angleY += 0.45;
    matching.forEach((star) => {
      const newIdx = (star.colorIndex + 1) % theme.bubbleColors.length;
      star.colorIndex = newIdx;
      star.color = theme.bubbleColors[newIdx];
      star.isSelected = false;
    });
    st.selectedIds = [];
    setCarouselSelectedCount(0);
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'carousel') return;
    if (carouselStateRef.current.stars.length === 0) {
      initCarouselStars();
    }
    let animId = 0;
    const renderCarousel = () => {
      const canvas = carouselCanvasRef.current;
      const st = carouselStateRef.current;
      st.angleY += vfxOverdrive ? 0.0065 : 0.004;
      st.angle4D += vfxOverdrive ? 0.022 : 0.012;
      st.fusionFlash = Math.max(0, st.fusionFlash * 0.92);

      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const centerX = width / 2;
          const centerY = height / 2;
          const focalLength = 380;
          const camD = 400;

          ctx.clearRect(0, 0, width, height);

          const bgGrad = ctx.createRadialGradient(
            centerX,
            centerY,
            10,
            centerX,
            centerY,
            width * 0.55
          );
          bgGrad.addColorStop(0, `${theme.secondaryAccent}${st.fusionFlash > 0.1 ? '55' : '24'}`);
          bgGrad.addColorStop(0.5, `${theme.primaryAccent}18`);
          bgGrad.addColorStop(1, '#04060F');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, width, height);

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          // 1. Armillary Sphere Gimbal Rings
          for (let ringIdx = 0; ringIdx < 3; ringIdx++) {
            ctx.strokeStyle =
              ringIdx === 0
                ? `${theme.secondaryAccent}38`
                : ringIdx === 1
                ? `${theme.primaryAccent}30`
                : 'rgba(255,255,255,0.12)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(
              centerX,
              centerY,
              200 - ringIdx * 26,
              78 + ringIdx * 36,
              st.angleY * (ringIdx === 1 ? -0.6 : 0.4) + ringIdx,
              0,
              Math.PI * 2
            );
            ctx.stroke();
          }

          // 2. Central 4D Rotating Hypercube (Tesseract) around Axis Mundi
          const tesseractPts: Array<{ x: number; y: number }> = [];
          const hyperScale = 52 + st.fusionFlash * 20;
          for (const [vx, vy, vz, vw] of TESSERACT_VERTICES) {
            const c1 = Math.cos(st.angle4D);
            const s1 = Math.sin(st.angle4D);
            const x1 = vx * c1 - vw * s1;
            const w1 = vx * s1 + vw * c1;
            const c2 = Math.cos(st.angle4D * 0.7);
            const s2 = Math.sin(st.angle4D * 0.7);
            const z2 = vz * c2 - w1 * s2;
            const w2 = vz * s2 + w1 * c2;
            const wProj = 2.5 / (2.5 - w2 * 0.48);

            const rot = rotate3DPoint(
              x1 * wProj * hyperScale,
              vy * wProj * hyperScale,
              z2 * wProj * hyperScale,
              st.angleX,
              st.angleY * 1.4
            );
            const proj = project3DPoint(
              rot.rx,
              rot.ry,
              rot.rz,
              centerX,
              centerY,
              focalLength,
              camD
            );
            tesseractPts.push({ x: proj.px, y: proj.py });
          }

          ctx.strokeStyle = `${theme.secondaryAccent}77`;
          ctx.lineWidth = 1.3;
          for (const [iA, iB] of TESSERACT_EDGES) {
            ctx.beginPath();
            ctx.moveTo(tesseractPts[iA].x, tesseractPts[iA].y);
            ctx.lineTo(tesseractPts[iB].x, tesseractPts[iB].y);
            ctx.stroke();
          }

          // Update 3D rotations for Constellation Nodes
          for (const star of st.stars) {
            const rot = rotate3DPoint(star.baseX, star.baseY, star.baseZ, st.angleX, st.angleY);
            star.rotatedX = rot.rx;
            star.rotatedY = rot.ry;
            star.rotatedZ = rot.rz;
            star.pulse = star.isSelected ? star.pulse + 0.16 : star.pulse + 0.04;
          }

          // Pseudo-Obsidian Knowledge Graph Edges
          for (let i = 0; i < st.stars.length; i++) {
            for (let j = i + 1; j < st.stars.length; j++) {
              const s1 = st.stars[i];
              const s2 = st.stars[j];
              if (s1.colorIndex === s2.colorIndex) {
                const p1 = project3DPoint(
                  s1.rotatedX,
                  s1.rotatedY,
                  s1.rotatedZ,
                  centerX,
                  centerY,
                  focalLength,
                  camD
                );
                const p2 = project3DPoint(
                  s2.rotatedX,
                  s2.rotatedY,
                  s2.rotatedZ,
                  centerX,
                  centerY,
                  focalLength,
                  camD
                );
                ctx.strokeStyle = `${s1.color}36`;
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(p1.px, p1.py);
                ctx.lineTo(p2.px, p2.py);
                ctx.stroke();
              }
            }
          }
          ctx.restore();

          // Render Constellation Nodes
          const sorted = [...st.stars].sort((a, b) => b.rotatedZ - a.rotatedZ);
          for (const star of sorted) {
            const proj = project3DPoint(
              star.rotatedX,
              star.rotatedY,
              star.rotatedZ,
              centerX,
              centerY,
              focalLength,
              camD
            );
            const r = Math.max(5, (star.isSelected ? 13 : 9) * proj.scale);
            ctx.fillStyle = star.isSelected ? '#FFFFFF' : star.color;
            ctx.beginPath();
            ctx.arc(proj.px, proj.py, r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      animId = requestAnimationFrame(renderCarousel);
    };
    animId = requestAnimationFrame(renderCarousel);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, theme, vfxOverdrive]);

  // ==========================================================================
  // 4. TAB 4: ETHEREAL BUBBLES (VAS HERMETICUM) + 4-4-4-4 PRANA REACTOR
  // ==========================================================================
  const seedBubbles = () => {
    const list: EtherealBubble[] = [];
    for (let i = 0; i < 11; i++) {
      const noteIdx = i % PENTATONIC_NOTES.length;
      list.push({
        id: i + 1,
        x: 70 + Math.random() * 360,
        y: 60 + Math.random() * 210,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -0.45 - Math.random() * 0.7,
        radius: 20 + Math.random() * 14,
        color: theme.bubbleColors[noteIdx % theme.bubbleColors.length],
        noteIndex: noteIdx,
        z: Math.random() * 120,
        wobble: Math.random() * 6,
        isPopped: false,
        popProgress: 0,
        sigilIndex: i % ALCHEMICAL_SIGILS.length,
      });
    }
    bubblesStateRef.current.bubbles = list;
    bubblesStateRef.current.nextId = 20;
  };

  const triggerBubbleSplitWave = () => {
    const st = bubblesStateRef.current;
    st.score += 15;
    st.splitCount += 1;
    setBubblesScore(st.score);
    setBubblesSplitCount(st.splitCount);
    soundFX.playPentatonicArpeggio(st.splitCount % 8);
    const noteIdx = st.nextId % PENTATONIC_NOTES.length;
    st.bubbles.push({
      id: st.nextId++,
      x: 160 + Math.random() * 180,
      y: 160 + Math.random() * 90,
      vx: (Math.random() - 0.5) * 2.1,
      vy: -0.8 - Math.random() * 0.8,
      radius: 26,
      color: theme.bubbleColors[noteIdx % theme.bubbleColors.length],
      noteIndex: noteIdx,
      z: 40,
      wobble: 0,
      isPopped: false,
      popProgress: 0,
      sigilIndex: noteIdx % ALCHEMICAL_SIGILS.length,
    });
  };

  useEffect(() => {
    if (!isOpen || activeTab !== 'bubbles') return;
    if (bubblesStateRef.current.bubbles.length === 0) {
      seedBubbles();
    }
    let animId = 0;
    const renderBubbles = () => {
      const canvas = bubblesCanvasRef.current;
      const st = bubblesStateRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          // Update bubbles & check fusion
          for (const b of st.bubbles) {
            if (b.isPopped) {
              b.popProgress += 0.08;
            } else {
              b.wobble += 0.05;
              b.x += b.vx;
              b.y += b.vy;
              if (b.x < 35 || b.x > width - 35) b.vx *= -1;
              if (b.y < -30) {
                b.y = height + 20;
                b.x = 60 + Math.random() * (width - 120);
              }
            }
          }

          for (let i = 0; i < st.bubbles.length; i++) {
            for (let j = i + 1; j < st.bubbles.length; j++) {
              const b1 = st.bubbles[i];
              const b2 = st.bubbles[j];
              if (!b1.isPopped && !b2.isPopped) {
                const dist = Math.hypot(b1.x - b2.x, b1.y - b2.y);
                if (dist < (b1.radius + b2.radius) * 0.55) {
                  b1.radius = mergeBubbleRadii(b1.radius, b2.radius);
                  b2.isPopped = true;
                  st.score += 15;
                  setBubblesScore(st.score);
                }
              }
            }
          }

          st.bubbles = st.bubbles.filter((b) => !b.isPopped || b.popProgress < 1);
          while (st.bubbles.length < 9) {
            const noteIdx = st.nextId % PENTATONIC_NOTES.length;
            st.bubbles.push({
              id: st.nextId++,
              x: width / 2 + (Math.random() - 0.5) * 200,
              y: height + 10,
              vx: (Math.random() - 0.5) * 1.4,
              vy: -0.5 - Math.random() * 0.8,
              radius: 20 + Math.random() * 14,
              color: theme.bubbleColors[noteIdx % theme.bubbleColors.length],
              noteIndex: noteIdx,
              z: Math.random() * 100,
              wobble: 0,
              isPopped: false,
              popProgress: 0,
              sigilIndex: noteIdx % ALCHEMICAL_SIGILS.length,
            });
          }

          for (const b of st.bubbles) {
            const drawR = Math.max(14, b.radius);
            const bx = b.x + Math.sin(b.wobble) * 3.5;
            const by = b.y + Math.cos(b.wobble) * 2.5;
            if (!b.isPopped) {
              const grad = ctx.createRadialGradient(
                bx - drawR * 0.3,
                by - drawR * 0.3,
                drawR * 0.08,
                bx,
                by,
                drawR
              );
              grad.addColorStop(0, 'rgba(255,255,255,0.92)');
              grad.addColorStop(0.4, `${b.color}99`);
              grad.addColorStop(0.8, `${theme.secondaryAccent}44`);
              grad.addColorStop(1, `${b.color}18`);
              ctx.fillStyle = grad;
              ctx.beginPath();
              ctx.arc(bx, by, drawR, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = 'rgba(255,255,255,0.65)';
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
              ctx.fillStyle = 'rgba(255,255,255,0.88)';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(ALCHEMICAL_SIGILS[b.sigilIndex], bx, by);
            }
          }
        }
      }
      animId = requestAnimationFrame(renderBubbles);
    };
    animId = requestAnimationFrame(renderBubbles);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, theme]);

  // 4-4-4-4 Box Breathing Timer & Mandala
  useEffect(() => {
    if (!isOpen || activeTab !== 'bubbles' || !breathActive) return;
    const interval = setInterval(() => {
      setSessionBreathingSec((s) => s + 1);
      onAddBreathingSeconds(1);
      setBreathPhaseTimer((prev) => {
        const next = advanceBoxBreathingTimer(breathPhase, prev);
        if (next.breathPhase !== breathPhase) {
          setBreathPhase(next.breathPhase);
          soundFX.playPentatonicNote(next.breathPhase * 2, 300);
        }
        return next.phaseTimer;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, breathActive, breathPhase, onAddBreathingSeconds]);

  const phaseInfo = getBreathPhaseInfo(breathPhase);

  useEffect(() => {
    if (!isOpen || activeTab !== 'bubbles') return;
    let animId = 0;
    let t = 0;
    const renderReactor = () => {
      t += breathActive ? 0.025 : 0.012;
      const canvas = reactorCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const cx = w / 2;
          const cy = h / 2;
          ctx.clearRect(0, 0, w, h);

          const targetScale = breathActive
            ? breathPhase === 0 || breathPhase === 1
              ? 1.15
              : 0.86
            : 1.0;
          const baseR = 62 * targetScale + Math.sin(t * 2) * 2.5;

          const auraGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, baseR * 1.55);
          auraGrad.addColorStop(0, `${phaseInfo.breathColor}55`);
          auraGrad.addColorStop(0.6, `${phaseInfo.breathColor}1E`);
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, baseR * 1.55, 0, Math.PI * 2);
          ctx.fill();

          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          for (let sq = 0; sq < 2; sq++) {
            const rot = t * (sq === 0 ? 0.45 : -0.45) + (sq * Math.PI) / 4;
            const sqR = baseR * 1.16;
            ctx.strokeStyle =
              sq === 0 ? `${phaseInfo.breathColor}AA` : 'rgba(129, 140, 248, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let corner = 0; corner < 4; corner++) {
              const cAng = rot + (corner * Math.PI) / 2;
              const x = cx + Math.cos(cAng) * sqR;
              const y = cy + Math.sin(cAng) * sqR;
              if (corner === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
          }

          ctx.strokeStyle = phaseInfo.breathColor;
          ctx.lineWidth = 2.8;
          ctx.beginPath();
          ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          ctx.fillStyle = phaseInfo.breathColor;
          ctx.beginPath();
          ctx.arc(cx, cy, 42, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      animId = requestAnimationFrame(renderReactor);
    };
    animId = requestAnimationFrame(renderReactor);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeTab, breathActive, breathPhase, phaseInfo.breathColor]);

  if (!isOpen) return null;

  const funnelBest = getBestScoreForAttraction(records, 'Ловец Сфер', funnelScore);
  const carouselBest = getBestScoreForAttraction(records, 'Карусель Звезд', carouselScore);
  const bubblesBest = getBestScoreForAttraction(records, 'Сферы Эфира', bubblesScore);

  const handleGraphClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.currentTarget.width / rect.width;
    const sy = e.currentTarget.height / rect.height;
    const cx = (e.clientX - rect.left) * sx;
    const cy = (e.clientY - rect.top) * sy;

    shockwaveRef.current = 1.35;
    for (const node of LIMINAL_NODES) {
      const nx = node.x * e.currentTarget.width;
      const ny = node.y * e.currentTarget.height;
      if (Math.hypot(cx - nx, cy - ny) < 42) {
        setSelectedNodeId(node.id);
        setTargetBiome(node.targetBiome);
        setSessionHarmonyGained((h) => h + 10);
        soundFX.playPentatonicArpeggio(LIMINAL_NODES.indexOf(node));
        break;
      }
    }
  };

  const handleFinalizeTransit = () => {
    if (funnelScore > 0) {
      onSaveHarmonyRecord('Ловец Сфер', funnelScore, funnelMaxStreak);
    }
    if (carouselScore > 0) {
      onSaveHarmonyRecord('Карусель Звезд', carouselScore, carouselScaleCount);
    }
    if (bubblesScore > 0) {
      onSaveHarmonyRecord('Сферы Эфира', bubblesScore, bubblesSplitCount);
    }
    soundFX.playStargateKawoosh();
    onCompleteTransit(targetBiome, rewardPreview);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Межлокационный Переход Stargate 4D × Псевдо-Обсидиан"
      data-testid="stargate-transit-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-2 sm:p-4 overflow-y-auto"
    >
      <div
        className="w-full max-w-6xl rounded-3xl border-2 border-purple-400/40 p-4 sm:p-6 shadow-2xl space-y-4 my-auto"
        style={{
          background: `linear-gradient(145deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 55%, ${theme.bgGradient[2]} 100%)`,
        }}
      >
        {/* TOP HEADER: Stargate 4D Title + 4D Tesseract Holo-Shader + Navigator Telemetry */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border-b border-white/15 pb-4">
          <div className="lg:col-span-7 flex items-center gap-4">
            <div className="shrink-0 rounded-2xl border border-white/20 bg-[#050711] p-1">
              <canvas
                ref={holoBadgeCanvasRef}
                width={108}
                height={108}
                onClick={() => {
                  holoPulseRef.current = 1.6;
                  setSessionHarmonyGained((h) => h + 5);
                  soundFX.playPentatonicArpeggio(0);
                }}
                title="Нажмите для квантового импульса 4D-Тессеракта"
                className="w-[88px] h-[88px] sm:w-[96px] sm:h-[96px] block cursor-pointer"
              />
            </div>
            <div className="min-w-0">
              <div
                className="text-[11px] font-mono uppercase tracking-wider font-bold"
                style={{ color: theme.secondaryAccent }}
              >
                Межлокационный Транзит · Stargate 4D × Псевдо-Обсидиан · Сектор #{currentLevel}
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight mt-0.5">
                Шлюз Междумирья: Астральная 4D-Трасса и Ёмкости Сознания
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Переход между 3D-лабиринтами происходит через <strong>Лиминальное Междумирье</strong>:
                выберите узел в графе Obsidian × Stargate, соберите сферы гармонии в 4D-шлюзах или
                синхронизируйте дыхание 4-4-4-4 для получения бонусов в следующей локации!
              </p>
            </div>
          </div>

          {/* Navigator Sync Telemetry Card */}
          <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-black/45 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                Телеметрия Аватара-Навигатора
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-400">
                Когерентность: {telemetry.coherenceIndex}%
              </span>
            </div>
            <div className="text-xs font-bold text-white">{telemetry.dimensionalRank}</div>
            <div className="text-[11px] text-slate-300 mb-2">{telemetry.vesselStatus}</div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-slate-300">Астрал (4D-Мост)</span>
                  <span className="font-mono font-bold text-pink-400">
                    {telemetry.astralResonance}%
                  </span>
                </div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between">
                  <span className="text-slate-300">Ментал (Прана)</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {telemetry.mentalStability}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS + THEME SWITCHER + 10-NOTE PENTATONIC RESONATOR */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'graph', label: '🌌 1. Граф 7 Узлов (Obsidian × Stargate)' },
                { id: 'funnel', label: '🛸 2. Шлюз I: Воронка 4D (-t / t₀ / +t)' },
                { id: 'carousel', label: '🪐 3. Шлюз II: Карусель 4D-Тессеракт' },
                { id: 'bubbles', label: '🫧 4. Шлюз III: Vas Hermeticum & Прана 4-4-4-4' },
              ] as Array<{ id: TransitTabKey; label: string }>
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`transit-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    soundFX.playPentatonicNote(2, 200);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-slate-950 shadow-lg'
                      : 'bg-black/40 border border-white/15 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            {SURREAL_THEMES.map((preset) => {
              const isCurrent = preset.index === theme.index;
              return (
                <button
                  key={preset.index}
                  type="button"
                  onClick={() => {
                    onSelectThemeIndex(preset.index);
                    setTargetBiome(preset.linkedBiome);
                    soundFX.playPentatonicArpeggio(preset.index * 2);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? 'bg-white/20 border-white text-white'
                      : 'bg-black/35 border-white/15 text-slate-300 hover:border-white/35'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 cursor-pointer"
            >
              ✕ Закрыть
            </button>
          </div>
        </div>

        {/* 10-NOTE PENTATONIC SOUNDBOARD BAR */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
          {PENTATONIC_NOTES.map((freq, idx) => {
            const isPlaying = activeNoteIdx === idx;
            const noteColor = theme.bubbleColors[idx % theme.bubbleColors.length];
            return (
              <button
                key={NOTE_LABELS[idx]}
                type="button"
                onClick={() => triggerSynthNote(idx)}
                className="py-1.5 px-1 rounded-lg border text-center transition-all active:scale-95 cursor-pointer"
                style={{
                  borderColor: isPlaying ? noteColor : 'rgba(255,255,255,0.12)',
                  backgroundColor: isPlaying ? `${noteColor}33` : 'rgba(15, 23, 42, 0.65)',
                }}
              >
                <div className="text-[11px] font-bold text-white">{NOTE_LABELS[idx]}</div>
                <div className="text-[9px] font-mono text-slate-400">{Math.round(freq)}Гц</div>
              </button>
            );
          })}
        </div>

        {/* ====================================================================
            TAB 1: 7 LIMINAL NODES OBSIDIAN × STARGATE 4D GRAPH
           ==================================================================== */}
        {activeTab === 'graph' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-7 flex flex-col justify-between rounded-2xl border border-white/15 bg-[#050711] p-3">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <span className="text-xs font-bold text-white">
                  Интерактивный 4D-Граф «Узел — Ёмкость — Переход» (кликните по узлу)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    shockwaveRef.current = 1.5;
                    setSessionHarmonyGained((h) => h + 15);
                    soundFX.playStargateKawoosh();
                  }}
                  data-testid="trigger-kawoosh-btn"
                  className="px-3 py-1 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/40 text-indigo-200 text-xs font-bold cursor-pointer"
                >
                  ⚡ Импульс Врат (Kawoosh +15 Гармонии)
                </button>
              </div>

              <canvas
                ref={graphCanvasRef}
                width={740}
                height={330}
                onClick={handleGraphClick}
                data-testid="liminal-graph-canvas"
                className="w-full h-[270px] sm:h-[310px] rounded-xl border border-slate-800/90 cursor-pointer block"
              />

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mt-2.5">
                {LIMINAL_NODES.map((node, idx) => {
                  const active = node.id === selectedNodeId;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setTargetBiome(node.targetBiome);
                        shockwaveRef.current = 1.25;
                        soundFX.playPentatonicNote(idx, 240);
                      }}
                      className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all cursor-pointer truncate ${
                        active
                          ? 'border-white bg-white/15 text-white'
                          : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {node.code.split('·')[1]?.trim() || node.code}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Node Inspector */}
            <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-black/50 p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border"
                    style={{
                      color: theme.secondaryAccent,
                      borderColor: `${theme.secondaryAccent}55`,
                      backgroundColor: `${theme.secondaryAccent}15`,
                    }}
                  >
                    {activeNode.code}
                  </span>
                  <span className="text-[11px] font-mono text-amber-300">
                    {activeNode.vesselCapacity}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white">{activeNode.title}</h3>
                  <p className="text-xs text-indigo-300 font-medium">{activeNode.archetype}</p>
                </div>

                <div className="rounded-xl border border-pink-500/30 bg-pink-950/20 p-2.5">
                  <div className="text-[11px] font-bold text-pink-300 mb-0.5">
                    1. Внешнее проявление (Астрал 4D · Трасса)
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeNode.externalAstralManifestation}
                  </p>
                </div>

                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-2.5">
                  <div className="text-[11px] font-bold text-cyan-300 mb-0.5">
                    2. Внутреннее состояние (Ментал Космонавта)
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeNode.internalMentalManifestation}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5">
                  <div className="text-[11px] font-bold text-amber-300 mb-0.5">
                    ⚡ Что происходит МЕЖДУ локациями (Лиминальный Мост)
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeNode.liminalBridge}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                    <div className="font-bold text-slate-300 mb-0.5">🏛️ Средневековый герметизм</div>
                    <p className="text-slate-400 leading-snug">{activeNode.medievalParallel}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-2">
                    <div className="font-bold text-slate-300 mb-0.5">🚀 Фантастика &amp; ИТ</div>
                    <p className="text-slate-400 leading-snug">{activeNode.scifiTechParallel}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab(activeNode.recommendedGate)}
                  className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-950 cursor-pointer"
                  style={{ backgroundColor: theme.secondaryAccent }}
                >
                  Войти в рекомендованный 4D-Шлюз Узла →
                </button>
                <span className="text-xs text-amber-300 font-bold">
                  Целевой Биом: {BIOMES[activeNode.targetBiome].emoji}{' '}
                  {BIOMES[activeNode.targetBiome].titleRu}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 2: GRAVITY FUNNEL STARGATE 4D ROAD
           ==================================================================== */}
        {activeTab === 'funnel' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-xs text-slate-400">Очки Гармонии Трассы</div>
                <div
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: theme.primaryAccent }}
                  data-testid="funnel-score"
                >
                  {funnelScore}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-xs text-slate-400">Резонансная Цепь (Стрик)</div>
                <div
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: theme.secondaryAccent }}
                >
                  x{funnelStreak} (макс. x{funnelMaxStreak})
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-right">
                <div className="text-xs text-slate-400">Рекорд Шлюза</div>
                <div
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: theme.starColor }}
                >
                  {funnelBest}
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-[#04060E]">
              <canvas
                ref={funnelCanvasRef}
                width={900}
                height={340}
                data-testid="funnel-viewport"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = (e.clientX - rect.left) / rect.width;
                  funnelStateRef.current.funnelX = (relX - 0.5) * 520;
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = (e.clientX - rect.left) / rect.width;
                  funnelStateRef.current.funnelX = (relX - 0.5) * 520;
                  // Instant quantum catch assist on click
                  const st = funnelStateRef.current;
                  const next = calculateFunnelHit(st.score, st.streak, st.maxStreak, true);
                  st.score = next.score;
                  st.streak = next.streak;
                  st.maxStreak = next.maxStreak;
                  setFunnelScore(st.score);
                  setFunnelStreak(st.streak);
                  setFunnelMaxStreak(st.maxStreak);
                  soundFX.playPentatonicNote(st.streak % 10, 300);
                }}
                className="w-full h-[290px] sm:h-[330px] block cursor-pointer touch-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    funnelStateRef.current.funnelX = -165;
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  ◀ Поток Прошлого (-t)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    funnelStateRef.current.funnelX = 0;
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-cyan-200 cursor-pointer"
                >
                  ● Осевой Астрал (t₀)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    funnelStateRef.current.funnelX = 165;
                  }}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white cursor-pointer"
                >
                  Вероятное Будущее (+t) ▶
                </button>
              </div>
              <button
                type="button"
                data-testid="funnel-quantum-catch-btn"
                onClick={() => {
                  const st = funnelStateRef.current;
                  const next = calculateFunnelHit(st.score, st.streak, st.maxStreak, true);
                  st.score = next.score;
                  st.streak = next.streak;
                  st.maxStreak = next.maxStreak;
                  setFunnelScore(st.score);
                  setFunnelStreak(st.streak);
                  setFunnelMaxStreak(st.maxStreak);
                  soundFX.playPentatonicArpeggio(st.streak % 8);
                }}
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 cursor-pointer"
                style={{ backgroundColor: theme.primaryAccent }}
              >
                ✨ Квантовый Захват Сферы (+10 Гармонии)
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: CELESTIAL CAROUSEL 4D-TESSERACT × OBSIDIAN
           ==================================================================== */}
        {activeTab === 'carousel' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-xs text-slate-400">Гармония Тессеракта</div>
                <div
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: theme.primaryAccent }}
                  data-testid="carousel-score"
                >
                  {carouselScore}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3">
                <div className="text-xs text-slate-400">Собранные Созвездия</div>
                <div
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: theme.secondaryAccent }}
                >
                  {carouselScaleCount} (выбрано: {carouselSelectedCount}/3)
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/35 p-3 text-right">
                <div className="text-xs text-slate-400">Рекорд Карусели</div>
                <div
                  className="text-2xl font-extrabold font-mono"
                  style={{ color: theme.starColor }}
                >
                  {carouselBest}
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-[#04060E]">
              <canvas
                ref={carouselCanvasRef}
                width={900}
                height={340}
                data-testid="carousel-viewport"
                onClick={triggerAutoConstellationFusion}
                className="w-full h-[290px] sm:h-[330px] block cursor-pointer touch-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-300">
                4D-Тессеракт вращается вокруг Оси Мира (Axis Mundi), соединяя узлы графа Obsidian синаптическими импульсами.
              </span>
              <button
                type="button"
                onClick={triggerAutoConstellationFusion}
                data-testid="carousel-fuse-btn"
                className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 cursor-pointer"
                style={{ backgroundColor: theme.secondaryAccent }}
              >
                🪐 Собрать 4D-Созвездие (+75 Гармонии)
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: ETHEREAL BUBBLES (VAS HERMETICUM) + 4-4-4-4 PRANA MANDALA
           ==================================================================== */}
        {activeTab === 'bubbles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left 7 cols: Vas Hermeticum Iridescent Vessels */}
            <div className="lg:col-span-7 rounded-2xl border border-white/15 bg-black/40 p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Эфирные Пузыри · Алхимические Ёмкости (Vas Hermeticum)
                  </h3>
                  <p className="text-xs text-slate-300">
                    Иридисцентные сосуды с герметическими сигилами (☉ ☽ △ ▽ ✧ ⬡ ◈ ∞) и слиянием
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-slate-400">Гармония / Рекорд</div>
                  <div
                    className="text-lg font-extrabold"
                    style={{ color: theme.starColor }}
                    data-testid="bubbles-score"
                  >
                    {bubblesScore} / {bubblesBest}
                  </div>
                </div>
              </div>

              <canvas
                ref={bubblesCanvasRef}
                width={540}
                height={260}
                data-testid="bubbles-viewport"
                onClick={triggerBubbleSplitWave}
                className="w-full h-[240px] rounded-xl border border-white/15 bg-[#04060E] block cursor-pointer"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-300">
                  Делений сфер: <strong className="text-white">{bubblesSplitCount}</strong>
                </span>
                <button
                  type="button"
                  onClick={triggerBubbleSplitWave}
                  data-testid="bubbles-split-button"
                  className="px-4 py-2 rounded-xl text-xs font-extrabold text-slate-950 cursor-pointer"
                  style={{ backgroundColor: theme.starColor }}
                >
                  🫧 Разделить эфирную сферу (+15 Гармонии)
                </button>
              </div>
            </div>

            {/* Right 5 cols: 4-4-4-4 Box Breathing Stargate Prana Mandala */}
            <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-slate-950/90 p-4 flex flex-col justify-between text-center">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">
                  Реактор Праны 4-4-4-4 (MindSync)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSessionBreathingSec((s) => s + 16);
                    onAddBreathingSeconds(16);
                    soundFX.playPentatonicArpeggio(2);
                  }}
                  data-testid="breathing-add-cycle-button"
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 border border-indigo-400/40 text-indigo-200 text-xs font-bold cursor-pointer"
                >
                  +1 цикл (16 с)
                </button>
              </div>

              <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-1">
                <canvas
                  ref={reactorCanvasRef}
                  width={220}
                  height={220}
                  className="absolute inset-0 w-full h-full block pointer-events-none"
                />
                <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-3xl font-extrabold font-mono text-slate-950">
                    {breathActive ? breathPhaseTimer : '4'}
                  </div>
                  <div className="text-[11px] font-bold text-slate-900">
                    {breathActive ? phaseInfo.cycleText : 'Готовы'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-slate-300">
                  Сессия декомпрессии:{' '}
                  <strong className="font-mono text-emerald-300">{sessionBreathingSec} с</strong>{' '}
                  (всего: {totalBreathingSec + sessionBreathingSec} с)
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBreathActive((prev) => !prev);
                    soundFX.playPentatonicNote(0, 240);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold text-white cursor-pointer ${
                    breathActive
                      ? 'bg-rose-500 hover:bg-rose-400'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  }`}
                >
                  {breathActive ? '⏸ Пауза дыхания 4-4-4-4' : '▶ Начать дыхание Навигатора 4-4-4-4'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM FOOTER: Destination Biome Picker + Reward Package Conversion + Warp CTA */}
        <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Целевая Ёмкость (3D-Локация):</span>
            {(
              ['CYBER_NEON', 'MEDIEVAL_CITADEL', 'SUNKEN_ATLANTIS', 'SOLAR_SUPERNOVA'] as BiomeKey[]
            ).map((bKey) => {
              const b = BIOMES[bKey];
              const isSelected = targetBiome === bKey;
              return (
                <button
                  key={bKey}
                  type="button"
                  onClick={() => setTargetBiome(bKey)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                      : 'bg-black/40 border-white/15 text-slate-200 hover:border-white/35'
                  }`}
                >
                  {b.emoji} {b.titleRu}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-emerald-400/35 text-xs font-mono flex items-center gap-2.5">
              <span className="text-slate-300">Бонус Транзита:</span>
              <span className="font-bold text-amber-300">+{rewardPreview.bonusGold} 🪙</span>
              <span className="font-bold text-cyan-300">+{rewardPreview.bonusMana} ⚡</span>
              <span className="font-bold text-purple-300">
                +{rewardPreview.bonusQuantumCharges} [Q]
              </span>
              <span className="font-bold text-emerald-300">+{rewardPreview.bonusHpHeal} ОЗ</span>
            </div>

            <button
              type="button"
              data-testid="complete-stargate-transit-btn"
              onClick={handleFinalizeTransit}
              className="px-5 py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-slate-950 shadow-xl transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
              style={{
                background: `linear-gradient(90deg, ${theme.secondaryAccent}, ${theme.starColor})`,
              }}
            >
              🚀 Шагнуть сквозь Врата в {BIOMES[targetBiome].titleRu} (Сектор #{currentLevel}) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
