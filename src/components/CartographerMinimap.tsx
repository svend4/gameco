import React from 'react';
import { MazeData, MazeEnemy, Position } from '../game/rules';

interface CartographerMinimapProps {
  maze: MazeData;
  playerPos: Position;
  exploredSet: Set<string>;
  starsRemaining: Position[];
  keyCollected: boolean;
  phaseGatesOpen?: boolean;
  enemies: MazeEnemy[];
  streakCount: number;
  rewindCount: number;
  compassSummary?: string;
  weatherBadge?: string;
  onTriggerRewind: () => void;
}

export const CartographerMinimap: React.FC<CartographerMinimapProps> = ({
  maze,
  playerPos,
  exploredSet,
  starsRemaining,
  keyCollected,
  phaseGatesOpen = false,
  enemies,
  streakCount,
  rewindCount,
  compassSummary,
  weatherBadge,
  onTriggerRewind,
}) => {
  const multiplier = Math.min(2.5, 1 + Math.floor(streakCount / 3) * 0.25);

  return (
    <div
      style={{ backgroundColor: 'rgba(20, 14, 38, 0.94)' }}
      className="pointer-events-auto border border-purple-300/30 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center gap-2 w-44 sm:w-48"
    >
      <div className="w-full flex items-center justify-between text-[10px] font-bold text-purple-200">
        <span>🧭 КАРТА РАЗВЕДКИ</span>
        {streakCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-amber-500/25 border border-amber-400/40 text-amber-300 font-mono-tabular">
            🔥 ×{multiplier.toFixed(2)}
          </span>
        )}
      </div>

      {weatherBadge && (
        <div className="w-full px-2 py-0.5 rounded-lg bg-purple-900/45 border border-purple-400/30 text-[10px] font-bold text-cyan-200 text-center truncate">
          {weatherBadge}
        </div>
      )}

      {/* Minimap Grid with Fog of War */}
      <div
        data-testid="cartographer-minimap"
        style={{
          gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${maze.rows}, minmax(0, 1fr))`,
          aspectRatio: '1 / 1',
        }}
        className="w-full grid gap-[1px] bg-[#0B0816] p-1 rounded-xl border border-purple-400/25"
      >
        {maze.grid.map((row, r) =>
          row.map((tile, c) => {
            const key = `${r},${c}`;
            const isPlayer = playerPos.r === r && playerPos.c === c;
            const isExit = maze.exit.r === r && maze.exit.c === c;
            const isKey = !keyCollected && maze.keyPos?.r === r && maze.keyPos?.c === c;
            const isMerchant = maze.merchantPos?.r === r && maze.merchantPos?.c === c;
            const isPhaseGate = maze.phaseGates?.some((g) => g.r === r && g.c === c);
            const isStar = starsRemaining.some((s) => s.r === r && s.c === c);
            const isEnemy = enemies.some((e) => e.r === r && e.c === c);
            const isExplored = exploredSet.has(key) || isExit || isKey || isMerchant;

            if (!isExplored) {
              return <div key={key} className="w-full h-full bg-[#090612]" />;
            }

            if (tile === 'WALL' && !(phaseGatesOpen && isPhaseGate)) {
              return (
                <div
                  key={key}
                  className={`w-full h-full ${isPhaseGate ? 'bg-purple-500/75' : 'bg-[#352A56]'}`}
                />
              );
            }

            let cellColor = 'bg-[#1B1430]';
            if (isPlayer) cellColor = 'bg-cyan-400 ring-1 ring-white';
            else if (isEnemy) cellColor = 'bg-rose-500';
            else if (isKey) cellColor = 'bg-yellow-300';
            else if (isMerchant) cellColor = 'bg-orange-400';
            else if (isExit) cellColor = keyCollected ? 'bg-emerald-400' : 'bg-rose-400/70';
            else if (isStar) cellColor = 'bg-amber-400';

            return <div key={key} className={`w-full h-full rounded-[1px] ${cellColor}`} />;
          })
        )}
      </div>

      {/* 1.5D Target Vector Compass */}
      {compassSummary && (
        <div className="w-full px-2 py-1 rounded-lg bg-[#120D22] border border-amber-400/30 text-[10px] font-mono-tabular font-bold text-amber-200 text-center truncate">
          {compassSummary}
        </div>
      )}

      {/* Chrono-Rewind Button [Z] */}
      <button
        type="button"
        disabled={rewindCount === 0}
        onClick={onTriggerRewind}
        className="w-full py-1.5 px-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 disabled:opacity-35 border border-cyan-400/40 text-[11px] font-bold text-cyan-200 transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
      >
        <span>⏳ Хроно-Отмотка [Z]</span>
        <span className="font-mono-tabular">({rewindCount})</span>
      </button>
    </div>
  );
};

