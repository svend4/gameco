import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ACHIEVEMENTS_CATALOG,
  ALCHEMICAL_POTIONS_CATALOG,
  AlchemicalPotionId,
  BIOME_ORDER,
  BiomeKey,
  BIOMES,
  BOSS_ROSTER,
  BountyContract,
  calculateHeroStats,
  calculateTalentBonuses,
  castCorridorShockwave,
  computeQuantumPhaseTarget,
  computeRunMasteryGrade,
  computeTargetCompass,
  destroyAdjacentWalls,
  DIFFICULTIES,
  DifficultyKey,
  DimensionalMode,
  DIMENSIONAL_MODE_META,
  ELEMENTAL_SPELLS,
  evaluateGlyphSynergy,
  evaluateRoyalRank,
  evaluateTerrainCombatBuff,
  FamiliarId,
  FAMILIARS_CATALOG,
  findShortestPath,
  GAME_MODES,
  GameModeKey,
  generateMaze,
  generateNextTierBounty,
  GUILD_ORDERS_CATALOG,
  GuildOrderId,
  HeroAvatar,
  INITIAL_BOUNTY_CONTRACTS,
  INITIAL_HERO_ROSTER,
  isWalkableTile,
  MazeData,
  MazeEnemy,
  MultiverseProfileSnapshot,
  Position,
  purchaseSkinTransaction,
  ROGUELIKE_PERKS_POOL,
  RoguelikePerk,
  ROLE_METADATA,
  SECTOR_ANOMALIES,
  SECTOR_WEATHERS_CATALOG,
  SectorAnomalyKey,
  SectorWeatherKey,
  SHOP_SKINS_CATALOG,
  ShopSkin,
  stepEnemies,
  SURREAL_THEMES,
  TAROT_CARDS_CATALOG,
  TarotCardId,
  toggleMazeWall,
  TransitRewardPackage,
  upgradeHeroTransaction,
  HarmonyRecord,
} from './game/rules';
import { soundFX } from './game/sound';
import { EmojiAvatarCard } from './components/EmojiAvatarCard';
import { AvatarStudioModal } from './components/AvatarStudioModal';
import { ArenaBattleModal } from './components/ArenaBattleModal';
import { SynergyCodexModal } from './components/SynergyCodexModal';
import { Maze3DViewport, VfxBurstPayload } from './components/Maze3DViewport';
import { CartographerMinimap } from './components/CartographerMinimap';
import { LiminalStargateTransitModal } from './components/LiminalStargateTransitModal';
import { GitHubOmniMergeModal } from './components/GitHubOmniMergeModal';

type ShellState = 'title' | 'playing' | 'paused' | 'gameover';

interface RunSummary {
  victory: boolean;
  levelCleared: number;
  starsCollected: number;
  totalStars: number;
  enemiesDefeated: number;
  coinsEarned: number;
  clearTimeSec: number;
}

interface ChronoSnapshot {
  playerPos: Position;
  enemies: MazeEnemy[];
  playerHp: number;
  starEnergy: number;
}

const STORAGE_KEY = 'emoji_universe_save_v1';

export default function App() {
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).coins ?? 60;
    } catch {}
    return 60;
  });

  const [highLevel, setHighLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).highLevel ?? 1;
    } catch {}
    return 1;
  });

  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).unlockedSkins ?? ['😀', '🦊', '🤠', '🐉'];
    } catch {}
    return ['😀', '🦊', '🤠', '🐉'];
  });

  const [savedHeroes, setSavedHeroes] = useState<HeroAvatar[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved).savedHeroes;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_HERO_ROSTER;
  });

  const [activeHeroId, setActiveHeroId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).activeHeroId) return JSON.parse(saved).activeHeroId;
    } catch {}
    return INITIAL_HERO_ROSTER[0].id;
  });

  const [activeFamiliarId, setActiveFamiliarId] = useState<FamiliarId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).activeFamiliarId) return JSON.parse(saved).activeFamiliarId;
    } catch {}
    return 'owl';
  });

  const [bountiesCompletedCount, setBountiesCompletedCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).bountiesCompletedCount ?? 0;
    } catch {}
    return 0;
  });

  const [bestiaryKills, setBestiaryKills] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).bestiaryKills) return JSON.parse(saved).bestiaryKills;
    } catch {}
    return {};
  });

  const [activeTarotId, setActiveTarotId] = useState<TarotCardId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).activeTarotId) return JSON.parse(saved).activeTarotId;
    } catch {}
    return 'wheel-of-fortune';
  });

  const [activeGuildId, setActiveGuildId] = useState<GuildOrderId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).activeGuildId) return JSON.parse(saved).activeGuildId;
    } catch {}
    return 'ORDER_TEMPLARS';
  });

  const [claimedAchievements, setClaimedAchievements] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Array.isArray(JSON.parse(saved).claimedAchievements)) {
        return JSON.parse(saved).claimedAchievements;
      }
    } catch {}
    return [];
  });

  const [talentRanks, setTalentRanks] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).talentRanks) return JSON.parse(saved).talentRanks;
    } catch {}
    return {};
  });

  const [gameMode, setGameMode] = useState<GameModeKey>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).gameMode) return JSON.parse(saved).gameMode;
    } catch {}
    return 'CAMPAIGN';
  });

  const [sectorAnomaly, setSectorAnomaly] = useState<SectorAnomalyKey>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && JSON.parse(saved).sectorAnomaly) return JSON.parse(saved).sectorAnomaly;
    } catch {}
    return 'STANDARD';
  });

  const talentBonuses = calculateTalentBonuses(talentRanks);

  const activeTarot =
    TAROT_CARDS_CATALOG.find((t) => t.id === activeTarotId) ?? TAROT_CARDS_CATALOG[0];

  const activeGuild =
    GUILD_ORDERS_CATALOG.find((g) => g.id === activeGuildId) ?? GUILD_ORDERS_CATALOG[0];

  const baseActiveHero =
    savedHeroes.find((h) => h.id === activeHeroId) || savedHeroes[0] || INITIAL_HERO_ROSTER[0];

  const activeHero: HeroAvatar = {
    ...baseActiveHero,
    hp: baseActiveHero.hp + talentBonuses.bonusHp,
    attack: baseActiveHero.attack + talentBonuses.bonusAtk,
    defense: baseActiveHero.defense + talentBonuses.bonusDef,
  };

  const activeFamiliar =
    FAMILIARS_CATALOG[activeFamiliarId] ?? FAMILIARS_CATALOG.owl;

  const royalRank = evaluateRoyalRank(bountiesCompletedCount, highLevel, activeHero.wins);
  const tarotGoldMult = 1 + activeTarot.goldBonusPct / 100;
  const guildGoldMult = 1 + activeGuild.goldBonusPct / 100;
  const modeGoldMult = GAME_MODES[gameMode]?.bonusCoinsMultiplier ?? 1.0;
  const royalGoldMultiplier =
    (1 + royalRank.goldBonusPercent / 100) * tarotGoldMult * guildGoldMult * modeGoldMult;

  const activeSynergy = evaluateGlyphSynergy(
    activeHero.characterRole,
    activeHero.baseEmoji,
    activeHero.accessoryEmoji,
    activeHero.flagEmoji,
    activeHero.backgroundStyle
  );

  // Settings, Biomes, 4.5D Weather, Roguelike Perks, Potion Belt & Bounties
  const [difficulty, setDifficulty] = useState<DifficultyKey>('EASY');
  const [biomeKey, setBiomeKey] = useState<BiomeKey>('CYBER_NEON');
  const [sectorWeather, setSectorWeather] = useState<SectorWeatherKey>('CLEAR_AETHER');
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(false);
  const [enemiesEnabled, setEnemiesEnabled] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<DimensionalMode>('3d-chase');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [vfxBurst, setVfxBurst] = useState<VfxBurstPayload | null>(null);
  const [merchantOpen, setMerchantOpen] = useState<boolean>(false);
  const [transitOpen, setTransitOpen] = useState<boolean>(false);
  const [omniModalOpen, setOmniModalOpen] = useState<boolean>(false);
  const [autopilotActive, setAutopilotActive] = useState<boolean>(false);
  const [stargateThemeIdx, setStargateThemeIdx] = useState<number>(0);
  const [harmonyRecords, setHarmonyRecords] = useState<HarmonyRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Array.isArray(JSON.parse(saved).harmonyRecords)) {
        return JSON.parse(saved).harmonyRecords;
      }
    } catch {}
    return [];
  });
  const [totalBreathingSec, setTotalBreathingSec] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && typeof JSON.parse(saved).totalBreathingSec === 'number') {
        return JSON.parse(saved).totalBreathingSec;
      }
    } catch {}
    return 16;
  });
  const [potionBelt, setPotionBelt] = useState<Record<AlchemicalPotionId, number>>({
    'elixir-phoenix': 1,
    'ether-stargazer': 1,
    'oil-basilisk': 1,
  });

  const [activePerks, setActivePerks] = useState<string[]>([]);
  const [selectedPerkOnVictory, setSelectedPerkOnVictory] = useState<string | null>(null);
  const [bounties, setBounties] = useState<BountyContract[]>(INITIAL_BOUNTY_CONTRACTS);

  const [shellState, setShellState] = useState<ShellState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') return 'playing';
    }
    return 'title';
  });

  const [level, setLevel] = useState<number>(1);
  const [maze, setMaze] = useState<MazeData>(() => {
    const cfg = DIFFICULTIES.EASY;
    return generateMaze(cfg.rows, cfg.cols, cfg.starCount, cfg.enemyCount, 1);
  });

  const [playerPos, setPlayerPos] = useState<Position>({ r: 1, c: 1 });
  const [lastMoveDir, setLastMoveDir] = useState<{ dr: number; dc: number }>({ dr: 0, dc: 1 });
  const [starsRemaining, setStarsRemaining] = useState<Position[]>(() => maze.stars);
  const [chestsRemaining, setChestsRemaining] = useState<Position[]>(() => maze.chests);
  const [shrinesRemaining, setShrinesRemaining] = useState<Position[]>(() => maze.shrines);
  const [keyCollected, setKeyCollected] = useState<boolean>(false);
  const [phaseGatesOpen, setPhaseGatesOpen] = useState<boolean>(false);
  const [enemyFrozenTurns, setEnemyFrozenTurns] = useState<number>(0);
  const [quantumCharges, setQuantumCharges] = useState<number>(1);
  const [enemies, setEnemies] = useState<MazeEnemy[]>(() => maze.enemies);
  const [playerHp, setPlayerHp] = useState<number>(activeHero.hp);
  const [trailingHp, setTrailingHp] = useState<number>(activeHero.hp);
  const [starEnergy, setStarEnergy] = useState<number>(2);
  const [starsCollectedRun, setStarsCollectedRun] = useState<number>(0);
  const [enemiesDefeatedRun, setEnemiesDefeatedRun] = useState<number>(0);
  const [coinsEarnedRun, setCoinsEarnedRun] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [historyStack, setHistoryStack] = useState<ChronoSnapshot[]>([]);
  const [exploredTiles, setExploredTiles] = useState<Set<string>>(
    () => new Set(['0,0', '0,1', '0,2', '1,0', '1,1', '1,2', '2,0', '2,1', '2,2'])
  );

  const [actionLogMessage, setActionLogMessage] = useState<string>(
    '3D-Лабиринт: найдите ключ 🗝️, соберите ⭐ и сундуки 🎁, используйте порталы 🌀 и отворите врата 🏁!'
  );
  const [boardShake, setBoardShake] = useState<boolean>(false);

  const emitVfxBurst = useCallback((r: number, c: number, colorHex: number) => {
    setVfxBurst({
      id: Date.now() + Math.random(),
      r,
      c,
      colorHex,
    });
  }, []);

  const quantumPhaseOption = computeQuantumPhaseTarget(
    maze,
    playerPos,
    lastMoveDir,
    quantumCharges
  );

  // Modals
  const [studioOpen, setStudioOpen] = useState<boolean>(false);
  const [studioInitialTab, setStudioInitialTab] = useState<'builder' | 'gallery' | 'shop' | 'forge' | 'hall'>('builder');
  const [codexOpen, setCodexOpen] = useState<boolean>(false);
  const [activeArenaEnemy, setActiveArenaEnemy] = useState<MazeEnemy | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const runStartTimeRef = useRef<number>(Date.now());
  const spawnGraceUntilRef = useRef<number>(Date.now() + 3000);

  // Auto-check and award Multiverse Achievements
  useEffect(() => {
    const newUnlocked: string[] = [];
    if (savedHeroes.some((h) => h.wins >= 1) && !claimedAchievements.includes('ach-first-win')) {
      newUnlocked.push('ach-first-win');
    }
    if (highLevel >= 3 && !claimedAchievements.includes('ach-sector-3')) {
      newUnlocked.push('ach-sector-3');
    }
    if (unlockedSkins.length >= 6 && !claimedAchievements.includes('ach-skin-collector')) {
      newUnlocked.push('ach-skin-collector');
    }
    if (
      savedHeroes.some((h) => (h.upgradeLevel ?? 1) > 1 || Boolean(h.forgedRelicName)) &&
      !claimedAchievements.includes('ach-blacksmith')
    ) {
      newUnlocked.push('ach-blacksmith');
    }
    if (coins >= 150 && !claimedAchievements.includes('ach-wealthy')) {
      newUnlocked.push('ach-wealthy');
    }
    if (savedHeroes.length >= 4 && !claimedAchievements.includes('ach-squad-leader')) {
      newUnlocked.push('ach-squad-leader');
    }
    if (newUnlocked.length > 0) {
      const rewardSum = newUnlocked.reduce((sum, id) => {
        const meta = ACHIEVEMENTS_CATALOG.find((a) => a.id === id);
        return sum + (meta?.rewardCoins ?? 0);
      }, 0);
      setClaimedAchievements((prev) => Array.from(new Set([...prev, ...newUnlocked])));
      if (rewardSum > 0) {
        setCoins((c) => c + rewardSum);
      }
    }
  }, [savedHeroes, highLevel, unlockedSkins.length, coins, claimedAchievements]);

  // Persist save state
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          coins,
          highLevel,
          unlockedSkins,
          savedHeroes,
          activeHeroId,
          activeFamiliarId,
          bountiesCompletedCount,
          bestiaryKills,
          activeTarotId,
          activeGuildId,
          harmonyRecords,
          totalBreathingSec,
          claimedAchievements,
          talentRanks,
          gameMode,
          sectorAnomaly,
        })
      );
    } catch {}
  }, [
    coins,
    highLevel,
    unlockedSkins,
    savedHeroes,
    activeHeroId,
    activeFamiliarId,
    bountiesCompletedCount,
    bestiaryKills,
    activeTarotId,
    activeGuildId,
    harmonyRecords,
    totalBreathingSec,
    claimedAchievements,
    talentRanks,
    gameMode,
    sectorAnomaly,
  ]);

  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrailingHp(playerHp);
    }, 350);
    return () => clearTimeout(timer);
  }, [playerHp]);

  const revealFogAround = useCallback(
    (pos: Position) => {
      const radius = activeFamiliarId === 'owl' ? 2 : 1;
      setExploredTiles((prev) => {
        const next = new Set(prev);
        for (let dr = -radius; dr <= radius; dr++) {
          for (let dc = -radius; dc <= radius; dc++) {
            next.add(`${pos.r + dr},${pos.c + dc}`);
          }
        }
        return next;
      });
    },
    [activeFamiliarId]
  );

  const triggerShake = () => {
    setBoardShake(true);
    setTimeout(() => setBoardShake(false), 220);
  };

  // Infinite Royal Bounties: when completed, award gold, increment nobility counter, and issue next tier!
  const progressBounty = useCallback(
    (type: BountyContract['targetType'], amount: number = 1) => {
      setBounties((prev) =>
        prev.map((b) => {
          if (b.targetType !== type) return b;
          const nextProg = Math.min(b.targetCount, b.progress + amount);
          const nowDone = nextProg >= b.targetCount;
          if (nowDone) {
            setCoins((c) => c + b.rewardCoins);
            setCoinsEarnedRun((c) => c + b.rewardCoins);
            setBountiesCompletedCount((cnt) => cnt + 1);
            return generateNextTierBounty(b);
          }
          return {
            ...b,
            progress: nextProg,
          };
        })
      );
    },
    []
  );

  const startMazeRun = useCallback(
    (targetLevel: number = level, diffKey: DifficultyKey = difficulty) => {
      const cfg = DIFFICULTIES[diffKey];
      const nextMaze = generateMaze(
        cfg.rows,
        cfg.cols,
        cfg.starCount,
        enemiesEnabled ? cfg.enemyCount : 0,
        targetLevel
      );

      const biomeOrder: BiomeKey[] = [
        'CYBER_NEON',
        'MEDIEVAL_CITADEL',
        'SUNKEN_ATLANTIS',
        'SOLAR_SUPERNOVA',
      ];
      const weatherOrder: SectorWeatherKey[] = [
        'CLEAR_AETHER',
        'METEOR_EMBER',
        'CHRONO_MIST',
        'ASTRAL_STORM',
      ];
      if (targetLevel > 1) {
        setBiomeKey(BIOME_ORDER[(targetLevel - 1) % BIOME_ORDER.length]);
        setSectorWeather(weatherOrder[(targetLevel - 1) % weatherOrder.length]);
      }

      const bonusHpFromPerk = activePerks.includes('perk-titan-heart') ? 25 : 0;
      const startHp = activeHero.hp + bonusHpFromPerk + activeGuild.bonusHp;
      const startQuantum =
        (activeSynergy.passiveKey === 'PHASE_WALK' ? 2 : 1) + activeGuild.bonusStartQuantum;
      const anomalyCfg = SECTOR_ANOMALIES[sectorAnomaly] ?? SECTOR_ANOMALIES.STANDARD;

      setMaze(nextMaze);
      setPlayerPos({ r: 1, c: 1 });
      setLastMoveDir({ dr: 0, dc: 1 });
      setStarsRemaining(nextMaze.stars);
      setChestsRemaining(nextMaze.chests);
      setShrinesRemaining(nextMaze.shrines);
      setKeyCollected(false);
      setPhaseGatesOpen(activeTarot.autoOpenPhaseGates);
      setEnemyFrozenTurns(0);
      setMerchantOpen(false);
      setAutopilotActive(false);
      setQuantumCharges(startQuantum);
      setEnemies(nextMaze.enemies);
      setPlayerHp(startHp);
      setTrailingHp(startHp);
      setStarEnergy(Math.min(5, 2 + activeTarot.bonusStartMana + anomalyCfg.startEnergyBonus));
      setStarsCollectedRun(0);
      setEnemiesDefeatedRun(0);
      setCoinsEarnedRun(0);
      setStreakCount(0);
      setHistoryStack([]);
      setExploredTiles(new Set(['0,0', '0,1', '0,2', '1,0', '1,1', '1,2', '2,0', '2,1', '2,2']));
      setActiveArenaEnemy(null);
      setRunSummary(null);
      setSelectedPerkOnVictory(null);
      setActionLogMessage(
        `Сектор #${targetLevel} [${GAME_MODES[gameMode].icon} ${GAME_MODES[gameMode].titleRu} · ${activeGuild.emoji} ${activeGuild.titleRu}]: в путь!`
      );
      runStartTimeRef.current = Date.now();
      spawnGraceUntilRef.current = Date.now() + 3000;
      setShellState('playing');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [
      level,
      difficulty,
      enemiesEnabled,
      activeHero.hp,
      activePerks,
      activeSynergy.passiveKey,
      activeTarot,
      activeGuild,
      sectorWeather,
      sectorAnomaly,
      gameMode,
    ]
  );

  const handleChronoRewind = useCallback(() => {
    if (shellState !== 'playing' || historyStack.length === 0) return;
    const lastSnap = historyStack[historyStack.length - 1];
    const mistBonus = SECTOR_WEATHERS_CATALOG[sectorWeather].rewindHealBonus;
    setHistoryStack((prev) => prev.slice(0, -1));
    setPlayerPos(lastSnap.playerPos);
    setEnemies(lastSnap.enemies);
    setPlayerHp(Math.min(activeHero.hp + 45, lastSnap.playerHp + mistBonus));
    setStarEnergy(
      Math.min(5, lastSnap.starEnergy + (sectorWeather === 'CHRONO_MIST' ? 1 : 0))
    );
    soundFX.playSpell();
    triggerShake();
    emitVfxBurst(lastSnap.playerPos.r, lastSnap.playerPos.c, 0x22d3ee);
    spawnGraceUntilRef.current = Date.now() + 1800;
    setActionLogMessage(
      mistBonus > 0
        ? `⏳ 3.5D Хроно-Отмотка [Z] в Хроно-Тумане: время вспять (+${mistBonus} ОЗ, +1 ⚡)!`
        : '⏳ 3.5D Хроно-Отмотка [Z]: время обращено вспять по шлейфу фантома!'
    );
  }, [shellState, historyStack, sectorWeather, activeHero.hp, emitVfxBurst]);

  // Medieval Alchemist's Potion Belt [1] [2] [3] (Use or Brew on the fly!)
  const handleUseOrBrewPotion = useCallback(
    (potionId: AlchemicalPotionId) => {
      if (shellState !== 'playing' || activeArenaEnemy || studioOpen || codexOpen) return;
      const meta = ALCHEMICAL_POTIONS_CATALOG.find((p) => p.id === potionId)!;
      const charges = potionBelt[potionId] ?? 0;

      if (charges <= 0) {
        if (coins < meta.refillCost) {
          setActionLogMessage(
            `🧪 Нет зарядов «${meta.titleRu}»! Для алхимической варки нужно ${meta.refillCost} 🪙.`
          );
          return;
        }
        setCoins((c) => c - meta.refillCost);
        setPotionBelt((prev) => ({ ...prev, [potionId]: (prev[potionId] ?? 0) + 1 }));
        soundFX.playStarCollect();
        setActionLogMessage(
          `⚗️ Сварен эликсир «${meta.titleRu}» (+1 заряд за ${meta.refillCost} 🪙)! Нажмите [${meta.hotkey}] ещё раз для приёма.`
        );
        return;
      }

      setPotionBelt((prev) => ({ ...prev, [potionId]: Math.max(0, (prev[potionId] ?? 1) - 1) }));
      const mult = activeGuild.potionPowerMult;

      if (potionId === 'elixir-phoenix') {
        const healAmt = Math.round(45 * mult);
        soundFX.playHeal();
        emitVfxBurst(playerPos.r, playerPos.c, 0x10b981);
        setPlayerHp((hp) => Math.min(activeHero.hp + 45, hp + healAmt));
        setActionLogMessage(`🧪 Выпит Эликсир Феникса [1]: мгновенно восстановлено +${healAmt} ОЗ!`);
      } else if (potionId === 'ether-stargazer') {
        const manaGain = Math.round(3 * mult);
        soundFX.playSpell();
        emitVfxBurst(playerPos.r, playerPos.c, 0x38bdf8);
        setStarEnergy((e) => Math.min(5, e + manaGain));
        setQuantumCharges((q) => q + 1);
        setActionLogMessage(
          `⚗️ Выпит Эфир Звездочёта [2]: +${manaGain} ⚡ маны и +1 заряд Квантового Сдвига [Q]!`
        );
      } else if (potionId === 'oil-basilisk') {
        const freezeTurns = Math.round(4 * mult);
        soundFX.playSpell();
        triggerShake();
        emitVfxBurst(playerPos.r, playerPos.c, 0xa855f7);
        setEnemyFrozenTurns(freezeTurns);
        setPhaseGatesOpen(true);
        setActionLogMessage(
          `🏺 Масло Василиска [3]: стражи обращены в камень на ${freezeTurns} такта ❄️, а 4D-Заслонки 🟪 открыты!`
        );
      }
    },
    [
      shellState,
      activeArenaEnemy,
      studioOpen,
      codexOpen,
      potionBelt,
      coins,
      activeGuild.potionPowerMult,
      playerPos,
      activeHero.hp,
      emitVfxBurst,
    ]
  );

  const handleCompleteLevel = useCallback(
    (finalStarsCollected: number, totalStarsCount: number, currentCoinsEarned: number) => {
      soundFX.playVictory();
      const elapsedSec = Math.max(1, Math.round((Date.now() - runStartTimeRef.current) / 1000));
      const mastery = computeRunMasteryGrade(
        finalStarsCollected,
        totalStarsCount,
        elapsedSec,
        enemiesDefeatedRun,
        true
      );
      const midasMultiplier = activePerks.includes('perk-midas-touch') ? 1.6 : 1.0;
      const allStarsBonus = Math.round(
        ((finalStarsCollected >= totalStarsCount ? 30 : 15) + mastery.bonusCoins) *
          midasMultiplier *
          royalGoldMultiplier
      );
      const totalRunCoins = currentCoinsEarned + allStarsBonus;
      const nextLevel = level + 1;

      setCoins((c) => c + allStarsBonus);
      setHighLevel((h) => Math.max(h, nextLevel));
      setLevel(nextLevel);
      setSavedHeroes((prev) =>
        prev.map((h) => (h.id === activeHero.id ? { ...h, mazesCleared: h.mazesCleared + 1 } : h))
      );

      setRunSummary({
        victory: true,
        levelCleared: level,
        starsCollected: finalStarsCollected,
        totalStars: totalStarsCount,
        enemiesDefeated: enemiesDefeatedRun,
        coinsEarned: totalRunCoins,
        clearTimeSec: elapsedSec,
      });
      setShellState('gameover');
    },
    [level, enemiesDefeatedRun, activeHero.id, activePerks, royalGoldMultiplier]
  );

  const movePlayer = useCallback(
    (dr: number, dc: number, allowPhaseThroughWall: boolean = false) => {
      if (
        shellState !== 'playing' ||
        activeArenaEnemy !== null ||
        studioOpen ||
        codexOpen
      ) {
        return;
      }

      setLastMoveDir({ dr, dc });
      let nr = playerPos.r + dr;
      let nc = playerPos.c + dc;

      const blockedByPhaseGate =
        !phaseGatesOpen && maze.phaseGates.some((g) => g.r === nr && g.c === nc);

      if (!isWalkableTile(maze, nr, nc, phaseGatesOpen)) {
        const qHit = allowPhaseThroughWall
          ? computeQuantumPhaseTarget(maze, playerPos, { dr, dc }, quantumCharges)
          : null;
        if (qHit) {
          nr = qHit.target.r;
          nc = qHit.target.c;
          setLastMoveDir(qHit.dir);
          setQuantumCharges((q) => Math.max(0, q - 1));
          soundFX.playSpell();
          triggerShake();
          emitVfxBurst(nr, nc, 0xe879f9);
          setActionLogMessage('📐 3.5D Квантовый Фазовый Прыжок сквозь стену лабиринта!');
        } else {
          setStreakCount(0);
          setActionLogMessage(
            blockedByPhaseGate
              ? '🟪 4D-Фазовая Заслонка закрыта! Нажмите Рычаг Архитектора 🎚️ или пульс [E].'
              : '3D-стена лабиринта! Выберите проход или используйте [Q] Квантовый Сдвиг.'
          );
          return;
        }
      } else if (allowPhaseThroughWall && quantumCharges > 0) {
        // Even if facing an open tile, if player pressed [Q] and an adjacent wall has a quantum portal, jump through it!
        const qHit = computeQuantumPhaseTarget(maze, playerPos, { dr, dc }, quantumCharges);
        if (qHit) {
          nr = qHit.target.r;
          nc = qHit.target.c;
          setLastMoveDir(qHit.dir);
          setQuantumCharges((q) => Math.max(0, q - 1));
          soundFX.playSpell();
          triggerShake();
          emitVfxBurst(nr, nc, 0xe879f9);
          setActionLogMessage('📐 3.5D Квантовый Фазовый Прыжок в портал сквозь стену!');
        }
      }

      // Push snapshot into Chrono-Rewind ring buffer (max 5 turns)
      setHistoryStack((prev) => [
        ...prev.slice(-4),
        {
          playerPos: { ...playerPos },
          enemies: enemies.map((e) => ({ ...e, patrolDir: { ...e.patrolDir } })),
          playerHp,
          starEnergy,
        },
      ]);

      soundFX.playStep();
      let finalPos = { r: nr, c: nc };
      const nextStreak = streakCount + 1;
      setStreakCount(nextStreak);

      // 0. Check Quantum Portal Teleportation 🌀 (A <-> B)
      if (maze.portals) {
        const hitA = nr === maze.portals.a.r && nc === maze.portals.a.c;
        const hitB = nr === maze.portals.b.r && nc === maze.portals.b.c;
        if (hitA || hitB) {
          finalPos = hitA ? { ...maze.portals.b } : { ...maze.portals.a };
          soundFX.playSpell();
          triggerShake();
          progressBounty('SHRINE_OR_PORTAL', 1);
          if (activePerks.includes('perk-shadow-cloak')) {
            setPlayerHp((hp) => Math.min(activeHero.hp + 25, hp + 15));
            setStarEnergy((e) => Math.min(5, e + 2));
          }
          setActionLogMessage(
            `🌀 Квантовый Телепорт! Вы мгновенно переместились в точку (${finalPos.r}, ${finalPos.c})!`
          );
        }
      }

      setPlayerPos(finalPos);
      revealFogAround(finalPos);
      const curR = finalPos.r;
      const curC = finalPos.c;

      const streakMult = Math.min(2.5, 1 + Math.floor(nextStreak / 3) * 0.25);
      // 4.5D Astral Storm passive: every 3 steps grants +1 ⚡ mana
      if (sectorWeather === 'ASTRAL_STORM' && nextStreak % 3 === 0) {
        setStarEnergy((e) => Math.min(5, e + 1));
      }
      const familiarBonusCoin = activeFamiliar.id === 'dragonling' ? 4 : 0;
      const weatherStarBonus = sectorWeather === 'METEOR_EMBER' ? 4 : 0;
      const goldMultiplier =
        (activeSynergy.passiveKey === 'DOUBLE_STAR_GOLD' ? 2 : 1) *
        (activePerks.includes('perk-midas-touch') ? 1.6 : 1) *
        royalGoldMultiplier *
        streakMult;

      // 0b. Check Architect's Lever 🎚️ (toggles 4.0D Phase Gates 🟪)
      if (maze.leverPos && curR === maze.leverPos.r && curC === maze.leverPos.c) {
        soundFX.playSpell();
        triggerShake();
        emitVfxBurst(curR, curC, 0xa855f7);
        progressBounty('SHRINE_OR_PORTAL', 1);
        setPhaseGatesOpen((prev) => {
          const next = !prev;
          setActionLogMessage(
            next
              ? '🎚️ Рычаг Архитектора активирован! 4D-Фазовые Заслонки 🟪 ушли в пол — короткие пути открыты!'
              : '🎚️ Рычаг Архитектора переключён! 4D-Фазовые Заслонки 🟪 снова поднялись!'
          );
          return next;
        });
      }

      // 0c. Check Wandering Caravan Merchant 🐪
      if (maze.merchantPos && curR === maze.merchantPos.r && curC === maze.merchantPos.c) {
        soundFX.playStarCollect();
        emitVfxBurst(curR, curC, 0xfbbf24);
        setMerchantOpen(true);
        setActionLogMessage(
          '🐪 Караван Алхимика Аль-Кеми: обменяйте монеты 🪙 на ключ 🗝️, эликсиры 🧪 или закалку клинка!'
        );
      }

      // 1. Check Golden Key 🗝️ collection
      let hasKeyNow = keyCollected;
      if (!keyCollected && maze.keyPos && curR === maze.keyPos.r && curC === maze.keyPos.c) {
        hasKeyNow = true;
        setKeyCollected(true);
        soundFX.playStarCollect();
        triggerShake();
        emitVfxBurst(curR, curC, 0xfde047);
        progressBounty('SHRINE_OR_PORTAL', 1);
        setActionLogMessage('🗝️ Найден Золотой Ключ Цитадели! Решётка 3D-врат выхода 🏁 открыта!');
      }

      // 2. Check Star ⭐ collection
      const hitStarIndex = starsRemaining.findIndex((s) => s.r === curR && s.c === curC);
      let updatedStarsCollected = starsCollectedRun;
      let updatedCoinsEarned = coinsEarnedRun;

      if (hitStarIndex !== -1) {
        soundFX.playStarCollect();
        const nextStars = starsRemaining.filter((_, idx) => idx !== hitStarIndex);
        setStarsRemaining(nextStars);
        updatedStarsCollected += 1;
        const starGold = Math.round(5 * goldMultiplier) + familiarBonusCoin + weatherStarBonus;
        updatedCoinsEarned += starGold;
        setStarsCollectedRun(updatedStarsCollected);
        setCoinsEarnedRun(updatedCoinsEarned);
        setCoins((c) => c + starGold);
        setStarEnergy((e) => Math.min(5, e + 1));
        const starHealExtra = activeTarot.id === 'the-star' ? 14 : 0;
        setPlayerHp((hp) => Math.min(activeHero.hp + 45, hp + 8 + starHealExtra));
        if (activeTarot.id === 'the-star') {
          setQuantumCharges((q) => q + 1);
        }
        triggerShake();
        emitVfxBurst(curR, curC, 0xfbbf24);
        progressBounty('STARS', 1);
        setActionLogMessage(
          `Собрана 3D-звезда ⭐ (+${starGold} 🪙 [Стрик ×${streakMult.toFixed(2)}], +1 ⚡)! Звёзд: ${updatedStarsCollected}/${maze.stars.length}`
        );
      }

      // 3. Check Treasure Chest 🎁 (or Medieval Mimic Surprise!)
      const hitChestIndex = chestsRemaining.findIndex((c) => c.r === curR && c.c === curC);
      if (hitChestIndex !== -1) {
        const nextChests = chestsRemaining.filter((_, idx) => idx !== hitChestIndex);
        setChestsRemaining(nextChests);
        triggerShake();
        emitVfxBurst(curR, curC, 0xf59e0b);

        if (hitChestIndex === 1 && enemiesEnabled) {
          soundFX.playHurt();
          const mimicEnemy: MazeEnemy = {
            id: `mimic-${Date.now()}`,
            r: curR,
            c: curC,
            emoji: '🎁',
            name: '🎁 Зубастый Сундук-Мимик',
            policy: 'GUARDIAN',
            elementWeakness: 'Cosmic',
            patrolDir: { dr: 0, dc: 1 },
            maxHp: 115 + level * 10,
            hp: 115 + level * 10,
            attack: 22 + level * 2,
            defense: 12,
            rewardCoins: 45,
            telegraphing: true,
            isMimic: true,
            affix: 'VAMPIRIC',
          };
          setActiveArenaEnemy(mimicEnemy);
          setActionLogMessage('🎁 Засада! Сундук оказался Зубастым Мимиком — вступайте в бой за 45 🪙!');
          return;
        }

        soundFX.playStarCollect();
        const chestGold = Math.round(15 * goldMultiplier);
        updatedCoinsEarned += chestGold;
        setCoinsEarnedRun(updatedCoinsEarned);
        setCoins((c) => c + chestGold);
        setStarEnergy((e) => Math.min(5, e + 2));
        setPlayerHp((hp) => Math.min(activeHero.hp + 25, hp + 15));
        setActionLogMessage(`Открыт 3D-сундук сокровищ 🎁 (+${chestGold} 🪙, +2 ⚡ магии, +15 ОЗ)!`);
      }

      // 4. Check Ancient Blessing Shrine ⛩️
      const hitShrineIdx = shrinesRemaining.findIndex((sh) => sh.r === curR && sh.c === curC);
      if (hitShrineIdx !== -1) {
        soundFX.playHeal();
        setShrinesRemaining(shrinesRemaining.filter((_, idx) => idx !== hitShrineIdx));
        setPlayerHp((hp) => Math.min(activeHero.hp + 25, hp + 30));
        setStarEnergy(5);
        setQuantumCharges((q) => q + 1);
        emitVfxBurst(curR, curC, 0x10b981);
        progressBounty('SHRINE_OR_PORTAL', 1);
        setActionLogMessage(
          '⛩️ Благословение Древнего Алтаря: +30 ОЗ, полная мана (5/5 ⚡) и +1 Квантовый Сдвиг!'
        );
      }

      // 5. Check Mechanical Floor Spike Traps ⚙️
      const hitTrap = maze.traps.some((t) => t.r === curR && t.c === curC);
      if (hitTrap) {
        emitVfxBurst(curR, curC, 0xf43f5e);
        if (activePerks.includes('perk-trap-immunity')) {
          setStarEnergy((e) => Math.min(5, e + 1));
          setActionLogMessage('🥾 Крылатые Сапоги защитили от шипов ⚙️ (+1 ⚡ маны)!');
        } else {
          soundFX.playHurt();
          triggerShake();
          setStreakCount(0);
          const trapDmg = activeSynergy.passiveKey === 'HOLY_AEGIS' ? 5 : 8;
          setPlayerHp((hp) => Math.max(10, hp - trapDmg));
          setActionLogMessage(`⚙️ Осторожно! Напольные шипы Цитадели ранили героя (-${trapDmg} ОЗ)!`);
        }
      }

      // 6. Check Enemy collision -> launch RPG Arena Duel!
      const hitEnemy = enemies.find((e) => e.r === curR && e.c === curC);
      if (hitEnemy) {
        setActiveArenaEnemy(hitEnemy);
        setActionLogMessage(`Встреча с 3D-стражем ${hitEnemy.name}! Начинается RPG-дуэль!`);
        return;
      }

      // 7. Check Exit portal 🏁 (Unlocked if keyCollected or no key required)
      if (curR === maze.exit.r && curC === maze.exit.c) {
        if (!hasKeyNow && maze.keyPos) {
          setActionLogMessage(
            '🔒 3D-Врата заперты решёткой! Сначала подберите Золотой Ключ 🗝️ (жёлтая дорожка на полу)!'
          );
          return;
        }
        handleCompleteLevel(updatedStarsCollected, maze.stars.length, updatedCoinsEarned);
      }
    },
    [
      shellState,
      activeArenaEnemy,
      studioOpen,
      codexOpen,
      playerPos,
      maze,
      phaseGatesOpen,
      quantumCharges,
      enemies,
      playerHp,
      starEnergy,
      streakCount,
      activeFamiliar.id,
      royalGoldMultiplier,
      keyCollected,
      starsRemaining,
      chestsRemaining,
      shrinesRemaining,
      starsCollectedRun,
      coinsEarnedRun,
      enemiesEnabled,
      level,
      activeHero.hp,
      activeSynergy.passiveKey,
      activePerks,
      activeTarot,
      revealFogAround,
      progressBounty,
      handleCompleteLevel,
      emitVfxBurst,
    ]
  );

  // Field Spell [E]: 1.5D Corridor Resonance Shockwave (1 ⚡ Mana)
  const handleCorridorShockwave = useCallback(() => {
    if (shellState !== 'playing' || activeArenaEnemy || studioOpen || codexOpen) return;
    if (starEnergy < 1) {
      setActionLogMessage('⚡ Недостаточно маны для 1.5D Волнового Импульса [E] (нужна 1 ⚡)!');
      return;
    }

    const { dir: waveDir, rayTiles } = castCorridorShockwave(
      maze,
      playerPos,
      lastMoveDir,
      phaseGatesOpen
    );
    if (rayTiles.length === 0) {
      setActionLogMessage('⚡ Перед вами монолитная стена — повернитесь вдоль коридора для импульса [E]!');
      return;
    }

    setLastMoveDir(waveDir);
    setStarEnergy((e) => Math.max(0, e - 1));
    soundFX.playSpell();
    triggerShake();
    const tailTile = rayTiles[rayTiles.length - 1];
    emitVfxBurst(tailTile.r, tailTile.c, 0x38bdf8);

    const events: string[] = [];

    // 1. Collect stars along the 1.5D corridor ray
    const hitStars = starsRemaining.filter((s) =>
      rayTiles.some((rt) => rt.r === s.r && rt.c === s.c)
    );
    if (hitStars.length > 0) {
      const gainedGold = Math.round(hitStars.length * 6 * royalGoldMultiplier);
      setStarsRemaining((prev) =>
        prev.filter((s) => !rayTiles.some((rt) => rt.r === s.r && rt.c === s.c))
      );
      setStarsCollectedRun((c) => c + hitStars.length);
      setCoins((c) => c + gainedGold);
      setCoinsEarnedRun((c) => c + gainedGold);
      progressBounty('STARS', hitStars.length);
      events.push(`притянуто ⭐×${hitStars.length}`);
    }

    // 2. Collect Golden Key 🗝️ remotely if on ray
    if (
      !keyCollected &&
      maze.keyPos &&
      rayTiles.some((rt) => rt.r === maze.keyPos!.r && rt.c === maze.keyPos!.c)
    ) {
      setKeyCollected(true);
      events.push('захвачен 🗝️ Ключ');
    }

    // 3. Toggle Architect's Lever 🎚️ remotely if on ray
    if (
      maze.leverPos &&
      rayTiles.some((rt) => rt.r === maze.leverPos!.r && rt.c === maze.leverPos!.c)
    ) {
      setPhaseGatesOpen((prev) => !prev);
      events.push('переключён 🎚️ Рычаг 4D-Заслонок');
    }

    // 4. Resonance damage to enemies along the ray (-25% or -45% with Tower Tarot)
    const dmgRatio = activeTarot.id === 'the-tower' ? 0.42 : 0.25;
    let hitEnemyCount = 0;
    setEnemies((prev) =>
      prev.map((en) => {
        if (rayTiles.some((rt) => rt.r === en.r && rt.c === en.c)) {
          hitEnemyCount++;
          const nextHp = Math.max(12, Math.round(en.hp * (1 - dmgRatio)));
          return { ...en, hp: nextHp, trapDamaged: true };
        }
        return en;
      })
    );
    if (hitEnemyCount > 0) {
      events.push(`ослаблено стражей: ${hitEnemyCount}`);
    }

    setActionLogMessage(
      `🌊 1.5D Волновой Импульс [E] прошил ${rayTiles.length} кл. коридора${
        events.length > 0 ? ` (${events.join(', ')})` : ''
      }!`
    );
  }, [
    shellState,
    activeArenaEnemy,
    studioOpen,
    codexOpen,
    starEnergy,
    maze,
    playerPos,
    lastMoveDir,
    phaseGatesOpen,
    starsRemaining,
    keyCollected,
    royalGoldMultiplier,
    activeTarot.id,
    emitVfxBurst,
    progressBounty,
  ]);

  // Field Spell [F]: Medieval Scroll of Petrification & Star Magnet (2 ⚡ Mana)
  const handleCastPetrifyScroll = useCallback(() => {
    if (shellState !== 'playing' || activeArenaEnemy || studioOpen || codexOpen) return;
    if (starEnergy < 2) {
      setActionLogMessage('🗿 Для Свитка Окаменения [F] требуется 2 ⚡ маны!');
      return;
    }

    setStarEnergy((e) => Math.max(0, e - 2));
    setEnemyFrozenTurns(3);
    soundFX.playSpell();
    triggerShake();
    emitVfxBurst(playerPos.r, playerPos.c, 0x22d3ee);

    // Also pull nearest Star within Manhattan distance <= 3
    const nearStarIdx = starsRemaining.findIndex(
      (s) => Math.abs(s.r - playerPos.r) + Math.abs(s.c - playerPos.c) <= 3
    );
    if (nearStarIdx !== -1) {
      setStarsRemaining((prev) => prev.filter((_, idx) => idx !== nearStarIdx));
      setStarsCollectedRun((c) => c + 1);
      const starGold = Math.round(6 * royalGoldMultiplier);
      setCoins((c) => c + starGold);
      setCoinsEarnedRun((c) => c + starGold);
      progressBounty('STARS', 1);
      setActionLogMessage(
        `🗿 Свиток Окаменения [F]: стражи заморожены на 3 такта ❄️ + притянута ближайшая звезда ⭐ (+${starGold} 🪙)!`
      );
    } else {
      setActionLogMessage(
        '🗿 Свиток Окаменения [F]: все стражи лабиринта обращены в крио-камень на 3 такта ❄️!'
      );
    }
  }, [
    shellState,
    activeArenaEnemy,
    studioOpen,
    codexOpen,
    starEnergy,
    playerPos,
    starsRemaining,
    royalGoldMultiplier,
    emitVfxBurst,
    progressBounty,
  ]);

  // Enemy autonomous patrolling loop + Faction Infighting + Tactical Trap Luring in 3D Maze
  useEffect(() => {
    if (
      shellState !== 'playing' ||
      !enemiesEnabled ||
      activeArenaEnemy !== null ||
      studioOpen ||
      codexOpen ||
      merchantOpen ||
      transitOpen
    ) {
      return;
    }

    const weatherMult = SECTOR_WEATHERS_CATALOG[sectorWeather].enemySpeedMultiplier;
    const intervalMs = Math.round(Math.max(460, 820 - level * 25) * weatherMult);
    const timer = setInterval(() => {
      if (Date.now() < spawnGraceUntilRef.current) return;

      if (enemyFrozenTurns > 0) {
        setEnemyFrozenTurns((t) => Math.max(0, t - 1));
        return;
      }

      setEnemies((prevEnemies) => {
        if (prevEnemies.length === 0) return prevEnemies;
        const nextEnemies = stepEnemies(maze, prevEnemies, playerPos);
        const clashedPair = nextEnemies.find((e) => e.clashed);
        const trappedEnemy = nextEnemies.find((e) => e.trapDamaged);
        if (trappedEnemy) {
          setActionLogMessage(
            `⚙️ Тактическая Ловушка! Страж ${trappedEnemy.name} наступил на шипы Цитадели и потерял 20% ОЗ!`
          );
        } else if (clashedPair) {
          setActionLogMessage(
            `⚔️ Междоусобица Стражей! Два монстра столкнулись в коридоре и ослабили друг друга (-18% ОЗ)!`
          );
        }
        const collided = nextEnemies.find((e) => e.r === playerPos.r && e.c === playerPos.c);
        if (collided) {
          setActiveArenaEnemy(collided);
          setActionLogMessage(`Страж ${collided.name} перехватил вас в 3D-коридоре!`);
        }
        return nextEnemies;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    shellState,
    enemiesEnabled,
    activeArenaEnemy,
    studioOpen,
    codexOpen,
    merchantOpen,
    level,
    maze,
    playerPos,
    enemyFrozenTurns,
    sectorWeather,
  ]);

  // Wall-Breaker Bomb [B] (costs 1 ⚡ mana, destroys up to 4 adjacent inner walls)
  const handleWallBreakerBomb = useCallback(() => {
    if (shellState !== 'playing' || activeArenaEnemy || studioOpen || codexOpen) return;
    if (starEnergy < 1) {
      setActionLogMessage('Для подрыва стен Бомбой [B] нужен минимум 1 заряд ⚡ маны!');
      return;
    }
    const { nextMaze, destroyedCount } = destroyAdjacentWalls(maze, playerPos);
    if (destroyedCount === 0) {
      setActionLogMessage('Вокруг героя нет внутренних стен для разрушения Бомбой [B]!');
      return;
    }
    setMaze(nextMaze);
    setStarEnergy((e) => Math.max(0, e - 1));
    soundFX.playAttack(true);
    triggerShake();
    emitVfxBurst(playerPos.r, playerPos.c, 0xf97316);
    setActionLogMessage(`💣 Взрывная Бомба [B]! Разрушено стен вокруг героя: ${destroyedCount}!`);
  }, [shellState, activeArenaEnemy, studioOpen, codexOpen, starEnergy, maze, playerPos, emitVfxBurst]);

  // Single BFS Auto-Guidance Step [N]
  const handleAutoGuidanceStep = useCallback(() => {
    if (shellState !== 'playing' || activeArenaEnemy || studioOpen || codexOpen) return;
    const targetGoal =
      !keyCollected && maze.keyPos
        ? maze.keyPos
        : starsRemaining.length > 0
        ? starsRemaining.reduce((best, curr) => {
            const bDist = Math.abs(best.r - playerPos.r) + Math.abs(best.c - playerPos.c);
            const cDist = Math.abs(curr.r - playerPos.r) + Math.abs(curr.c - playerPos.c);
            return cDist < bDist ? curr : best;
          }, starsRemaining[0])
        : maze.exit;

    const path = findShortestPath(maze, playerPos, targetGoal, phaseGatesOpen);
    if (path.length > 0) {
      const nextStep = path[0];
      movePlayer(nextStep.r - playerPos.r, nextStep.c - playerPos.c, false);
    } else if (!phaseGatesOpen && maze.leverPos) {
      const leverPath = findShortestPath(maze, playerPos, maze.leverPos, false);
      if (leverPath.length > 0) {
        const nextStep = leverPath[0];
        movePlayer(nextStep.r - playerPos.r, nextStep.c - playerPos.c, false);
      }
    }
  }, [
    shellState,
    activeArenaEnemy,
    studioOpen,
    codexOpen,
    keyCollected,
    maze,
    starsRemaining,
    playerPos,
    phaseGatesOpen,
    movePlayer,
  ]);

  // Full AI Autopilot [I] loop
  useEffect(() => {
    if (!autopilotActive || shellState !== 'playing' || activeArenaEnemy || studioOpen || codexOpen) {
      return;
    }
    const timer = setInterval(() => {
      handleAutoGuidanceStep();
    }, 260);
    return () => clearInterval(timer);
  }, [autopilotActive, shellState, activeArenaEnemy, studioOpen, codexOpen, handleAutoGuidanceStep]);

  // Global keyboard controls (WASD / Arrows / Q / Z / E / F / B / N / I / G / 1 / 2 / 3 / Enter / Space / P / R / M / H / C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (omniModalOpen) {
          setOmniModalOpen(false);
          return;
        }
        if (transitOpen) {
          setTransitOpen(false);
          return;
        }
        if (merchantOpen) {
          setMerchantOpen(false);
          return;
        }
        if (studioOpen) {
          setStudioOpen(false);
          return;
        }
        if (codexOpen) {
          setCodexOpen(false);
          return;
        }
        if (shellState === 'playing' && !activeArenaEnemy) {
          setShellState('paused');
        } else if (shellState === 'paused') {
          setShellState('playing');
        }
        return;
      }

      if (shellState === 'title') {
        if ((e.key === 'Enter' || e.key === ' ') && !studioOpen && !codexOpen && !omniModalOpen) {
          e.preventDefault();
          startMazeRun(level, difficulty);
        }
        return;
      }

      if (e.key === '1' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleUseOrBrewPotion('elixir-phoenix');
        return;
      }
      if (e.key === '2' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleUseOrBrewPotion('ether-stargazer');
        return;
      }
      if (e.key === '3' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleUseOrBrewPotion('oil-basilisk');
        return;
      }

      if (e.key.toLowerCase() === 'q' && shellState === 'playing' && !studioOpen && !codexOpen) {
        e.preventDefault();
        movePlayer(lastMoveDir.dr, lastMoveDir.dc, true);
        return;
      }

      if (e.key.toLowerCase() === 'z' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleChronoRewind();
        return;
      }

      if (e.key.toLowerCase() === 'e' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleCorridorShockwave();
        return;
      }

      if (e.key.toLowerCase() === 'f' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleCastPetrifyScroll();
        return;
      }

      if (e.key.toLowerCase() === 'b' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleWallBreakerBomb();
        return;
      }

      if (e.key.toLowerCase() === 'n' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        handleAutoGuidanceStep();
        return;
      }

      if (e.key.toLowerCase() === 'i' && shellState === 'playing' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        setAutopilotActive((prev) => {
          const next = !prev;
          setActionLogMessage(
            next
              ? '🤖 ИИ-Автопилот [I] ВКЛЮЧЁН: герой сам идёт по графу BFS к ключу, звёздам и выходу!'
              : '🤖 ИИ-Автопилот [I] остановлен.'
          );
          return next;
        });
        return;
      }

      if (e.key.toLowerCase() === 'g' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        setTransitOpen((prev) => !prev);
        return;
      }

      if (e.key.toLowerCase() === 'h' && shellState === 'playing' && !studioOpen && !codexOpen) {
        e.preventDefault();
        setDockCollapsed((c) => !c);
        return;
      }

      if (e.key.toLowerCase() === 'c' && shellState === 'playing' && !studioOpen && !codexOpen) {
        e.preventDefault();
        const modeOrder: DimensionalMode[] = [
          '1.5d-wave',
          '2.5d-diorama',
          '3d-chase',
          '3.5d-quantum',
          'first-person',
          '2d-classic',
        ];
        setViewMode((v) => {
          const next = modeOrder[(modeOrder.indexOf(v) + 1) % modeOrder.length];
          setActionLogMessage(
            `${DIMENSIONAL_MODE_META[next].labelRu}: ${DIMENSIONAL_MODE_META[next].descRu}`
          );
          return next;
        });
        return;
      }

      if (e.key.toLowerCase() === 'p' && !studioOpen && !codexOpen && !activeArenaEnemy) {
        e.preventDefault();
        setShellState((s) => (s === 'playing' ? 'paused' : s === 'paused' ? 'playing' : s));
        return;
      }

      if (e.key.toLowerCase() === 'm' && !studioOpen && !codexOpen) {
        e.preventDefault();
        setMuted((m) => {
          const next = !m;
          soundFX.muted = next;
          return next;
        });
        return;
      }

      if (e.key.toLowerCase() === 'r' && shellState === 'playing' && !activeArenaEnemy && !studioOpen) {
        e.preventDefault();
        startMazeRun(level, difficulty);
        return;
      }

      if (shellState === 'playing' && !activeArenaEnemy && !studioOpen && !codexOpen) {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') {
          e.preventDefault();
          movePlayer(-1, 0);
        } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
          e.preventDefault();
          movePlayer(1, 0);
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
          e.preventDefault();
          movePlayer(0, -1);
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
          e.preventDefault();
          movePlayer(0, 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    shellState,
    studioOpen,
    codexOpen,
    omniModalOpen,
    transitOpen,
    activeArenaEnemy,
    level,
    difficulty,
    lastMoveDir,
    startMazeRun,
    movePlayer,
    handleChronoRewind,
    handleCorridorShockwave,
    handleCastPetrifyScroll,
    handleUseOrBrewPotion,
    handleWallBreakerBomb,
    handleAutoGuidanceStep,
    merchantOpen,
  ]);

  const handleBattleResolved = (outcome: {
    won: boolean;
    remainingHp: number;
    remainingStarEnergy: number;
    rewardCoins: number;
    enemyId: string;
  }) => {
    const defeatedEmoji = activeArenaEnemy?.emoji;
    setActiveArenaEnemy(null);
    setStarEnergy(outcome.remainingStarEnergy);
    if (outcome.won) {
      if (defeatedEmoji) {
        setBestiaryKills((prev) => ({
          ...prev,
          [defeatedEmoji]: (prev[defeatedEmoji] ?? 0) + 1,
        }));
      }
      const midasBoost = activePerks.includes('perk-midas-touch') ? 1.6 : 1.0;
      const finalReward = Math.round(outcome.rewardCoins * midasBoost * tarotGoldMult);
      setPlayerHp(outcome.remainingHp);
      setCoins((c) => c + finalReward);
      setCoinsEarnedRun((c) => c + finalReward);
      setEnemiesDefeatedRun((d) => d + 1);
      setEnemies((prev) => prev.filter((e) => e.id !== outcome.enemyId));
      setSavedHeroes((prev) =>
        prev.map((h) => (h.id === activeHero.id ? { ...h, wins: h.wins + 1 } : h))
      );
      progressBounty('ENEMIES', 1);
      setActionLogMessage(
        `Победа на RPG-Арене! +${finalReward} 🪙 (+Трофей Бестиария 📖). 3D-проход свободен!`
      );
      spawnGraceUntilRef.current = Date.now() + 1800;
    } else {
      const elapsedSec = Math.max(1, Math.round((Date.now() - runStartTimeRef.current) / 1000));
      setPlayerHp(0);
      setRunSummary({
        victory: false,
        levelCleared: level,
        starsCollected: starsCollectedRun,
        totalStars: maze.stars.length,
        enemiesDefeated: enemiesDefeatedRun,
        coinsEarned: coinsEarnedRun,
        clearTimeSec: elapsedSec,
      });
      setShellState('gameover');
    }
  };

  const handleArenaRetreat = (remainingHp: number, remainingStarEnergy: number) => {
    setActiveArenaEnemy(null);
    setPlayerHp(remainingHp);
    setStarEnergy(remainingStarEnergy);
    setPlayerPos({ r: 1, c: 1 });
    spawnGraceUntilRef.current = Date.now() + 2000;
    setActionLogMessage('Вы отступили на стартовую платформу (1,1)!');
  };

  const handleChallengeArenaBoss = () => {
    if (enemies.length > 0) {
      setActiveArenaEnemy(enemies[0]);
      return;
    }
    const template = BOSS_ROSTER[level % BOSS_ROSTER.length];
    const scale = 1 + (level - 1) * 0.1;
    setActiveArenaEnemy({
      id: `arena-boss-${Date.now()}`,
      r: playerPos.r,
      c: playerPos.c,
      emoji: template.emoji,
      name: template.name,
      policy: template.policy,
      elementWeakness: template.weakness,
      patrolDir: { dr: 0, dc: 1 },
      maxHp: Math.round(template.hp * scale),
      hp: Math.round(template.hp * scale),
      attack: Math.round(template.atk * scale),
      defense: Math.round(template.def * scale),
      rewardCoins: template.reward + level * 5,
      telegraphing: false,
    });
  };

  const handleSelectHero = (hero: HeroAvatar) => {
    setActiveHeroId(hero.id);
    setPlayerHp(hero.hp);
    setTrailingHp(hero.hp);
  };

  const handleSaveNewHero = (newHero: HeroAvatar) => {
    setSavedHeroes((prev) => [newHero, ...prev]);
    setActiveHeroId(newHero.id);
    setPlayerHp(newHero.hp);
    setTrailingHp(newHero.hp);
  };

  const handleDeleteHero = (id: string) => {
    setSavedHeroes((prev) => {
      const filtered = prev.filter((h) => h.id !== id);
      if (activeHeroId === id && filtered.length > 0) {
        setActiveHeroId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handlePurchaseOrEquipSkin = (skin: ShopSkin) => {
    const res = purchaseSkinTransaction(coins, unlockedSkins, skin);
    if (res.success) {
      setCoins(res.nextCoins);
      setUnlockedSkins(res.nextUnlocked);
      setSavedHeroes((prev) =>
        prev.map((h) => {
          if (h.id !== activeHero.id) return h;
          const nextStats = calculateHeroStats(
            h.characterRole,
            skin.emoji,
            h.accessoryEmoji,
            h.backgroundStyle,
            h.flagEmoji
          );
          return {
            ...h,
            baseEmoji: skin.emoji,
            ...nextStats,
          };
        })
      );
    }
  };

  const handleForgeRelicForActiveHero = (
    relicName: string,
    resultAccEmoji: string,
    bonusHp: number,
    bonusAtk: number,
    bonusDef: number,
    cost: number
  ) => {
    setCoins((c) => Math.max(0, c - cost));
    setSavedHeroes((prev) =>
      prev.map((h) => {
        if (h.id !== activeHero.id) return h;
        const nextHp = h.hp + bonusHp;
        setPlayerHp(nextHp);
        setTrailingHp(nextHp);
        return {
          ...h,
          accessoryEmoji: resultAccEmoji,
          hp: nextHp,
          attack: h.attack + bonusAtk,
          defense: h.defense + bonusDef,
          forgedRelicName: relicName,
        };
      })
    );
  };

  const handleUpgradeHero = (heroId: string) => {
    const targetHero = savedHeroes.find((h) => h.id === heroId);
    if (!targetHero) return;
    const res = upgradeHeroTransaction(targetHero, coins, 25);
    if (res.success) {
      setCoins(res.nextCoins);
      setSavedHeroes((prev) => prev.map((h) => (h.id === heroId ? res.upgradedHero : h)));
      if (activeHero.id === heroId) {
        setPlayerHp(res.upgradedHero.hp);
        setTrailingHp(res.upgradedHero.hp);
      }
      soundFX.playVictory();
      setActionLogMessage(`⬆️ Герой ${res.upgradedHero.name} повышен (+15 ОЗ, +5 АТК, +4 ЗАЩ)!`);
    }
  };

  const handleRollGachaSkin = (): ShopSkin | null => {
    if (coins < 30) return null;
    const locked = SHOP_SKINS_CATALOG.filter((s) => !unlockedSkins.includes(s.emoji));
    if (locked.length === 0) return null;
    const picked = locked[Math.floor(Math.random() * locked.length)];
    setCoins((c) => Math.max(0, c - 30));
    setUnlockedSkins((prev) => (prev.includes(picked.emoji) ? prev : [...prev, picked.emoji]));
    soundFX.playStarCollect();
    return picked;
  };

  const handleChallengeBestiaryBoss = (bossIndex: number) => {
    const template = BOSS_ROSTER[bossIndex % BOSS_ROSTER.length];
    const scale = 1 + (level - 1) * 0.1;
    setStudioOpen(false);
    setActiveArenaEnemy({
      id: `bestiary-boss-${Date.now()}`,
      r: playerPos.r,
      c: playerPos.c,
      emoji: template.emoji,
      name: template.name,
      policy: template.policy,
      elementWeakness: template.weakness,
      patrolDir: { dr: 0, dc: 1 },
      maxHp: Math.round(template.hp * scale),
      hp: Math.round(template.hp * scale),
      attack: Math.round(template.atk * scale),
      defense: Math.round(template.def * scale),
      rewardCoins: template.reward + level * 5,
      telegraphing: false,
    });
  };

  const handleUpgradeTalent = (talentId: string, cost?: number) => {
    const node = MULTIVERSE_TALENTS.find((t) => t.id === talentId);
    if (!node) return;
    const currentRank = talentRanks[talentId] ?? 0;
    const actualCost = cost ?? node.baseCost * (currentRank + 1);
    if (currentRank >= node.maxRank || coins < actualCost) return;
    setCoins((c) => Math.max(0, c - actualCost));
    setTalentRanks((prev) => ({
      ...prev,
      [talentId]: currentRank + 1,
    }));
    soundFX.playStarCollect();
    setActionLogMessage(`🌌 Талант Мультивселенной «${node.name}» улучшен до ранга ${currentRank + 1}!`);
  };

  const handleApplyMergedProfile = (merged: MultiverseProfileSnapshot, statusMsg?: string) => {
    setCoins(merged.coins);
    setHighLevel(merged.level);
    setUnlockedSkins(merged.unlockedSkins);
    setClaimedAchievements(merged.claimedAchievements);
    setTalentRanks(merged.talentRanks);
    setSavedHeroes(merged.heroes);
    soundFX.playVictory();
    setActionLogMessage(
      statusMsg ??
        `🔄 Аддитивное Омни-Слияние применено: ${merged.heroes.length} героев и ${merged.unlockedSkins.length} скинов!`
    );
  };

  const hpPercent = Math.max(0, Math.min(100, (playerHp / (activeHero.hp + activeGuild.bonusHp)) * 100));
  const trailingHpPercent = Math.max(
    0,
    Math.min(100, (trailingHp / (activeHero.hp + activeGuild.bonusHp)) * 100)
  );

  // Compute live 1.5D Target Vector Compass toward primary objective
  const primaryTarget =
    !keyCollected && maze.keyPos
      ? { pos: maze.keyPos, label: '🗝️ Ключа' }
      : starsRemaining.length > 0
      ? { pos: starsRemaining[0], label: '⭐ Звезды' }
      : { pos: maze.exit, label: '🏁 Врат' };
  const targetCompass = computeTargetCompass(playerPos, primaryTarget.pos, primaryTarget.label);

  // Pick 3 Roguelike Perk cards to offer on stage clear
  const offeredPerks: RoguelikePerk[] = ROGUELIKE_PERKS_POOL.slice(0, 3);

  return (
    <div
      className={`relative min-h-screen w-full bg-[#130E24] text-[#F8F5FF] flex flex-col justify-between overflow-hidden ${
        scanlinesEnabled ? 'crt-scanlines' : ''
      }`}
    >
      {/* =========================================================
          1. TITLE SCREEN STAGE (Interactive 3D Hero Showcase + Biomes)
         ========================================================= */}
      {shellState === 'title' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-6xl w-full mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-300/15 pb-3.5">
            <div className="flex items-center gap-3">
              <svg
                width="42"
                height="42"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <rect
                  x="3"
                  y="3"
                  width="42"
                  height="42"
                  rx="12"
                  fill="#2A1E4D"
                  stroke="#A78BFA"
                  strokeWidth="2.5"
                />
                <path
                  d="M11 15H23V23H15V33H25V25H35V37H37"
                  stroke="#FBBF24"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="14" cy="14" r="3.5" fill="#34D399" />
                <circle cx="34" cy="14" r="3.5" fill="#F43F5E" />
                <circle cx="34" cy="34" r="4" fill="#A78BFA" />
              </svg>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  EMOJI UNIVERSE 3D
                </h1>
                <p className="text-xs text-purple-200/80">
                  Средневековая Цитадель × Кибер-Лабиринт × Алхимическая Кузница Рун
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm font-mono-tabular">
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">ТИТУЛ:</span>
                <span className="font-bold text-amber-300">
                  {royalRank.crestEmoji} {royalRank.titleRu}
                </span>
              </div>
              <span aria-hidden="true" className="text-purple-400/40">
                ·
              </span>
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">МОНЕТЫ:</span>
                <span className="font-bold text-amber-300">🪙 {coins}</span>
              </div>
              <span aria-hidden="true" className="text-purple-400/40">
                ·
              </span>
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">СЕКТОР:</span>
                <span className="font-bold text-emerald-300">УР. {highLevel}</span>
              </div>
              <span aria-hidden="true" className="text-purple-400/40">
                ·
              </span>
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">ФАМИЛЬЯР:</span>
                <span className="font-bold text-cyan-300">
                  {activeFamiliar.emoji} {activeFamiliar.nameRu}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-center my-auto py-4">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-2">
                <h2
                  style={{ textWrap: 'balance' }}
                  className="text-3xl sm:text-5xl font-extrabold text-white leading-[1.08] tracking-tight"
                >
                  Создай 3D-Героя, Исследуй 4 Биома и Сплетай Заклинания
                </h2>
                <p className="text-sm text-purple-200/85 max-w-xl leading-relaxed">
                  Откройте синергию глифов 🧬, выкуйте рунные артефакты ⚗️, найдите золотой ключ 🗝️ в факельной Средневековой Цитадели 🏰 или Неоновом Ядре ⚡, проходите сквозь стены квантовым сдвигом 📐 и сокрушайте боссов синтезом 3 рун 🎹!
                </p>
              </div>

              {/* 1. Difficulty Selector (All 6 Multiverse Scales) */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-purple-200">
                  1. Размер и сложность 3D-лабиринта (6 масштабов от 7×7 до 21×21):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['BLITZ', 'EASY', 'MEDIUM', 'HARD', 'MEGA', 'ULTRA'] as DifficultyKey[]).map((key) => {
                    const cfg = DIFFICULTIES[key];
                    const selected = difficulty === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDifficulty(key)}
                        className={`p-2 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'bg-purple-600/35 border-purple-400 text-white shadow-md'
                            : 'bg-[#1D1636] border-purple-300/15 text-purple-200 hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="text-xs font-bold whitespace-nowrap">{cfg.label}</div>
                        <div className="text-[10px] text-purple-200/75 mt-0.5 truncate">{cfg.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 3D Biome Selector (All 8 Multiverse Biomes) */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-purple-200">
                  2. Эпоха и 3D-Биом Лабиринта (8 миров Мультивселенной):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {BIOME_ORDER.map((bKey) => {
                    const b = BIOMES[bKey];
                    const active = biomeKey === bKey;
                    return (
                      <button
                        key={bKey}
                        type="button"
                        onClick={() => setBiomeKey(bKey)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-amber-500/25 border-amber-400 text-white shadow'
                            : 'bg-[#1D1636] border-purple-300/15 text-purple-200 hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{b.titleRu}</div>
                        <div className="text-[10px] text-purple-200/70 truncate mt-0.5">
                          {b.subtitleRu}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Settings Row + 2.5D Tarot + Guild Order + 4.5D Weather + Game Mode + Anomaly */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const order: DimensionalMode[] = [
                      '3d-chase',
                      '3.5d-quantum',
                      '2.5d-diorama',
                      '1.5d-wave',
                      'first-person',
                      '2d-classic',
                    ];
                    setViewMode((v) => order[(order.indexOf(v) + 1) % order.length]);
                  }}
                  className="px-3 py-1.5 rounded-xl border bg-cyan-500/20 border-cyan-400/40 text-cyan-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  📐 Проекция: {DIMENSIONAL_MODE_META[viewMode].labelRu}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idx = TAROT_CARDS_CATALOG.findIndex((t) => t.id === activeTarotId);
                    const nextTarot =
                      TAROT_CARDS_CATALOG[(idx + 1) % TAROT_CARDS_CATALOG.length];
                    setActiveTarotId(nextTarot.id);
                  }}
                  title={activeTarot.effectRu}
                  className="px-3 py-1.5 rounded-xl border bg-amber-500/20 border-amber-400/40 text-amber-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  🃏 Таро: {activeTarot.emoji} {activeTarot.titleRu}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const idx = GUILD_ORDERS_CATALOG.findIndex((g) => g.id === activeGuildId);
                    const nextGuild =
                      GUILD_ORDERS_CATALOG[(idx + 1) % GUILD_ORDERS_CATALOG.length];
                    setActiveGuildId(nextGuild.id);
                  }}
                  title={activeGuild.descRu}
                  className="px-3 py-1.5 rounded-xl border bg-emerald-500/20 border-emerald-400/40 text-emerald-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  ⚜️ Орден: {activeGuild.emoji} {activeGuild.titleRu}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const wOrder: SectorWeatherKey[] = [
                      'CLEAR_AETHER',
                      'METEOR_EMBER',
                      'CHRONO_MIST',
                      'ASTRAL_STORM',
                    ];
                    setSectorWeather((w) => wOrder[(wOrder.indexOf(w) + 1) % wOrder.length]);
                  }}
                  title={SECTOR_WEATHERS_CATALOG[sectorWeather].descRu}
                  className="px-3 py-1.5 rounded-xl border bg-purple-500/25 border-purple-400/40 text-purple-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {SECTOR_WEATHERS_CATALOG[sectorWeather].badgeRu}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const gOrder: GameModeKey[] = [
                      'CAMPAIGN',
                      'SPEEDRUN',
                      'ENDLESS',
                      'SANDBOX',
                    ];
                    setGameMode((m) => gOrder[(gOrder.indexOf(m) + 1) % gOrder.length]);
                  }}
                  title={GAME_MODES[gameMode].subtitleRu}
                  className="px-3 py-1.5 rounded-xl border bg-indigo-500/20 border-indigo-400/40 text-indigo-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {GAME_MODES[gameMode].icon} {GAME_MODES[gameMode].titleRu}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const aOrder: SectorAnomalyKey[] = [
                      'STANDARD',
                      'STARFALL_BONUS',
                      'OVERCHARGE_MANA',
                      'REGEN_AURA',
                      'BOSS_FRENZY',
                    ];
                    setSectorAnomaly((a) => aOrder[(aOrder.indexOf(a) + 1) % aOrder.length]);
                  }}
                  title={SECTOR_ANOMALIES[sectorAnomaly].descRu}
                  className="px-3 py-1.5 rounded-xl border bg-fuchsia-500/20 border-fuchsia-400/40 text-fuchsia-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {SECTOR_ANOMALIES[sectorAnomaly].icon} {SECTOR_ANOMALIES[sectorAnomaly].titleRu}
                </button>

                <button
                  type="button"
                  onClick={() => setEnemiesEnabled((v) => !v)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                    enemiesEnabled
                      ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                      : 'bg-[#1D1636] border-purple-300/15 text-purple-300'
                  }`}
                >
                  {enemiesEnabled ? '👾 3D-Стражи: ВКЛ' : '👾 3D-Стражи: ВЫКЛ'}
                </button>

                <button
                  type="button"
                  onClick={() => setScanlinesEnabled((s) => !s)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                    scanlinesEnabled
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                      : 'bg-[#1D1636] border-purple-300/15 text-purple-300'
                  }`}
                >
                  📺 ЭЛТ: {scanlinesEnabled ? 'ВКЛ' : 'ВЫКЛ'}
                </button>
              </div>

              {/* Primary CTA & Studio Actions */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  data-start="true"
                  onClick={() => startMazeRun(level, difficulty)}
                  className="px-5 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm sm:text-base shadow-xl transition-transform active:scale-95 whitespace-nowrap"
                >
                  🚀 Войти в 3D-Лабиринт
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudioInitialTab('builder');
                    setStudioOpen(true);
                  }}
                  className="px-4 py-3.5 rounded-2xl bg-[#241B42] hover:bg-[#2F2356] border border-purple-300/30 text-white font-bold text-sm transition-colors whitespace-nowrap"
                >
                  🛠️ 3D-Студия и Кузница
                </button>

                <button
                  type="button"
                  data-testid="open-stargate-transit-title"
                  onClick={() => setTransitOpen(true)}
                  className="px-4 py-3.5 rounded-2xl bg-indigo-600/35 hover:bg-indigo-600/55 border border-cyan-400/45 text-cyan-100 font-extrabold text-sm transition-colors whitespace-nowrap"
                >
                  🌌 Stargate 4D-Транзит
                </button>

                <button
                  type="button"
                  onClick={() => setOmniModalOpen(true)}
                  className="px-4 py-3.5 rounded-2xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/45 text-amber-100 font-extrabold text-sm transition-colors whitespace-nowrap"
                >
                  🔄 GitHub Омни-Слияние & Таланты
                </button>

                <button
                  type="button"
                  onClick={() => setCodexOpen(true)}
                  className="px-4 py-3.5 rounded-2xl bg-[#1D1636] hover:bg-[#281E4B] border border-purple-300/20 text-purple-200 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  📜 Контракты и Кодекс
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#1C1533] border border-purple-300/20 rounded-3xl p-5 shadow-2xl">
              <div className="text-xs font-semibold text-purple-300 mb-2">
                Активный 3D-Боец (наведите для 3D-параллакса)
              </div>

              <EmojiAvatarCard
                baseEmoji={activeHero.baseEmoji}
                accessoryEmoji={activeHero.accessoryEmoji}
                flagEmoji={activeHero.flagEmoji}
                bgStyle={activeHero.backgroundStyle}
                role={activeHero.characterRole}
                sizePx={172}
                hasGlow={true}
                testId="title-hero-card"
              />

              <div className="mt-3 text-center">
                <div className="text-lg font-extrabold text-white">{activeHero.name}</div>
                <div className="text-xs text-amber-300 font-bold mt-0.5">
                  🧬 {activeSynergy.titleRu}
                </div>
                <div className="text-[11px] text-purple-200/80 mt-0.5">
                  {activeSynergy.descriptionRu}
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2 mt-3.5 pt-3.5 border-t border-purple-300/15 text-center font-mono-tabular">
                <div className="p-2 rounded-xl bg-[#140E26]">
                  <div className="text-[11px] text-rose-300">ОЗ (HP)</div>
                  <div className="text-base font-bold text-white">{activeHero.hp}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#140E26]">
                  <div className="text-[11px] text-amber-300">АТК (ATK)</div>
                  <div className="text-base font-bold text-white">{activeHero.attack}</div>
                </div>
                <div className="p-2 rounded-xl bg-[#140E26]">
                  <div className="text-[11px] text-emerald-300">ЗАЩ (DEF)</div>
                  <div className="text-base font-bold text-white">{activeHero.defense}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStudioInitialTab('forge');
                  setStudioOpen(true);
                }}
                className="mt-3.5 w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/35 text-xs font-bold text-amber-200 transition-colors"
              >
                ⚗️ Открыть Средневековую Кузницу Рун или Шкаф Скинов →
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-purple-300/70 pt-1">
            WASD / Стрелки / Клик по 3D-плитке — Шаг · Q — Квантовый Сдвиг сквозь стену · C — Камера · H — Скрыть панель · P — Пауза
          </div>
        </main>
      )}

      {/* =========================================================
          2. PLAYING SCREEN (Full-Viewport 3D Scene + Collapsible Bottom Dock)
         ========================================================= */}
      {(shellState === 'playing' || shellState === 'paused' || shellState === 'gameover') && (
        <div className="fixed inset-0 z-10 flex flex-col justify-between pointer-events-none">
          {/* FULL-BLEED 3D WEBGL VIEWPORT (or optional 2D Retro Comparison Grid) */}
          <div className="absolute inset-0 z-0 pointer-events-auto">
            {viewMode !== '2d-classic' ? (
              <Maze3DViewport
                maze={maze}
                biomeKey={biomeKey}
                playerPos={playerPos}
                starsRemaining={starsRemaining}
                chestsRemaining={chestsRemaining}
                shrinesRemaining={shrinesRemaining}
                keyCollected={keyCollected}
                phaseGatesOpen={phaseGatesOpen}
                enemyFrozenTurns={enemyFrozenTurns}
                sectorWeather={sectorWeather}
                enemies={enemies}
                activeHero={activeHero}
                activeFamiliar={activeFamiliar}
                cameraMode={viewMode}
                boardShake={boardShake}
                historyPositions={historyStack.map((h) => h.playerPos)}
                quantumTarget={quantumPhaseOption?.target ?? null}
                vfxBurst={vfxBurst}
                onMoveStep={(dr, dc) => movePlayer(dr, dc, false)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#130E24] p-4 pb-36 pt-20">
                <div
                  data-testid="game-maze-viewport-2d"
                  style={{
                    aspectRatio: '1 / 1',
                    width: 'min(100%, 480px)',
                  }}
                  className="relative rounded-3xl bg-[#1D1B20] border-4 border-[#6750A4] p-2 shadow-2xl maze-dot-pattern flex flex-col justify-center"
                >
                  <div
                    style={{
                      gridTemplateColumns: `repeat(${maze.cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${maze.rows}, minmax(0, 1fr))`,
                    }}
                    className="grid w-full h-full gap-0.5"
                  >
                    {maze.grid.map((row, rIdx) =>
                      row.map((tile, cIdx) => {
                        const isPlayer = playerPos.r === rIdx && playerPos.c === cIdx;
                        const isStar = starsRemaining.some((s) => s.r === rIdx && s.c === cIdx);
                        const isChest = chestsRemaining.some((c) => c.r === rIdx && c.c === cIdx);
                        const isShrine = shrinesRemaining.some((s) => s.r === rIdx && s.c === cIdx);
                        const isKey =
                          !keyCollected && maze.keyPos?.r === rIdx && maze.keyPos?.c === cIdx;
                        const isPortal =
                          (maze.portals?.a.r === rIdx && maze.portals?.a.c === cIdx) ||
                          (maze.portals?.b.r === rIdx && maze.portals?.b.c === cIdx);
                        const isTrap = maze.traps.some((t) => t.r === rIdx && t.c === cIdx);
                        const enemyHere = enemies.find((e) => e.r === rIdx && e.c === cIdx);
                        const isExit = rIdx === maze.exit.r && cIdx === maze.exit.c;

                        if (tile === 'WALL') {
                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              className="w-full h-full rounded-[4px] bg-[#49454F]"
                            />
                          );
                        }
                        return (
                          <button
                            key={`${rIdx}-${cIdx}`}
                            type="button"
                            onClick={() => {
                              const dr = rIdx - playerPos.r;
                              const dc = cIdx - playerPos.c;
                              if (Math.abs(dr) + Math.abs(dc) === 1) movePlayer(dr, dc);
                            }}
                            className="relative w-full h-full flex items-center justify-center text-base sm:text-lg"
                          >
                            {isExit && !isPlayer && (keyCollected ? '🏁' : '🔒')}
                            {isKey && !isPlayer && '🗝️'}
                            {isStar && !isPlayer && '⭐'}
                            {isChest && !isPlayer && '🎁'}
                            {isShrine && !isPlayer && '⛩️'}
                            {isPortal && !isPlayer && '🌀'}
                            {isTrap && !isPlayer && '⚙️'}
                            {enemyHere && !isPlayer && enemyHere.emoji}
                            {isPlayer && (
                              <span className="w-full h-full rounded-full bg-cyan-400/25 ring-2 ring-cyan-300 flex items-center justify-center">
                                {activeHero.baseEmoji}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TOP PERIMETER HUD BAR (Solid rgba fill, zero backdrop-filter over WebGL) */}
          <div className="relative z-20 mx-auto mt-3 w-full max-w-5xl px-4 pointer-events-auto">
            <div
              style={{ backgroundColor: 'rgba(24, 18, 43, 0.92)' }}
              className="flex flex-wrap items-center justify-between gap-3 border border-purple-300/25 rounded-2xl px-4 py-2 shadow-xl"
            >
              {/* Hero Badge & HP Bar */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStudioInitialTab('builder');
                    setStudioOpen(true);
                  }}
                  className="flex items-center gap-2.5 pr-3 border-r border-purple-300/20 hover:opacity-90"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-700 border border-white/60 flex items-center justify-center text-xl relative">
                    {activeHero.baseEmoji}
                    <span className="absolute -top-1 -right-1 text-[11px]">
                      {activeHero.accessoryEmoji}
                    </span>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-tight">
                      {activeHero.name}
                    </div>
                    <div className="text-[11px] text-amber-300">
                      СЕКТОР #{level} · {BIOMES[biomeKey].titleRu}
                    </div>
                  </div>
                </button>

                <div className="w-28 sm:w-36">
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular mb-0.5">
                    <span className="font-bold text-rose-300">ОЗ</span>
                    <span className="font-bold text-white">
                      {Math.round(playerHp)}/{activeHero.hp + activeGuild.bonusHp}
                    </span>
                  </div>
                  <div className="relative w-full h-2 bg-black/70 rounded-full overflow-hidden border border-white/10">
                    <div
                      style={{ width: `${trailingHpPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-amber-400/60 transition-all duration-300"
                    />
                    <div
                      style={{ width: `${hpPercent}%` }}
                      className="relative h-full bg-rose-500 transition-all duration-150"
                    />
                  </div>
                </div>
              </div>

              {/* Center Live Telemetry */}
              <div className="flex items-center gap-3.5 font-mono-tabular">
                <div className="text-center">
                  <div className="text-[10px] text-purple-300">КЛЮЧ</div>
                  <div className="text-sm font-extrabold text-amber-300">
                    {keyCollected ? '🗝️ ОТКРЫТО' : '🔒 ИЩИТЕ'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-purple-300">ЗВЁЗДЫ</div>
                  <div className="text-sm font-extrabold text-amber-300">
                    ⭐ {starsCollectedRun}/{maze.stars.length}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-purple-300">МАНА</div>
                  <div className="text-sm font-extrabold text-cyan-300">⚡ {starEnergy}/5</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-purple-300">МОНЕТЫ</div>
                  <div className="text-sm font-extrabold text-white">🪙 {coins}</div>
                </div>
              </div>

              {/* Top-Right Compact Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  data-testid="open-stargate-transit-hud"
                  onClick={() => setTransitOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 border border-cyan-400/45 text-xs font-bold text-cyan-200 whitespace-nowrap"
                >
                  🌌 Stargate 4D [G]
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextB = BIOME_ORDER[(BIOME_ORDER.indexOf(biomeKey) + 1) % BIOME_ORDER.length];
                    setBiomeKey(nextB);
                    setActionLogMessage(`Смена 3D-Биома: ${BIOMES[nextB].titleRu}!`);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-xs font-bold text-amber-200 whitespace-nowrap"
                >
                  {BIOMES[biomeKey].emoji} Биом
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStudioInitialTab('forge');
                    setStudioOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-600/35 hover:bg-purple-600/55 border border-purple-400/40 text-xs font-bold text-purple-100 whitespace-nowrap"
                >
                  ⚗️ Кузница
                </button>
                <button
                  type="button"
                  onClick={() => setOmniModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600/35 hover:bg-indigo-600/55 border border-indigo-400/40 text-xs font-bold text-indigo-100 whitespace-nowrap"
                >
                  🔄 GitHub
                </button>
                <button
                  type="button"
                  onClick={handleChallengeArenaBoss}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600/35 hover:bg-rose-600/55 border border-rose-400/40 text-xs font-bold text-rose-100 whitespace-nowrap"
                >
                  ⚔️ RPG-Дуэль
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={muted ? 'Включить звук [M]' : 'Выключить звук [M]'}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setMuted((m) => {
                      const next = !m;
                      soundFX.muted = next;
                      return next;
                    });
                  }}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    {muted ? (
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    ) : (
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    )}
                  </svg>
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Перезапустить уровень [R]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    startMazeRun(level, difficulty);
                  }}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                  </svg>
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label="Пауза [P]"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShellState((s) => (s === 'playing' ? 'paused' : 'playing'));
                  }}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* CARTOGRAPHER'S FOG-OF-WAR MINIMAP + 1.5D COMPASS + 4.5D WEATHER + CHRONO-REWIND [Z] */}
          {!dockCollapsed && (
            <div className="fixed top-20 left-4 z-20 pointer-events-auto hidden md:block">
              <CartographerMinimap
                maze={maze}
                playerPos={playerPos}
                exploredSet={exploredTiles}
                starsRemaining={starsRemaining}
                keyCollected={keyCollected}
                phaseGatesOpen={phaseGatesOpen}
                enemies={enemies}
                streakCount={streakCount}
                rewindCount={historyStack.length}
                compassSummary={targetCompass.summaryRu}
                weatherBadge={SECTOR_WEATHERS_CATALOG[sectorWeather].badgeRu}
                onTriggerRewind={handleChronoRewind}
              />
            </div>
          )}

          {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Viewport Occlusion) */}
          <div className="relative z-20 mx-auto mb-3 w-full max-w-4xl px-4 flex flex-col items-center pointer-events-auto">
            <button
              type="button"
              onClick={() => setDockCollapsed((c) => !c)}
              className="px-4 py-1 rounded-t-xl bg-[#241B42] border border-b-0 border-purple-300/30 text-[11px] font-bold text-purple-200 hover:text-white transition-colors"
            >
              {dockCollapsed ? '▴ Показать Пульт Управления [H]' : '▾ Скрыть Панель (Режим Кино) [H]'}
            </button>

            {!dockCollapsed && (
              <div
                style={{ backgroundColor: 'rgba(24, 18, 43, 0.94)' }}
                className="w-full border border-purple-300/30 rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-4"
              >
                {/* Left: 3D Hero Card Preview + Action Log */}
                <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                  <EmojiAvatarCard
                    baseEmoji={activeHero.baseEmoji}
                    accessoryEmoji={activeHero.accessoryEmoji}
                    flagEmoji={activeHero.flagEmoji}
                    bgStyle={activeHero.backgroundStyle}
                    role={activeHero.characterRole}
                    sizePx={72}
                  />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="px-3 py-1.5 rounded-xl bg-[#120D22] border border-purple-400/25 font-mono-tabular text-xs text-purple-100 truncate">
                      <span className="text-emerald-400 font-bold mr-1.5">&gt;</span>
                      {actionLogMessage}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          '1.5d-wave',
                          '2.5d-diorama',
                          '3d-chase',
                          '3.5d-quantum',
                          'first-person',
                          '2d-classic',
                        ] as DimensionalMode[]
                      ).map((mKey) => {
                        const meta = DIMENSIONAL_MODE_META[mKey];
                        const isSelected = viewMode === mKey;
                        return (
                          <button
                            key={mKey}
                            type="button"
                            onClick={() => {
                              setViewMode(mKey);
                              setActionLogMessage(`${meta.labelRu}: ${meta.descRu}`);
                            }}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                              isSelected
                                ? 'bg-purple-600 text-white ring-1 ring-purple-300'
                                : 'bg-white/10 text-purple-200 hover:bg-white/15'
                            }`}
                          >
                            {meta.shortLabelRu}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={quantumCharges <= 0}
                        onClick={() => movePlayer(lastMoveDir.dr, lastMoveDir.dc, true)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/25 hover:bg-cyan-500/40 disabled:opacity-35 border border-cyan-400/40 text-[11px] font-bold text-cyan-200 whitespace-nowrap"
                      >
                        📐 Сдвиг [Q] ({quantumCharges})
                      </button>
                      <button
                        type="button"
                        disabled={starEnergy < 1}
                        onClick={handleCorridorShockwave}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/25 hover:bg-sky-500/40 disabled:opacity-35 border border-sky-400/40 text-[11px] font-bold text-sky-200 whitespace-nowrap"
                      >
                        ⚡ Волна [E]
                      </button>
                      <button
                        type="button"
                        disabled={starEnergy < 2}
                        onClick={handleCastPetrifyScroll}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/40 disabled:opacity-35 border border-indigo-400/40 text-[11px] font-bold text-indigo-200 whitespace-nowrap"
                      >
                        🗿 Свиток [F]
                      </button>
                      <button
                        type="button"
                        disabled={starEnergy < 1}
                        onClick={handleWallBreakerBomb}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/25 hover:bg-orange-500/40 disabled:opacity-35 border border-orange-400/40 text-[11px] font-bold text-orange-200 whitespace-nowrap"
                      >
                        💣 Бомба [B]
                      </button>
                      <button
                        type="button"
                        onClick={handleAutoGuidanceStep}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/25 hover:bg-teal-500/40 border border-teal-400/40 text-[11px] font-bold text-teal-200 whitespace-nowrap"
                      >
                        🧭 Шаг ИИ [N]
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutopilotActive((prev) => !prev)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap ${
                          autopilotActive
                            ? 'bg-emerald-600 text-white border-emerald-300'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-400/40 text-emerald-200'
                        }`}
                      >
                        🤖 Автопилот [I]: {autopilotActive ? 'ВКЛ' : 'ВЫКЛ'}
                      </button>
                      {ALCHEMICAL_POTIONS_CATALOG.map((pot) => {
                        const count = potionBelt[pot.id] ?? 0;
                        return (
                          <button
                            key={pot.id}
                            type="button"
                            onClick={() => handleUseOrBrewPotion(pot.id)}
                            title={`${pot.titleRu}: ${pot.descRu}`}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/35 text-[11px] font-bold text-emerald-200 whitespace-nowrap"
                          >
                            {pot.emoji} [{pot.hotkey}] ({count})
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setMerchantOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/35 border border-orange-400/35 text-[11px] font-bold text-orange-200 whitespace-nowrap"
                      >
                        🐪 Караван
                      </button>
                      <button
                        type="button"
                        onClick={() => setCodexOpen(true)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/30 text-[11px] font-bold text-amber-200 whitespace-nowrap"
                      >
                        📖 Кодекс
                      </button>
                      <button
                        type="button"
                        onClick={() => setShellState('title')}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] font-bold text-purple-200 whitespace-nowrap"
                      >
                        🏠 Меню
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Compact Tactile D-Pad */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    aria-label="Шаг влево"
                    onClick={() => movePlayer(0, -1)}
                    className="w-10 h-10 rounded-xl bg-white text-[#6750A4] hover:bg-purple-100 font-extrabold shadow flex items-center justify-center active:scale-95"
                  >
                    ◀
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      aria-label="Шаг вверх"
                      onClick={() => movePlayer(-1, 0)}
                      className="w-10 h-10 rounded-xl bg-white text-[#6750A4] hover:bg-purple-100 font-extrabold shadow flex items-center justify-center active:scale-95"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      aria-label="Шаг вниз"
                      onClick={() => movePlayer(1, 0)}
                      className="w-10 h-10 rounded-xl bg-white text-[#6750A4] hover:bg-purple-100 font-extrabold shadow flex items-center justify-center active:scale-95"
                    >
                      ▼
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Шаг вправо"
                    onClick={() => movePlayer(0, 1)}
                    className="w-10 h-10 rounded-xl bg-white text-[#6750A4] hover:bg-purple-100 font-extrabold shadow flex items-center justify-center active:scale-95"
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          3. PAUSE MODAL ('paused')
         ========================================================= */}
      {shellState === 'paused' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Пауза"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-md bg-[#1C1533] border-2 border-purple-400/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="text-4xl">⏸️</div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">3D-Игра на Паузе</h2>
              <p className="text-xs text-purple-200/75 mt-1">
                Сектор #{level} ({BIOMES[biomeKey].titleRu}) · Герой: {activeHero.name}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono-tabular text-center">
              <div className="p-2.5 rounded-xl bg-[#130E24]">
                <div className="text-[11px] text-purple-300">ЗВЁЗДЫ</div>
                <div className="text-base font-bold text-amber-300">
                  {starsCollectedRun}/{maze.stars.length}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#130E24]">
                <div className="text-[11px] text-purple-300">МОНЕТЫ</div>
                <div className="text-base font-bold text-white">{coins}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#130E24]">
                <div className="text-[11px] text-purple-300">ОЗ ГЕРОЯ</div>
                <div className="text-base font-bold text-emerald-300">
                  {playerHp}/{activeHero.hp + activeGuild.bonusHp}
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setShellState('playing')}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors"
              >
                ▶️ Продолжить 3D-Поход
              </button>
              <button
                type="button"
                onClick={() => startMazeRun(level, difficulty)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
              >
                🔄 Перезапустить Уровень
              </button>
              <button
                type="button"
                onClick={() => setShellState('title')}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 font-semibold text-sm transition-colors"
              >
                🏠 Выйти на Титульный Экран
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4. VICTORY / GAME OVER MODAL ('gameover' + Roguelike Perk Draft)
         ========================================================= */}
      {shellState === 'gameover' && runSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={runSummary.victory ? 'Уровень Пройден' : 'Поражение'}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-[#1C1533] border-2 border-purple-400/50 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="text-4xl">{runSummary.victory ? '🏆' : '💀'}</div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">
                {runSummary.victory
                  ? `3D-Сектор #${runSummary.levelCleared} Очищен!`
                  : 'Герой Пал в 3D-Лабиринте'}
              </h2>
              <p className="text-xs text-purple-200/80 mt-1">
                {runSummary.victory
                  ? 'Выберите 1 из 3 Карт Талантов (Roguelike Perk) для усиления в следующем биоме!'
                  : 'Стражи лабиринта оказались сильнее. Выкуйте артефакт в Кузнице Рун и попробуйте снова!'}
              </p>
            </div>

            {(() => {
              const mastery = computeRunMasteryGrade(
                runSummary.starsCollected,
                runSummary.totalStars,
                runSummary.clearTimeSec,
                runSummary.enemiesDefeated,
                runSummary.victory
              );
              return (
                <div className="px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-between text-left">
                  <div>
                    <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      Ранг Мастерства Прохождения
                    </div>
                    <div className="text-sm font-extrabold text-white">{mastery.titleRu}</div>
                  </div>
                  <div className="flex items-center gap-2 font-mono-tabular">
                    <span className="text-xs font-bold text-emerald-300">
                      +{mastery.bonusCoins} 🪙
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-amber-400 text-[#130E24] font-extrabold text-lg">
                      {mastery.grade}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-2.5 font-mono-tabular">
              <div className="p-2.5 rounded-2xl bg-[#130E24] border border-purple-300/15">
                <div className="text-[11px] text-purple-300">ЗВЁЗДЫ</div>
                <div className="text-base font-extrabold text-amber-300">
                  ⭐ {runSummary.starsCollected}/{runSummary.totalStars}
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#130E24] border border-purple-300/15">
                <div className="text-[11px] text-purple-300">ДОБЫТО</div>
                <div className="text-base font-extrabold text-emerald-300">
                  +{runSummary.coinsEarned} 🪙
                </div>
              </div>
              <div className="p-2.5 rounded-2xl bg-[#130E24] border border-purple-300/15">
                <div className="text-[11px] text-purple-300">ВРЕМЯ</div>
                <div className="text-base font-extrabold text-white">
                  {runSummary.clearTimeSec}с
                </div>
              </div>
            </div>

            {/* ROGUELIKE PERK DRAFT CARDS ON VICTORY */}
            {runSummary.victory && (
              <div className="text-left space-y-2">
                <div className="text-xs font-bold text-amber-300 text-center">
                  🃏 Выберите Талант Возвышения перед следующим походом:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {offeredPerks.map((perk) => {
                    const isPicked =
                      selectedPerkOnVictory === perk.id || activePerks.includes(perk.id);
                    return (
                      <button
                        key={perk.id}
                        type="button"
                        onClick={() => {
                          setSelectedPerkOnVictory(perk.id);
                          setActivePerks((prev) =>
                            prev.includes(perk.id) ? prev : [...prev, perk.id]
                          );
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          isPicked
                            ? 'bg-amber-500/25 border-amber-400 text-white'
                            : 'bg-[#130E24] border-purple-300/20 text-purple-200 hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="text-lg">{perk.emoji}</div>
                        <div className="text-xs font-bold text-white mt-1">{perk.titleRu}</div>
                        <div className="text-[10px] text-purple-200/75 mt-1 leading-snug">
                          {perk.descRu}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              {runSummary.victory && (
                <button
                  type="button"
                  data-testid="open-stargate-transit-victory"
                  onClick={() => setTransitOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg transition-all"
                >
                  🌌 Межлокационный Переход Stargate 4D × Obsidian (Шлюз в Сектор #{level}) →
                </button>
              )}
              <button
                type="button"
                data-start="true"
                onClick={() => startMazeRun(level, difficulty)}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-lg transition-colors"
              >
                {runSummary.victory
                  ? `🚀 Быстрый Прыжок в 3D-Биом (Сектор #${level}) →`
                  : '🔄 Попробовать Снова'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShellState('title');
                  setStudioInitialTab('forge');
                  setStudioOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 font-bold text-xs sm:text-sm transition-colors"
              >
                ⚗️ Открыть Кузницу Рун и Магазин Скинов
              </button>
              <button
                type="button"
                onClick={() => setShellState('title')}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 font-semibold text-xs transition-colors"
              >
                🏠 Вернуться на Титульный Экран
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          4B. WANDERING CARAVAN MERCHANT MODAL ('merchantOpen' 🐪)
         ========================================================= */}
      {merchantOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Караван Странствующего Алхимика"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-xl bg-[#1C1533] border-2 border-amber-400/50 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-purple-300/20 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐪</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white">
                    Караван Алхимика Аль-Кеми
                  </h2>
                  <p className="text-xs text-amber-200/80">
                    Средневековая полевая торговля прямо в лабиринте · Казна:{' '}
                    <strong className="font-mono-tabular text-amber-300">🪙 {coins}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMerchantOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white"
              >
                Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Deal 1: Master Key */}
              <div className="p-3.5 rounded-2xl bg-[#130E24] border border-amber-400/30 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white">🗝️ Отмычка Архитектора</span>
                    <span className="text-xs font-mono-tabular font-bold text-amber-300">30 🪙</span>
                  </div>
                  <p className="text-[11px] text-purple-200/75 mt-1">
                    Мгновенно отпирает 3D-врата выхода 🏁 и опускает все 4D-Фазовые Заслонки 🟪.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={coins < 30 || (keyCollected && phaseGatesOpen)}
                  onClick={() => {
                    setCoins((c) => c - 30);
                    setKeyCollected(true);
                    setPhaseGatesOpen(true);
                    soundFX.playStarCollect();
                    setActionLogMessage(
                      '🐪 Куплена Отмычка Архитектора: врата 🏁 и 4D-Заслонки 🟪 открыты!'
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 disabled:opacity-35 border border-amber-400/40 text-xs font-bold text-amber-200"
                >
                  {keyCollected && phaseGatesOpen ? 'Уже открыто' : 'Купить за 30 🪙'}
                </button>
              </div>

              {/* Deal 2: Full Potion Belt Refill */}
              <div className="p-3.5 rounded-2xl bg-[#130E24] border border-emerald-400/30 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white">🧪 Сумка Эликсиров</span>
                    <span className="text-xs font-mono-tabular font-bold text-emerald-300">22 🪙</span>
                  </div>
                  <p className="text-[11px] text-purple-200/75 mt-1">
                    Добавляет +1 заряд ко всем 3 зельям пояса ([1] Феникс, [2] Эфир, [3] Василиск).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={coins < 22}
                  onClick={() => {
                    setCoins((c) => c - 22);
                    setPotionBelt((prev) => ({
                      'elixir-phoenix': (prev['elixir-phoenix'] ?? 0) + 1,
                      'ether-stargazer': (prev['ether-stargazer'] ?? 0) + 1,
                      'oil-basilisk': (prev['oil-basilisk'] ?? 0) + 1,
                    }));
                    soundFX.playHeal();
                    setActionLogMessage('🐪 Сумка Эликсиров пополнена: +1 ко всем зельям [1][2][3]!');
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 disabled:opacity-35 border border-emerald-400/40 text-xs font-bold text-emerald-200"
                >
                  Пополнить пояс за 22 🪙
                </button>
              </div>

              {/* Deal 3: Astral Cartographer Atlas */}
              <div className="p-3.5 rounded-2xl bg-[#130E24] border border-cyan-400/30 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white">🗺️ Астральный Атлас</span>
                    <span className="text-xs font-mono-tabular font-bold text-cyan-300">18 🪙</span>
                  </div>
                  <p className="text-[11px] text-purple-200/75 mt-1">
                    Полностью развеивает туман войны на мини-карте и даёт +2 заряда Квантового Сдвига [Q].
                  </p>
                </div>
                <button
                  type="button"
                  disabled={coins < 18}
                  onClick={() => {
                    setCoins((c) => c - 18);
                    setQuantumCharges((q) => q + 2);
                    const allTiles = new Set<string>();
                    for (let r = 0; r < maze.rows; r++) {
                      for (let c = 0; c < maze.cols; c++) {
                        allTiles.add(`${r},${c}`);
                      }
                    }
                    setExploredTiles(allTiles);
                    soundFX.playSpell();
                    setActionLogMessage(
                      '🐪 Астральный Атлас открыт: весь туман войны развеян + получено +2 заряда [Q]!'
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-cyan-500/25 hover:bg-cyan-500/40 disabled:opacity-35 border border-cyan-400/40 text-[11px] font-bold text-cyan-200"
                >
                  Открыть карту за 18 🪙
                </button>
              </div>

              {/* Deal 4: Dragonfire Blade Tempering */}
              <div className="p-3.5 rounded-2xl bg-[#130E24] border border-rose-400/30 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-white">⚔️ Закалка Огнём</span>
                    <span className="text-xs font-mono-tabular font-bold text-rose-300">35 🪙</span>
                  </div>
                  <p className="text-[11px] text-purple-200/75 mt-1">
                    Навсегда повышает атаку активного героя на +6 АТК и полностью исцеляет ОЗ.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={coins < 35}
                  onClick={() => {
                    setCoins((c) => c - 35);
                    setPlayerHp(activeHero.hp + activeGuild.bonusHp);
                    setSavedHeroes((prev) =>
                      prev.map((h) =>
                        h.id === activeHero.id ? { ...h, attack: h.attack + 6 } : h
                      )
                    );
                    soundFX.playVictory();
                    setActionLogMessage(
                      '🐪 Клинок закалён драконьим огнём: +6 АТК навсегда и полное исцеление ОЗ!'
                    );
                  }}
                  className="w-full py-2 rounded-xl bg-rose-500/25 hover:bg-rose-500/40 disabled:opacity-35 border border-rose-400/40 text-xs font-bold text-rose-200"
                >
                  Закалить за 35 🪙
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          5. OVERLAY MODALS (RPG Arena, 3D Avatar Studio, Synergy Codex)
         ========================================================= */}
      <ArenaBattleModal
        enemy={activeArenaEnemy}
        hero={activeHero}
        activeFamiliar={activeFamiliar}
        playerHp={playerHp}
        playerMaxHp={activeHero.hp + activeGuild.bonusHp}
        initialStarEnergy={starEnergy}
        activePerks={activePerks}
        terrainBuff={
          activeArenaEnemy
            ? evaluateTerrainCombatBuff(maze, playerPos)
            : undefined
        }
        bestiaryKills={bestiaryKills}
        tarotAtkBonusPct={activeTarot.atkBonusPct}
        onBattleResolved={handleBattleResolved}
        onRetreat={handleArenaRetreat}
      />

      <AvatarStudioModal
        isOpen={studioOpen}
        onClose={() => setStudioOpen(false)}
        activeHero={activeHero}
        savedHeroes={savedHeroes}
        onSelectHero={handleSelectHero}
        onSaveNewHero={handleSaveNewHero}
        onDeleteHero={handleDeleteHero}
        onUpgradeHero={handleUpgradeHero}
        coins={coins}
        unlockedSkins={unlockedSkins}
        onPurchaseOrEquipSkin={handlePurchaseOrEquipSkin}
        onRollGachaSkin={handleRollGachaSkin}
        claimedAchievements={claimedAchievements}
        onChallengeBestiaryBoss={handleChallengeBestiaryBoss}
        onForgeRelicForActiveHero={handleForgeRelicForActiveHero}
        activeFamiliarId={activeFamiliarId}
        onSelectFamiliar={setActiveFamiliarId}
        initialTab={studioInitialTab}
      />

      <SynergyCodexModal
        isOpen={codexOpen}
        onClose={() => setCodexOpen(false)}
        bounties={bounties}
        royalRank={royalRank}
        bountiesCompletedCount={bountiesCompletedCount}
        bestiaryKills={bestiaryKills}
      />

      <LiminalStargateTransitModal
        isOpen={transitOpen}
        currentLevel={level}
        currentBiome={biomeKey}
        records={harmonyRecords}
        totalBreathingSec={totalBreathingSec}
        mazesClearedCount={activeHero.mazesCleared}
        themeIndex={stargateThemeIdx}
        onSelectThemeIndex={setStargateThemeIdx}
        onSaveHarmonyRecord={(attractionName, score, chainLen) => {
          const preset = SURREAL_THEMES[stargateThemeIdx % SURREAL_THEMES.length];
          const rec: HarmonyRecord = {
            id: `harm-${Date.now()}-${Math.random()}`,
            attractionName,
            score,
            dateString: new Date().toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            noteChainLength: chainLen,
            themePalette: preset.name,
          };
          setHarmonyRecords((prev) => [rec, ...prev.slice(0, 19)]);
        }}
        onAddBreathingSeconds={(sec) => {
          setTotalBreathingSec((s) => s + sec);
        }}
        onCompleteTransit={(chosenBiome: BiomeKey, rewards: TransitRewardPackage) => {
          setTransitOpen(false);
          setBiomeKey(chosenBiome);
          startMazeRun(level, difficulty);
          setCoins((c) => c + rewards.bonusGold);
          setCoinsEarnedRun((c) => c + rewards.bonusGold);
          setStarEnergy((e) => Math.min(5, e + rewards.bonusMana));
          setQuantumCharges((q) => q + rewards.bonusQuantumCharges);
          setPlayerHp((hp) =>
            Math.min(activeHero.hp + activeGuild.bonusHp + 35, hp + rewards.bonusHpHeal)
          );
          setActionLogMessage(
            `🌌 Stargate 4D-Транзит завершён! Вход в ${BIOMES[chosenBiome].titleRu}: +${rewards.bonusGold} 🪙, +${rewards.bonusMana} ⚡, +${rewards.bonusQuantumCharges} [Q], +${rewards.bonusHpHeal} ОЗ!`
          );
        }}
        onClose={() => setTransitOpen(false)}
      />

      <GitHubOmniMergeModal
        isOpen={omniModalOpen}
        onClose={() => setOmniModalOpen(false)}
        coins={coins}
        level={highLevel}
        heroes={savedHeroes}
        unlockedSkins={unlockedSkins}
        claimedAchievements={claimedAchievements}
        talentRanks={talentRanks}
        gameMode={gameMode}
        sectorAnomaly={sectorAnomaly}
        onSelectGameMode={setGameMode}
        onSelectAnomaly={setSectorAnomaly}
        onUpgradeTalent={handleUpgradeTalent}
        onApplyMergedProfile={handleApplyMergedProfile}
      />
    </div>
  );
}
