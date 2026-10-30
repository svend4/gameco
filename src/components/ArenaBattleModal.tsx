import React, { useState, useEffect, useRef } from 'react';
import {
  calculateAttackDamage,
  calculateHealAmount,
  calculateSpecialSpellOutcome,
  ELEMENTAL_SPELLS,
  ELITE_AFFIX_META,
  evaluateBestiaryHuntBonus,
  evaluateGlyphSynergy,
  FamiliarCompanion,
  HeroAvatar,
  MazeEnemy,
  RuneGlyph,
  TerrainCombatBuff,
  weaveRuneComboSpell,
} from '../game/rules';
import { EmojiAvatarCard } from './EmojiAvatarCard';
import { soundFX } from '../game/sound';

interface CombatLogEntry {
  id: number;
  message: string;
  type: 'PLAYER' | 'MONSTER' | 'SYSTEM' | 'HEAL' | 'CRITICAL';
}

interface FloatingPopup {
  id: number;
  target: 'HERO' | 'BOSS';
  text: string;
  colorClass: string;
}

interface ArenaBattleModalProps {
  enemy: MazeEnemy | null;
  hero: HeroAvatar;
  activeFamiliar?: FamiliarCompanion;
  playerHp: number;
  playerMaxHp: number;
  initialStarEnergy?: number;
  activePerks?: string[];
  terrainBuff?: TerrainCombatBuff;
  bestiaryKills?: Record<string, number>;
  tarotAtkBonusPct?: number;
  onBattleResolved: (outcome: {
    won: boolean;
    remainingHp: number;
    remainingStarEnergy: number;
    rewardCoins: number;
    enemyId: string;
  }) => void;
  onRetreat: (remainingHp: number, remainingStarEnergy: number) => void;
}

export const ArenaBattleModal: React.FC<ArenaBattleModalProps> = ({
  enemy,
  hero,
  activeFamiliar,
  playerHp,
  playerMaxHp,
  initialStarEnergy = 2,
  activePerks = [],
  terrainBuff,
  bestiaryKills = {},
  tarotAtkBonusPct = 0,
  onBattleResolved,
  onRetreat,
}) => {
  const [pHp, setPHp] = useState(playerHp);
  const [bHp, setBHp] = useState(enemy?.hp ?? 100);
  const [bMaxHp, setBMaxHp] = useState(enemy?.maxHp ?? 100);
  const [starEnergy, setStarEnergy] = useState(Math.max(1, initialStarEnergy));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [turnIndex, setTurnIndex] = useState(0);
  const [bossBurnDmg, setBossBurnDmg] = useState(0);
  const [bossFrozen, setBossFrozen] = useState(false);
  const [runeQueue, setRuneQueue] = useState<RuneGlyph[]>([]);
  const [battleResult, setBattleResult] = useState<'ACTIVE' | 'VICTORY' | 'DEFEAT'>('ACTIVE');
  const [bonusCoinsEarned, setBonusCoinsEarned] = useState(0);
  const [logs, setLogs] = useState<CombatLogEntry[]>([]);
  const [floatingPopups, setFloatingPopups] = useState<FloatingPopup[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const spawnPopup = (target: 'HERO' | 'BOSS', text: string, colorClass: string) => {
    const id = Date.now() + Math.random();
    setFloatingPopups((prev) => [...prev.slice(-4), { id, target, text, colorClass }]);
    setTimeout(() => {
      setFloatingPopups((prev) => prev.filter((p) => p.id !== id));
    }, 950);
  };

  const synergy = evaluateGlyphSynergy(
    hero.characterRole,
    hero.baseEmoji,
    hero.accessoryEmoji,
    hero.flagEmoji,
    hero.backgroundStyle
  );

  const hasVampirism = activePerks.includes('perk-vampirism');
  const hasSpellWeaver = activePerks.includes('perk-spell-weaver');

  useEffect(() => {
    if (!enemy) return;
    setPHp(playerHp);
    const openingShock = terrainBuff?.bossOpeningDamagePct
      ? Math.round((enemy.hp * terrainBuff.bossOpeningDamagePct) / 100)
      : 0;
    const initialBossHp = Math.max(20, enemy.hp - openingShock);
    setBHp(initialBossHp);
    setBMaxHp(enemy.maxHp);
    const startEnergy =
      synergy.passiveKey === 'ARCANE_OVERLOAD'
        ? Math.min(5, Math.max(2, initialStarEnergy) + 1)
        : Math.max(2, initialStarEnergy);
    setStarEnergy(startEnergy);
    setIsPlayerTurn(true);
    setTurnIndex(0);
    setBossBurnDmg(0);
    setBossFrozen(false);
    setRuneQueue([]);
    setBattleResult('ACTIVE');
    setBonusCoinsEarned(0);
    setFloatingPopups([]);

    const weaknessMatch = hero.backgroundStyle === enemy.elementWeakness;
    const affixMeta = enemy.affix && enemy.affix !== 'NONE' ? ELITE_AFFIX_META[enemy.affix] : null;
    const huntMeta = evaluateBestiaryHuntBonus(enemy.emoji, bestiaryKills);
    setLogs([
      {
        id: 1,
        message: `⚔️ 3D-Дуэль! ${hero.name} [${synergy.titleRu}] против ${enemy.name} ${enemy.emoji}${
          affixMeta ? ` [${affixMeta.labelRu}]` : ''
        }${terrainBuff ? ` · Рельеф: [${terrainBuff.titleRu}]` : ''}!`,
        type: 'SYSTEM',
      },
      {
        id: 2,
        message: `${
          weaknessMatch
            ? `🔥 СТИХИЙНОЕ ПРЕВОСХОДСТВО (×1.35)! `
            : `Слабость босса: [${ELEMENTAL_SPELLS[enemy.elementWeakness].title}]. `
        }${huntMeta.bonusPct > 0 ? `🏆 Бонус Бестиария: +${huntMeta.bonusPct}% АТК! ` : ''}${
          openingShock > 0 ? `⚙️ Осадные шипы ранили босса на -${openingShock} ОЗ!` : ''
        }`,
        type: weaknessMatch || openingShock > 0 ? 'CRITICAL' : 'SYSTEM',
      },
    ]);
  }, [
    enemy,
    hero,
    activeFamiliar,
    playerHp,
    initialStarEnergy,
    synergy.passiveKey,
    synergy.titleRu,
    terrainBuff,
    bestiaryKills,
  ]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  if (!enemy) return null;

  const isWeaknessMatch = hero.backgroundStyle === enemy.elementWeakness;
  const huntBonus = evaluateBestiaryHuntBonus(enemy.emoji, bestiaryKills);
  const elementalMultiplier =
    (isWeaknessMatch ? 1.35 : 1.0) *
    huntBonus.damageMultiplier *
    (1 + tarotAtkBonusPct / 100);
  const effectiveHeroDef = hero.defense + (terrainBuff?.bonusDef ?? 0);
  const affixInfo = enemy.affix && enemy.affix !== 'NONE' ? ELITE_AFFIX_META[enemy.affix] : null;

  const triggerMonsterCounterAttack = (
    currentPlayerHp: number,
    currentBossHp: number,
    activeBurn: number,
    isFrozenNext: boolean
  ) => {
    setTimeout(() => {
      let updatedBossHp = currentBossHp;

      // 1. Tick Burn Damage over time
      if (activeBurn > 0 && updatedBossHp > 0) {
        updatedBossHp = Math.max(0, updatedBossHp - activeBurn);
        setBHp(updatedBossHp);
        spawnPopup('BOSS', `🔥 -${activeBurn}`, 'text-amber-300 border-amber-400');
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: `🔥 Ожог от рунического пламени наносит ${activeBurn} урона по ${enemy.name}!`,
            type: 'CRITICAL',
          },
        ]);
        if (updatedBossHp <= 0) {
          setBattleResult('VICTORY');
          soundFX.playVictory();
          return;
        }
      }

      // 2. Check if Boss is Frozen
      if (isFrozenNext) {
        setBossFrozen(false);
        setIsPlayerTurn(true);
        spawnPopup('BOSS', '❄️ ЗАМОРОЖЕН', 'text-cyan-300 border-cyan-400');
        setLogs((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            message: `❄️ ${enemy.name} скован криогенным льдом и пропускает свой ход!`,
            type: 'HEAL',
          },
        ]);
        return;
      }

      // 3. Normal Boss Counter-attack + Elite Affix Effects + Terrain Defense
      const { damage: rawDmg, isCrit } = calculateAttackDamage(enemy.attack, effectiveHeroDef, 0.15);
      const baseMitigated =
        synergy.passiveKey === 'HOLY_AEGIS' ? Math.max(5, Math.round(rawDmg * 0.78)) : rawDmg;
      const auraBonus = enemy.affix === 'BLAZING' ? 4 : 0;
      const damage = baseMitigated + auraBonus;
      const terrainRegen = terrainBuff?.healPerTurn ?? 0;
      const nextHp = Math.min(playerMaxHp, Math.max(0, currentPlayerHp - damage) + terrainRegen);
      setPHp(nextHp);
      soundFX.playHurt();
      spawnPopup(
        'HERO',
        isCrit ? `💥 -${damage} КРИТ!` : `-${damage} ОЗ`,
        'text-rose-300 border-rose-400'
      );

      if (enemy.affix === 'VAMPIRIC' && updatedBossHp > 0) {
        const vampBoss = Math.max(3, Math.round(damage * 0.25));
        updatedBossHp = Math.min(bMaxHp, updatedBossHp + vampBoss);
        setBHp(updatedBossHp);
      }

      setLogs((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          message: isCrit
            ? `💥 КРИТ ОТ СТРАЖА! ${enemy.name} ${enemy.emoji} яростно атакует на ${damage} урона!`
            : `👿 ${enemy.name} ${enemy.emoji} атакует вашего бойца на ${damage} урона${
                terrainRegen > 0 ? ` (Рельеф +${terrainRegen} ОЗ)` : ''
              }${enemy.affix === 'VAMPIRIC' ? ' [🩸 Вампиризм босса]' : ''}.`,
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
    const forceFirstCrit = turnIndex === 0 && synergy.passiveKey === 'FIRST_STRIKE_CRIT';
    const baseCrit = synergy.passiveKey === 'PHASE_WALK' ? 0.35 : 0.22;
    const critChance = forceFirstCrit
      ? 1.0
      : Math.min(0.85, baseCrit + (terrainBuff?.bonusCritChance ?? 0));
    const { damage: rawDmg, isCrit } = calculateAttackDamage(
      hero.attack,
      enemy.defense,
      critChance
    );
    const petStrike = activeFamiliar?.combatStrikeDamage ?? 0;
    const petHeal = activeFamiliar?.combatHeal ?? 0;
    const damage = Math.round(rawDmg * elementalMultiplier) + petStrike;
    const nextBossHp = Math.max(0, bHp - damage);
    setBHp(nextBossHp);
    setTurnIndex((t) => t + 1);
    setStarEnergy((e) => Math.min(5, e + 1));
    soundFX.playAttack(isCrit);

    spawnPopup(
      'BOSS',
      isCrit ? `💥 -${damage} КРИТ!` : `⚔️ -${damage}`,
      isCrit ? 'text-amber-300 border-amber-400' : 'text-cyan-200 border-cyan-400'
    );

    let nextPlayerHp = pHp;
    const vampHeal = (hasVampirism ? Math.max(4, Math.round(damage * 0.3)) : 0) + petHeal;
    if (vampHeal > 0) {
      nextPlayerHp = Math.min(playerMaxHp, pHp + vampHeal);
      setPHp(nextPlayerHp);
      spawnPopup('HERO', `+${vampHeal} ОЗ`, 'text-emerald-300 border-emerald-400');
    }

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: isCrit
          ? `✨ КРИТИЧЕСКИЙ УДАР! ${hero.baseEmoji}${
              activeFamiliar ? `+${activeFamiliar.emoji}` : ''
            } наносит ${damage} урона по ${enemy.name} (+1 ⚡)${
              vampHeal > 0 ? ` [+${vampHeal} ОЗ]` : ''
            }!`
          : `⚔️ ${hero.baseEmoji}${
              activeFamiliar ? `+${activeFamiliar.emoji}` : ''
            } наносит ${damage} урона по ${enemy.name} (+1 ⚡)${
              vampHeal > 0 ? ` [+${vampHeal} ОЗ]` : ''
            }.`,
        type: isCrit ? 'CRITICAL' : 'PLAYER',
      },
    ]);

    if (nextBossHp <= 0) {
      setBattleResult('VICTORY');
      soundFX.playVictory();
      return;
    }

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(nextPlayerHp, nextBossHp, bossBurnDmg, bossFrozen);
  };

  const handlePlayerHeal = () => {
    if (battleResult !== 'ACTIVE' || !isPlayerTurn) return;
    const heal = calculateHealAmount(hero.characterRole) + (activeFamiliar?.combatHeal ?? 0);
    const nextHp = Math.min(playerMaxHp, pHp + heal);
    setPHp(nextHp);
    setTurnIndex((t) => t + 1);
    soundFX.playHeal();
    spawnPopup('HERO', `💖 +${heal} ОЗ`, 'text-emerald-300 border-emerald-400');

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: `💖 ${hero.baseEmoji} ${hero.name} применяет звёздный эликсир и восстанавливает +${heal} ОЗ!`,
        type: 'HEAL',
      },
    ]);

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(nextHp, bHp, bossBurnDmg, bossFrozen);
  };

  const handlePlayerSpecial = () => {
    if (battleResult !== 'ACTIVE' || !isPlayerTurn || starEnergy <= 0) return;
    const outcome = calculateSpecialSpellOutcome(hero);
    const finalDamage =
      Math.round(outcome.damage * elementalMultiplier) + (activeFamiliar?.combatStrikeDamage ?? 0);
    const nextBossHp = Math.max(0, bHp - finalDamage);
    const nextPlayerHp = Math.min(
      playerMaxHp,
      pHp + outcome.selfHeal + (activeFamiliar?.combatHeal ?? 0)
    );
    const nextBonus = bonusCoinsEarned + outcome.bonusCoins;

    setStarEnergy((e) => Math.max(0, e - 1));
    setBHp(nextBossHp);
    setPHp(nextPlayerHp);
    setTurnIndex((t) => t + 1);
    setBonusCoinsEarned(nextBonus);
    soundFX.playSpell();
    spawnPopup('BOSS', `⚛️ -${finalDamage}`, 'text-purple-200 border-purple-400');

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: `⚛️ ${hero.baseEmoji} тратит 1 ⚡ и активирует [${outcome.spellName}] — ${finalDamage} стихийного урона!`,
        type: 'CRITICAL',
      },
    ]);

    if (nextBossHp <= 0) {
      setBattleResult('VICTORY');
      soundFX.playVictory();
      return;
    }

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(nextPlayerHp, nextBossHp, bossBurnDmg, bossFrozen);
  };

  const handlePushRune = (glyph: RuneGlyph) => {
    if (battleResult !== 'ACTIVE' || !isPlayerTurn || starEnergy < 2) return;
    const nextQueue = [...runeQueue, glyph];
    if (nextQueue.length < 3) {
      setRuneQueue(nextQueue);
      return;
    }

    // Execute 3-Rune Woven Spell!
    const woven = weaveRuneComboSpell(
      nextQueue,
      hero.attack,
      hasSpellWeaver || synergy.passiveKey === 'ARCANE_OVERLOAD'
    );
    const totalDmg =
      Math.round(woven.damage * elementalMultiplier) + (activeFamiliar?.combatStrikeDamage ?? 0);
    const nextBossHp = Math.max(0, bHp - totalDmg);
    const nextPlayerHp = Math.min(playerMaxHp, pHp + woven.selfHeal);
    const nextBurn = bossBurnDmg + woven.inflictBurn;

    setRuneQueue([]);
    setStarEnergy((e) => Math.max(0, e - 2));
    setBHp(nextBossHp);
    setPHp(nextPlayerHp);
    setBossBurnDmg(nextBurn);
    setBossFrozen(woven.inflictFreeze);
    setTurnIndex((t) => t + 1);
    soundFX.playSpell();
    spawnPopup('BOSS', `🎹 -${totalDmg}!`, 'text-amber-300 border-amber-400');

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        message: `🎹 СИНТЕЗ РУН [${woven.comboCode}] -> «${woven.spellTitleRu}»! Нанесено ${totalDmg} урона!${
          woven.selfHeal > 0 ? ` (+${woven.selfHeal} ОЗ)` : ''
        }${woven.inflictBurn > 0 ? ` [🔥 Ожог +${woven.inflictBurn}/ход]` : ''}${
          woven.inflictFreeze ? ' [❄️ БОСС ЗАМОРОЖЕН]' : ''
        }`,
        type: 'CRITICAL',
      },
    ]);

    if (nextBossHp <= 0) {
      setBattleResult('VICTORY');
      soundFX.playVictory();
      return;
    }

    setIsPlayerTurn(false);
    triggerMonsterCounterAttack(nextPlayerHp, nextBossHp, nextBurn, woven.inflictFreeze);
  };

  const spellInfo = ELEMENTAL_SPELLS[hero.backgroundStyle];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Пошаговая RPG-Арена"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto"
    >
      <div className="w-full max-w-2xl bg-[#1A1430] border-2 border-purple-400/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Banner */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#241B42] border-b border-purple-300/15">
          <div>
            <h2 className="text-lg font-bold text-white">
              ⚔️ Пошаговая 3D RPG-Дуэль · {synergy.titleRu}
            </h2>
            <p className="text-xs text-purple-200/75">
              Мана: ⚡ {starEnergy}/5 · Слабость босса: {ELEMENTAL_SPELLS[enemy.elementWeakness].title}
              {isWeaknessMatch ? ' (×1.35!)' : ''}
              {terrainBuff ? ` · ${terrainBuff.badge}` : ''}
              {huntBonus.bonusPct > 0 ? ` · 🏆 Охотник +${huntBonus.bonusPct}%` : ''}
            </p>
          </div>
          {battleResult === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => onRetreat(Math.max(15, pHp - 10), starEnergy)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-purple-100 transition-colors whitespace-nowrap"
            >
              Отступить (-10 ОЗ)
            </button>
          )}
        </div>

        {/* Fighters Stage */}
        <div className="p-4 grid grid-cols-11 gap-3 items-center bg-[#150F28]">
          {/* Left: Player 3D Hero Card + Floating Combat Text */}
          <div className="col-span-5 flex flex-col items-center relative">
            <div className="text-sm font-bold text-white truncate max-w-full">
              {hero.name} {activeFamiliar ? activeFamiliar.emoji : ''}
            </div>
            <div className="text-[11px] text-purple-300 mb-2">
              АТК {hero.attack} · ЗАЩ {hero.defense} · ⚡ {starEnergy}
            </div>
            <div className="relative">
              <EmojiAvatarCard
                baseEmoji={hero.baseEmoji}
                accessoryEmoji={hero.accessoryEmoji}
                flagEmoji={hero.flagEmoji}
                bgStyle={hero.backgroundStyle}
                role={hero.characterRole}
                sizePx={104}
                hasGlow={battleResult === 'ACTIVE' && isPlayerTurn}
              />
              {floatingPopups
                .filter((p) => p.target === 'HERO')
                .map((p) => (
                  <div
                    key={p.id}
                    className={`pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border font-extrabold text-xs whitespace-nowrap shadow-xl animate-bounce ${p.colorClass}`}
                  >
                    {p.text}
                  </div>
                ))}
            </div>
            <div className="w-full mt-2.5">
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

          {/* Center 1.5D Spectral Clash Oscilloscope & VS Bridge */}
          <div className="col-span-1 flex flex-col items-center justify-center relative">
            <svg
              viewBox="0 0 64 120"
              className="w-12 h-24 overflow-visible pointer-events-none"
              aria-hidden="true"
            >
              {/* 1.5D Primary Harmonic Standing Wave */}
              <path
                d={
                  runeQueue.length >= 2
                    ? 'M 32 6 Q 6 24, 32 42 T 32 78 T 32 114'
                    : starEnergy >= 3
                    ? 'M 32 6 Q 12 30, 32 60 T 32 114'
                    : 'M 32 10 Q 22 36, 32 60 T 32 110'
                }
                fill="none"
                stroke={
                  runeQueue.includes('🔥')
                    ? '#f59e0b'
                    : runeQueue.includes('❄️')
                    ? '#22d3ee'
                    : isWeaknessMatch
                    ? '#a855f7'
                    : '#ec4899'
                }
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* 1.5D Counter-Phase Echo Wave (3.5D Temporal Superposition) */}
              <path
                d="M 32 6 Q 54 30, 32 60 T 32 114"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.75"
                strokeDasharray="4 3"
                opacity="0.65"
              />
            </svg>
            <div className="absolute w-9 h-9 rounded-full bg-rose-600 border-2 border-white/85 flex items-center justify-center font-extrabold text-[11px] text-white shadow-lg">
              {runeQueue.length > 0 ? `${runeQueue.length}/3` : 'VS'}
            </div>
            <span className="mt-0.5 text-[9px] font-mono-tabular font-bold text-cyan-300/90 uppercase tracking-tighter">
              1.5D⚡3.5D
            </span>
          </div>

          {/* Right: Maze Boss / Guardian + Elite Affix Badge + 3.5D Phase Echo + Floating Combat Text */}
          <div className="col-span-5 flex flex-col items-center relative">
            <div className="text-sm font-bold text-rose-200 truncate max-w-full">{enemy.name}</div>
            <div className="text-[11px] text-rose-300/80 mb-2">
              АТК {enemy.attack} · ЗАЩ {enemy.defense} · +{enemy.rewardCoins} 🪙
              {affixInfo ? ` · ${affixInfo.labelRu}` : ''}
            </div>
            <div
              className={`relative w-[104px] h-[104px] rounded-3xl border-2 border-rose-500/60 bg-gradient-to-br from-[#3B0A1E] to-[#16050D] flex items-center justify-center text-5xl shadow-xl ${
                !isPlayerTurn && battleResult === 'ACTIVE' ? 'ring-4 ring-rose-500/60 scale-105' : ''
              } transition-transform`}
            >
              {/* 3.5D Holographic Chromatic Phase Afterimage behind Boss */}
              <span
                aria-hidden="true"
                style={{ transform: 'translate(5px, -4px) scale(1.06)' }}
                className="absolute opacity-25 blur-[0.5px] select-none pointer-events-none text-cyan-300"
              >
                {enemy.emoji}
              </span>
              <span className="relative z-10 animate-float-slow">{enemy.emoji}</span>
              {(bossBurnDmg > 0 || bossFrozen) && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-black/90 border border-white/30 text-[10px] font-bold text-amber-300">
                  {bossFrozen ? '❄️ ЛЁД' : `🔥 -${bossBurnDmg}`}
                </div>
              )}
              {floatingPopups
                .filter((p) => p.target === 'BOSS')
                .map((p) => (
                  <div
                    key={p.id}
                    className={`pointer-events-none absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/90 border font-extrabold text-xs whitespace-nowrap shadow-xl animate-bounce ${p.colorClass}`}
                  >
                    {p.text}
                  </div>
                ))}
            </div>
            <div className="w-full mt-2.5">
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
        <div className="px-6 py-3.5 bg-[#1E1636] border-t border-purple-300/15 space-y-2.5">
          {battleResult === 'ACTIVE' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!isPlayerTurn}
                  onClick={handlePlayerAttack}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors flex flex-col items-center"
                >
                  <span>⚔️ Атака Оружием</span>
                  <span className="text-[11px] font-normal opacity-85">Урон + заряд (+1 ⚡)</span>
                </button>

                <button
                  type="button"
                  disabled={!isPlayerTurn}
                  onClick={handlePlayerHeal}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors flex flex-col items-center"
                >
                  <span>💖 Звёздный Эликсир</span>
                  <span className="text-[11px] font-normal opacity-85">Исцеление +25..40 ОЗ</span>
                </button>

                <button
                  type="button"
                  disabled={!isPlayerTurn || starEnergy <= 0}
                  onClick={handlePlayerSpecial}
                  className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors flex flex-col items-center"
                >
                  <span>{spellInfo.spellName}</span>
                  <span className="text-[11px] font-normal opacity-85">
                    Цена: 1 ⚡ (Зарядов: {starEnergy})
                  </span>
                </button>
              </div>

              {/* INNOVATION: COMBO SPELL WEAVING SYNTHESIZER BAR */}
              <div className="p-2.5 rounded-2xl bg-[#130D24] border border-purple-400/25 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-amber-300">🎹 Синтезатор Рун (2 ⚡):</span>{' '}
                  <span className="text-purple-200/80">
                    Выберите 3 глифа для сплетения заклинания ({runeQueue.length}/3):{' '}
                    <strong className="text-white">{runeQueue.join(' ') || '—'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['🔥', '❄️', '⚡'] as RuneGlyph[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      disabled={!isPlayerTurn || starEnergy < 2}
                      onClick={() => handlePushRune(g)}
                      className="px-3 py-1 rounded-lg bg-purple-700/60 hover:bg-purple-600 disabled:opacity-35 border border-purple-300/30 text-xs font-bold text-white transition-colors"
                    >
                      + {g}
                    </button>
                  ))}
                  {runeQueue.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setRuneQueue([])}
                      className="px-2 py-1 rounded-lg bg-white/10 text-[11px] text-purple-200"
                    >
                      Сброс
                    </button>
                  )}
                </div>
              </div>
            </>
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
                    remainingStarEnergy: starEnergy,
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
            className="h-28 rounded-xl bg-[#110D1E] border border-purple-300/20 p-3 overflow-y-auto space-y-1.5 font-mono-tabular text-xs"
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
