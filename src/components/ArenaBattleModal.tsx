import React, { useState, useEffect, useRef } from 'react';
import {
  calculateAttackDamage,
  calculateHealAmount,
  calculateSpecialSpellOutcome,
  ELEMENTAL_SPELLS,
  HeroAvatar,
  MazeEnemy,
} from '../game/rules';
import { EmojiAvatarCard } from './EmojiAvatarCard';
import { soundFX } from '../game/sound';

interface CombatLogEntry {
  id: number;
  message: string;
  type: 'PLAYER' | 'MONSTER' | 'SYSTEM' | 'HEAL' | 'CRITICAL';
}

interface ArenaBattleModalProps {
  enemy: MazeEnemy | null;
  hero: HeroAvatar;
  playerHp: number;
  playerMaxHp: number;
  initialStarEnergy?: number;
  onBattleResolved: (outcome: {
    won: boolean;
    remainingHp: number;
    rewardCoins: number;
    enemyId: string;
  }) => void;
  onRetreat: (remainingHp: number) => void;
}

export const ArenaBattleModal: React.FC<ArenaBattleModalProps> = ({
  enemy,
  hero,
  playerHp,
  playerMaxHp,
  initialStarEnergy = 2,
  onBattleResolved,
  onRetreat,
}) => {
  const [pHp, setPHp] = useState(playerHp);
  const [bHp, setBHp] = useState(enemy?.hp ?? 100);
  const [bMaxHp, setBMaxHp] = useState(enemy?.maxHp ?? 100);
  const [starEnergy, setStarEnergy] = useState(Math.max(1, initialStarEnergy));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [battleResult, setBattleResult] = useState<'ACTIVE' | 'VICTORY' | 'DEFEAT'>('ACTIVE');
  const [bonusCoinsEarned, setBonusCoinsEarned] = useState(0);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enemy) return;
    setPHp(playerHp);
    setBHp(enemy.hp);
    setBMaxHp(enemy.maxHp);
    setStarEnergy(Math.max(2, initialStarEnergy));
    setIsPlayerTurn(true);
    setBattleResult('ACTIVE');
    setBonusCoinsEarned(0);
    setLogs([
      {
        id: 1,
        message: `3D-Дуэль в лабиринте! На арену выходит ${hero.name} [${hero.characterRole}]!`,
        type: 'SYSTEM',
      },
      {
        id: 2,
        message: `Противник: ${enemy.name} ${enemy.emoji} (ОЗ: ${enemy.hp}, АТК: ${enemy.attack}, ЗАЩ: ${enemy.defense})`,
        type: 'SYSTEM',
      },
    ]);
  }, [enemy, hero, playerHp, initialStarEnergy]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!enemy) return null;

  const triggerMonsterCounterAttack = (currentPlayerHp: number) => {
    setTimeout(() => {
      const { damage, isCrit } = calculateAttackDamage(enemy.attack, hero.defense, 0.15);
      const nextHp = Math.max(0, currentPlayerHp - damage);
      setPHp(nextHp);
      soundFX.playHurt();

      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: isCrit
            ? `💥 КРИТ ОТ МОНСТРА! ${enemy.name} ${enemy.emoji} яростно атакует ${hero.baseEmoji} на ${damage} урона!`
            : `👿 ${enemy.name} ${enemy.emoji} атакует вашего бойца на ${damage} урона.`,
          type: isCrit ? 'CRITICAL' : 'MONSTER',
        },
      ]);

      if (nextHp <= 0) {
        setBattleResult('DEFEAT');
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 2,
            message: `💀 Очки здоровья опустились до 0. Страж лабиринта одержал верх!`,
            type: 'SYSTEM',
          },
        ]);
      } else {
        setIsPlayerTurn(true);
      }
    }, 520);
  };

  const handlePlayerAttack = () => {
    if (battleResult !== 'ACTIVE' || !isPlayerTurn) return;
    const { damage, isCrit } = calculateAttackDamage(hero.attack, enemy.defense, 0.22);
    const nextBossHp = Math.max(0, bHp - damage);
    setBHp(nextBossHp);
    setStarEnergy((e) => Math.min(5, e + 1));
    soundFX.playAttack(isCrit);

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: isCrit
          ? `✨ КРИТИЧЕСКИЙ УДАР! ${hero.baseEmoji} ${hero.name} наносит ${damage} урона по ${enemy.name} (+1 ⚡)!`
          : `⚔️ ${hero.baseEmoji} ${hero.name} наносит ${damage} урона по ${enemy.name} (+1 ⚡ заряд стихии).`,
        type: isCrit ? 'CRITICAL' : 'PLAYER',
      },
    ]);

    if (nextBossHp <= 0) {
      setBattleResult('VICTORY');
      soundFX.playVictory();
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          message: `🎉 ПОБЕДА! ${enemy.name} повержен! Награда: +${enemy.rewardCoins + bonusCoinsEarned} монет 🏆`,
          type: 'SYSTEM',
        },
      ]);
      return;
    }

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(pHp);
  };

  const handlePlayerHeal = () => {
    if (battleResult !== 'ACTIVE' || !isPlayerTurn) return;
    const heal = calculateHealAmount(hero.characterRole);
    const nextHp = Math.min(playerMaxHp, pHp + heal);
    setPHp(nextHp);
    soundFX.playHeal();

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: `💖 ${hero.baseEmoji} ${hero.name} применяет звёздный эликсир и восстанавливает +${heal} ОЗ!`,
        type: 'HEAL',
      },
    ]);

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(nextHp);
  };

  const handlePlayerSpecial = () => {
    if (battleResult !== 'ACTIVE' || !isPlayerTurn || starEnergy <= 0) return;
    const outcome = calculateSpecialSpellOutcome(hero);
    const nextBossHp = Math.max(0, bHp - outcome.damage);
    const nextPlayerHp = Math.min(playerMaxHp, pHp + outcome.selfHeal);
    const nextBonus = bonusCoinsEarned + outcome.bonusCoins;

    setStarEnergy((e) => Math.max(0, e - 1));
    setBHp(nextBossHp);
    setPHp(nextPlayerHp);
    setBonusCoinsEarned(nextBonus);
    soundFX.playSpell();

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: `⚛️ ${hero.baseEmoji} тратит 1 ⚡ и активирует [${outcome.spellName}] — ${outcome.damage} стихийного урона!${
          outcome.selfHeal > 0 ? ` (+${outcome.selfHeal} ОЗ)` : ''
        }${outcome.bonusCoins > 0 ? ` (+${outcome.bonusCoins} 🪙)` : ''}`,
        type: 'CRITICAL',
      },
    ]);

    if (nextBossHp <= 0) {
      setBattleResult('VICTORY');
      soundFX.playVictory();
      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          message: `🎉 ПОБЕДА! ${enemy.name} сокрушён древней магией Unicode! (+${enemy.rewardCoins + nextBonus} 🪙) 🏆`,
          type: 'SYSTEM',
        },
      ]);
      return;
    }

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(nextPlayerHp);
  };

  const spellInfo = ELEMENTAL_SPELLS[hero.backgroundStyle];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Пошаговая RPG-Арена"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
    >
      <div className="w-full max-w-2xl bg-[#1A1430] border-2 border-purple-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Banner */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#241B42] border-b border-purple-300/15">
          <div>
            <h2 className="text-lg font-bold text-white">
              ⚔️ Пошаговая 3D RPG-Дуэль
            </h2>
            <p className="text-xs text-purple-200/75">
              Звёздная энергия: ⚡ {starEnergy}/5 (пополняется звёздами в лабиринте и обычной атакой)
            </p>
          </div>
          {battleResult === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => onRetreat(Math.max(15, pHp - 10))}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-purple-100 transition-colors whitespace-nowrap"
            >
              Отступить (-10 ОЗ)
            </button>
          )}
        </div>

        {/* Fighters Stage */}
        <div className="p-5 grid grid-cols-11 gap-3 items-center bg-[#150F28]">
          {/* Left: Player 3D Hero Card */}
          <div className="col-span-5 flex flex-col items-center">
            <div className="text-sm font-bold text-white truncate max-w-full">{hero.name}</div>
            <div className="text-[11px] text-purple-300 mb-2">
              АТК {hero.attack} · ЗАЩ {hero.defense} · ⚡ {starEnergy}
            </div>
            <EmojiAvatarCard
              baseEmoji={hero.baseEmoji}
              accessoryEmoji={hero.accessoryEmoji}
              flagEmoji={hero.flagEmoji}
              bgStyle={hero.backgroundStyle}
              role={hero.characterRole}
              sizePx={112}
              hasGlow={battleResult === 'ACTIVE' && isPlayerTurn}
            />
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs font-mono-tabular mb-1">
                <span className="text-emerald-300 font-bold">ОЗ ГЕРОЯ</span>
                <span className="text-white font-bold">
                  {pHp} / {playerMaxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, (pHp / playerMaxHp) * 100))}%` }}
                  className="h-full bg-emerald-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Center VS Badge */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-rose-600 border-2 border-white/80 flex items-center justify-center font-extrabold text-xs text-white shadow-lg">
              VS
            </div>
          </div>

          {/* Right: Maze Boss / Guardian */}
          <div className="col-span-5 flex flex-col items-center">
            <div className="text-sm font-bold text-rose-200 truncate max-w-full">{enemy.name}</div>
            <div className="text-[11px] text-rose-300/80 mb-2">
              АТК {enemy.attack} · ЗАЩ {enemy.defense} · +{enemy.rewardCoins} 🪙
            </div>
            <div
              className={`w-[112px] h-[112px] rounded-3xl border-2 border-rose-500/60 bg-gradient-to-br from-[#3B0A1E] to-[#16050D] flex items-center justify-center text-6xl shadow-xl ${
                !isPlayerTurn && battleResult === 'ACTIVE' ? 'ring-4 ring-rose-500/60 scale-105' : ''
              } transition-transform`}
            >
              <span className="animate-float-slow">{enemy.emoji}</span>
            </div>
            <div className="w-full mt-3">
              <div className="flex justify-between text-xs font-mono-tabular mb-1">
                <span className="text-rose-300 font-bold">ОЗ БОССА</span>
                <span className="text-white font-bold">
                  {bHp} / {bMaxHp}
                </span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.max(0, Math.min(100, (bHp / bMaxHp) * 100))}%` }}
                  className="h-full bg-rose-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Turn Status & Action Deck */}
        <div className="px-6 py-4 bg-[#1E1636] border-t border-purple-300/15 space-y-3">
          {battleResult === 'ACTIVE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={handlePlayerAttack}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-sm transition-colors flex flex-col items-center"
              >
                <span>⚔️ Атака Оружием</span>
                <span className="text-[11px] font-normal opacity-85">Урон + 22% крит (+1 ⚡)</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn}
                onClick={handlePlayerHeal}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm transition-colors flex flex-col items-center"
              >
                <span>💖 Звёздный Эликсир</span>
                <span className="text-[11px] font-normal opacity-85">Исцеление +25..40 ОЗ</span>
              </button>

              <button
                type="button"
                disabled={!isPlayerTurn || starEnergy <= 0}
                onClick={handlePlayerSpecial}
                className="py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-sm transition-colors flex flex-col items-center"
              >
                <span>{spellInfo.spellName}</span>
                <span className="text-[11px] font-normal opacity-85">
                  Цена: 1 ⚡ (Зарядов: {starEnergy})
                </span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 bg-[#140E26] p-3.5 rounded-2xl border border-purple-400/30">
              <div className="text-sm font-bold text-white">
                {battleResult === 'VICTORY'
                  ? `🎉 Страж повержен! Получено +${enemy.rewardCoins + bonusCoinsEarned} монет.`
                  : '💀 Ваш герой пал в дуэли со стражем лабиринта.'}
              </div>
              <button
                type="button"
                onClick={() =>
                  onBattleResolved({
                    won: battleResult === 'VICTORY',
                    remainingHp: pHp,
                    rewardCoins: battleResult === 'VICTORY' ? enemy.rewardCoins + bonusCoinsEarned : 0,
                    enemyId: enemy.id,
                  })
                }
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors whitespace-nowrap"
              >
                {battleResult === 'VICTORY' ? 'Вернуться в 3D-Лабиринт →' : 'Завершить бой'}
              </button>
            </div>
          )}

          {/* Retro Monospace Combat Log Terminal */}
          <div
            ref={logContainerRef}
            className="h-36 rounded-xl bg-[#110D1E] border border-purple-300/20 p-3 overflow-y-auto space-y-1.5 font-mono-tabular text-xs"
          >
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-emerald-400 font-bold select-none">&gt;</span>
                <span
                  className={
                    log.type === 'CRITICAL'
                      ? 'text-amber-300 font-bold'
                      : log.type === 'PLAYER'
                      ? 'text-cyan-300'
                      : log.type === 'MONSTER'
                      ? 'text-rose-400'
                      : log.type === 'HEAL'
                      ? 'text-emerald-300'
                      : 'text-purple-100 font-semibold'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
