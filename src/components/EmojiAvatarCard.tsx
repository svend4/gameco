import React, { useState, useRef, useEffect } from 'react';
import { BackgroundStyle, CharacterRole, ROLE_METADATA } from '../game/rules';

interface EmojiAvatarCardProps {
  baseEmoji: string;
  accessoryEmoji: string;
  flagEmoji: string;
  bgStyle: BackgroundStyle;
  role: CharacterRole;
  sizePx?: number;
  hasGlow?: boolean;
  interactive?: boolean;
  testId?: string;
}

const GRADIENT_MAP: Record<BackgroundStyle, string> = {
  Cosmic: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
  Neon: 'linear-gradient(135deg, #9333EA 0%, #2563EB 50%, #10B981 100%)',
  Ocean: 'linear-gradient(135deg, #00AAFF 0%, #0044CC 100%)',
  Forest: 'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',
  Gold: 'linear-gradient(135deg, #D97706 0%, #F59E0B 50%, #B45309 100%)',
};

export const EmojiAvatarCard: React.FC<EmojiAvatarCardProps> = ({
  baseEmoji,
  accessoryEmoji,
  flagEmoji,
  bgStyle,
  role,
  sizePx = 148,
  hasGlow = false,
  interactive = true,
  testId,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotX: 0, rotY: 0, isHovered: false });
  const [ambientPhase, setAmbientPhase] = useState(0);

  useEffect(() => {
    if (!interactive) return;
    let rafId: number;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      setAmbientPhase(elapsed);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [interactive]);

  const ambientX = interactive && !tilt.isHovered ? Math.sin(ambientPhase * 1.8) * 6.5 : 0;
  const ambientY = interactive && !tilt.isHovered ? Math.cos(ambientPhase * 1.4) * 6.5 : 0;

  const totalRotX = tilt.isHovered ? tilt.rotX : ambientX;
  const totalRotY = tilt.isHovered ? tilt.rotY : ambientY;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nx = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)));
    const ny = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)));
    setTilt({
      rotX: -ny * 24,
      rotY: nx * 24,
      isHovered: true,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rotX: 0, rotY: 0, isHovered: false });
  };

  const roleMeta = ROLE_METADATA[role] ?? ROLE_METADATA['Cyber-Ninja'];
  const shineOpacity = Math.min(0.42, (Math.abs(totalRotX) + Math.abs(totalRotY)) / 50 + 0.08);
  const badgeSize = Math.round(sizePx * 0.28);

  return (
    <div
      ref={cardRef}
      data-testid={testId}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        perspective: '750px',
      }}
      className={`relative select-none shrink-0 ${interactive ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div
        style={{
          background: GRADIENT_MAP[bgStyle] || GRADIENT_MAP.Cosmic,
          transform: `rotateX(${totalRotX.toFixed(2)}deg) rotateY(${totalRotY.toFixed(2)}deg) scale(${hasGlow ? 1.04 : 1})`,
          transformStyle: 'preserve-3d',
          transition: tilt.isHovered ? 'transform 60ms linear' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className={`relative w-full h-full rounded-3xl border-2 border-white/85 overflow-hidden shadow-xl ${
          hasGlow ? 'ring-4 ring-amber-400/70' : ''
        }`}
      >
        {/* LAYER 1: Deep Contra-Parallax Background Rings */}
        <div
          style={{
            transform: `translate3d(${(-totalRotY * 1.4).toFixed(1)}px, ${(totalRotX * 1.4).toFixed(1)}px, 0px)`,
          }}
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
        >
          <div
            style={{ width: `${sizePx * 0.86}px`, height: `${sizePx * 0.86}px` }}
            className="rounded-full bg-white/15 flex items-center justify-center"
          >
            <div
              style={{ width: `${sizePx * 0.48}px`, height: `${sizePx * 0.48}px` }}
              className="rounded-full bg-black/15"
            />
          </div>
          <div
            style={{
              width: `${sizePx * 0.18}px`,
              height: `${sizePx * 0.18}px`,
              top: '18%',
              left: '18%',
            }}
            className="absolute rounded-full bg-white/10"
          />
        </div>

        {/* LAYER 2: Base Hero Emoji Character (Center Popout) */}
        <div
          style={{
            transform: `translate3d(${(totalRotY * 0.55).toFixed(1)}px, ${(-totalRotX * 0.55 - 4).toFixed(1)}px, 24px)`,
            fontSize: `${Math.round(sizePx * 0.44)}px`,
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none drop-shadow-md leading-none"
        >
          {baseEmoji || '🦊'}
        </div>

        {/* LAYER 3: Accessory / Weapon Badge at Top-Right */}
        <div
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            transform: `translate3d(${(totalRotY * 1.35).toFixed(1)}px, ${(-totalRotX * 1.35).toFixed(1)}px, 36px)`,
            fontSize: `${Math.round(sizePx * 0.15)}px`,
          }}
          className="absolute top-2 right-2 rounded-full bg-white/95 border border-slate-300/60 shadow-md flex items-center justify-center pointer-events-none leading-none"
        >
          {accessoryEmoji || '👑'}
        </div>

        {/* LAYER 4: Flag / Emblem Badge at Bottom-Left */}
        <div
          style={{
            width: `${badgeSize}px`,
            height: `${badgeSize}px`,
            transform: `translate3d(${(totalRotY * 1.1).toFixed(1)}px, ${(-totalRotX * 1.1).toFixed(1)}px, 32px)`,
            fontSize: `${Math.round(sizePx * 0.15)}px`,
          }}
          className="absolute bottom-6 left-2 rounded-full bg-slate-900/90 border border-white/40 shadow-md flex items-center justify-center pointer-events-none leading-none"
        >
          {flagEmoji || '🏁'}
        </div>

        {/* LAYER 5: RPG Role Title Plate at Bottom */}
        <div className="absolute bottom-0 inset-x-0 bg-black/65 py-1 px-2 text-center pointer-events-none">
          <span
            style={{ fontSize: `${Math.max(9, Math.round(sizePx * 0.075))}px` }}
            className="block font-bold text-white tracking-wide truncate"
          >
            {roleMeta.titleRu}
          </span>
        </div>

        {/* LAYER 6: Holographic Foil Reflection Shine Overlay */}
        <div
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,${shineOpacity.toFixed(
              2
            )}) 50%, rgba(255,255,255,0) 100%)`,
            transform: `translate3d(${(-totalRotY * 2.1).toFixed(1)}px, ${(totalRotX * 2.1).toFixed(1)}px, 40px)`,
          }}
          className="absolute inset-0 pointer-events-none"
        />
      </div>
    </div>
  );
};
