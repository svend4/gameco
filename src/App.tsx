import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BOSS_ROSTER,
  calculateHeroStats,
  DIFFICULTIES,
  DifficultyKey,
  ELEMENTAL_SPELLS,
  generateMaze,
  HeroAvatar,
  INITIAL_HERO_ROSTER,
  isWalkableTile,
  MazeData,
  MazeEnemy,
  Position,
  purchaseSkinTransaction,
  ROLE_METADATA,
  ShopSkin,
  stepEnemies,
} from './game/rules';
import { soundFX } from './game/sound';
import { EmojiAvatarCard } from './components/EmojiAvatarCard';
import { AvatarStudioModal } from './components/AvatarStudioModal';
import { ArenaBattleModal } from './components/ArenaBattleModal';
import { SynergyCodexModal } from './components/SynergyCodexModal';
import { Maze3DViewport } from './components/Maze3DViewport';

type ShellState = 'title' | 'playing' | 'paused' | 'gameover';
type ViewProjectionMode = '3d-chase' | '3d-diorama' | '2d-classic';

interface RunSummary {
  victory: boolean;
  levelCleared: number;
  starsCollected: number;
  totalStars: number;
  enemiesDefeated: number;
  coinsEarned: number;
  clearTimeSec: number;
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

  const activeHero =
    savedHeroes.find((h) => h.id === activeHeroId) || savedHeroes[0] || INITIAL_HERO_ROSTER[0];

  // Settings & Game State
  const [difficulty, setDifficulty] = useState<DifficultyKey>('EASY');
  const [scanlinesEnabled, setScanlinesEnabled] = useState<boolean>(false);
  const [enemiesEnabled, setEnemiesEnabled] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewProjectionMode>('3d-chase');
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

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
  const [starsRemaining, setStarsRemaining] = useState<Position[]>(() => maze.stars);
  const [chestsRemaining, setChestsRemaining] = useState<Position[]>(() => maze.chests);
  const [enemies, setEnemies] = useState<MazeEnemy[]>(() => maze.enemies);
  const [playerHp, setPlayerHp] = useState<number>(activeHero.hp);
  const [trailingHp, setTrailingHp] = useState<number>(activeHero.hp);
  const [starEnergy, setStarEnergy] = useState<number>(2);
  const [starsCollectedRun, setStarsCollectedRun] = useState<number>(0);
  const [enemiesDefeatedRun, setEnemiesDefeatedRun] = useState<number>(0);
  const [coinsEarnedRun, setCoinsEarnedRun] = useState<number>(0);
  const [actionLogMessage, setActionLogMessage] = useState<string>(
    '3D-Лабиринт: соберите ⭐ и сундуки 🎁, сразите стражей 👾 и дойдите до 3D-врат 🏁!'
  );
  const [boardShake, setBoardShake] = useState<boolean>(false);

  // Modals
  const [studioOpen, setStudioOpen] = useState<boolean>(false);
  const [studioInitialTab, setStudioInitialTab] = useState<'builder' | 'gallery' | 'shop'>('builder');
  const [codexOpen, setCodexOpen] = useState<boolean>(false);
  const [activeArenaEnemy, setActiveArenaEnemy] = useState<MazeEnemy | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const runStartTimeRef = useRef<number>(Date.now());
  const spawnGraceUntilRef = useRef<number>(Date.now() + 2500);

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
        })
      );
    } catch {}
  }, [coins, highLevel, unlockedSkins, savedHeroes, activeHeroId]);

  useEffect(() => {
    document.body.dataset.state = shellState;
  }, [shellState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTrailingHp(playerHp);
    }, 350);
    return () => clearTimeout(timer);
  }, [playerHp]);

  const triggerShake = () => {
    setBoardShake(true);
    setTimeout(() => setBoardShake(false), 220);
  };

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

      setMaze(nextMaze);
      setPlayerPos({ r: 1, c: 1 });
      setStarsRemaining(nextMaze.stars);
      setChestsRemaining(nextMaze.chests);
      setEnemies(nextMaze.enemies);
      setPlayerHp(activeHero.hp);
      setTrailingHp(activeHero.hp);
      setStarEnergy(2);
      setStarsCollectedRun(0);
      setEnemiesDefeatedRun(0);
      setCoinsEarnedRun(0);
      setActiveArenaEnemy(null);
      setRunSummary(null);
      setActionLogMessage(
        `Сектор #${targetLevel} (3D): соберите ${nextMaze.stars.length} ⭐ и найдите 3D-арку выхода 🏁!`
      );
      runStartTimeRef.current = Date.now();
      spawnGraceUntilRef.current = Date.now() + 2500;
      setShellState('playing');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
    [level, difficulty, enemiesEnabled, activeHero.hp]
  );

  const handleCompleteLevel = useCallback(
    (finalStarsCollected: number, totalStarsCount: number, currentCoinsEarned: number) => {
      soundFX.playVictory();
      const allStarsBonus = finalStarsCollected >= totalStarsCount ? 30 : 15;
      const totalRunCoins = currentCoinsEarned + allStarsBonus;
      const nextLevel = level + 1;
      const elapsedSec = Math.max(1, Math.round((Date.now() - runStartTimeRef.current) / 1000));

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
    [level, enemiesDefeatedRun, activeHero.id]
  );

  const movePlayer = useCallback(
    (dr: number, dc: number) => {
      if (
        shellState !== 'playing' ||
        activeArenaEnemy !== null ||
        studioOpen ||
        codexOpen
      ) {
        return;
      }

      const nr = playerPos.r + dr;
      const nc = playerPos.c + dc;

      if (!isWalkableTile(maze, nr, nc)) {
        setActionLogMessage('3D-стена лабиринта! Выберите открытый проход.');
        return;
      }

      soundFX.playStep();
      const nextPos = { r: nr, c: nc };
      setPlayerPos(nextPos);

      // 1. Check Star collection
      const hitStarIndex = starsRemaining.findIndex((s) => s.r === nr && s.c === nc);
      let updatedStarsCollected = starsCollectedRun;
      let updatedCoinsEarned = coinsEarnedRun;

      if (hitStarIndex !== -1) {
        soundFX.playStarCollect();
        const nextStars = starsRemaining.filter((_, idx) => idx !== hitStarIndex);
        setStarsRemaining(nextStars);
        updatedStarsCollected += 1;
        updatedCoinsEarned += 5;
        setStarsCollectedRun(updatedStarsCollected);
        setCoinsEarnedRun(updatedCoinsEarned);
        setCoins((c) => c + 5);
        setStarEnergy((e) => Math.min(5, e + 1));
        setPlayerHp((hp) => Math.min(activeHero.hp, hp + 6));
        triggerShake();
        setActionLogMessage(
          `Собрана 3D-звезда ⭐ (+5 🪙, +1 ⚡ заряд магии, +6 ОЗ)! Звёзд: ${updatedStarsCollected}/${maze.stars.length}`
        );
      }

      // 2. Check Treasure Chest collection
      const hitChestIndex = chestsRemaining.findIndex((c) => c.r === nr && c.c === nc);
      if (hitChestIndex !== -1) {
        soundFX.playStarCollect();
        const nextChests = chestsRemaining.filter((_, idx) => idx !== hitChestIndex);
        setChestsRemaining(nextChests);
        updatedCoinsEarned += 15;
        setCoinsEarnedRun(updatedCoinsEarned);
        setCoins((c) => c + 15);
        setStarEnergy((e) => Math.min(5, e + 2));
        setPlayerHp((hp) => Math.min(activeHero.hp, hp + 15));
        triggerShake();
        setActionLogMessage('Открыт 3D-сундук сокровищ 🎁 (+15 🪙, +2 ⚡ магии, +15 ОЗ)!');
      }

      // 3. Check Enemy collision -> launch RPG Arena Duel!
      const hitEnemy = enemies.find((e) => e.r === nr && e.c === nc);
      if (hitEnemy) {
        setActiveArenaEnemy(hitEnemy);
        setActionLogMessage(`Встреча с 3D-стражем ${hitEnemy.name}! Начинается RPG-дуэль!`);
        return;
      }

      // 4. Check Exit portal
      if (nr === maze.exit.r && nc === maze.exit.c) {
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
      starsRemaining,
      chestsRemaining,
      starsCollectedRun,
      coinsEarnedRun,
      enemies,
      activeHero.hp,
      handleCompleteLevel,
    ]
  );

  // Enemy autonomous patrolling loop in 3D Maze
  useEffect(() => {
    if (
      shellState !== 'playing' ||
      !enemiesEnabled ||
      activeArenaEnemy !== null ||
      studioOpen ||
      codexOpen
    ) {
      return;
    }

    const intervalMs = Math.max(480, 820 - level * 25);
    const timer = setInterval(() => {
      if (Date.now() < spawnGraceUntilRef.current) return;

      setEnemies((prevEnemies) => {
        if (prevEnemies.length === 0) return prevEnemies;
        const nextEnemies = stepEnemies(maze, prevEnemies, playerPos);
        const collided = nextEnemies.find((e) => e.r === playerPos.r && e.c === playerPos.c);
        if (collided) {
          setActiveArenaEnemy(collided);
          setActionLogMessage(`Страж ${collided.name} перехватил вас в 3D-коридоре!`);
        }
        return nextEnemies;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [shellState, enemiesEnabled, activeArenaEnemy, studioOpen, codexOpen, level, maze, playerPos]);

  // Global keyboard controls (WASD / Arrows / Enter / Space / P / R / M / H / C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (shellState === 'title') {
        if ((e.key === 'Enter' || e.key === ' ') && !studioOpen && !codexOpen) {
          e.preventDefault();
          startMazeRun(level, difficulty);
        }
        return;
      }

      if (e.key === 'Escape') {
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

      if (e.key.toLowerCase() === 'h' && shellState === 'playing' && !studioOpen && !codexOpen) {
        e.preventDefault();
        setDockCollapsed((c) => !c);
        return;
      }

      if (e.key.toLowerCase() === 'c' && shellState === 'playing' && !studioOpen && !codexOpen) {
        e.preventDefault();
        setViewMode((v) =>
          v === '3d-chase' ? '3d-diorama' : v === '3d-diorama' ? '2d-classic' : '3d-chase'
        );
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
    activeArenaEnemy,
    level,
    difficulty,
    startMazeRun,
    movePlayer,
  ]);

  const handleBattleResolved = (outcome: {
    won: boolean;
    remainingHp: number;
    rewardCoins: number;
    enemyId: string;
  }) => {
    setActiveArenaEnemy(null);
    if (outcome.won) {
      setPlayerHp(outcome.remainingHp);
      setCoins((c) => c + outcome.rewardCoins);
      setCoinsEarnedRun((c) => c + outcome.rewardCoins);
      setEnemiesDefeatedRun((d) => d + 1);
      setEnemies((prev) => prev.filter((e) => e.id !== outcome.enemyId));
      setSavedHeroes((prev) =>
        prev.map((h) => (h.id === activeHero.id ? { ...h, wins: h.wins + 1 } : h))
      );
      setActionLogMessage(
        `Победа на RPG-Арене! +${outcome.rewardCoins} 🪙. 3D-проход к вратам 🏁 свободен!`
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

  const handleArenaRetreat = (remainingHp: number) => {
    setActiveArenaEnemy(null);
    setPlayerHp(remainingHp);
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
            h.backgroundStyle
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

  const hpPercent = Math.max(0, Math.min(100, (playerHp / activeHero.hp) * 100));
  const trailingHpPercent = Math.max(0, Math.min(100, (trailingHp / activeHero.hp) * 100));

  return (
    <div
      className={`relative min-h-screen w-full bg-[#130E24] text-[#F8F5FF] flex flex-col justify-between overflow-hidden ${
        scanlinesEnabled ? 'crt-scanlines' : ''
      }`}
    >
      {/* =========================================================
          1. TITLE SCREEN STAGE (Interactive 3D Hero Showcase)
         ========================================================= */}
      {shellState === 'title' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-6xl w-full mx-auto px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-purple-300/15 pb-4">
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
                  3D WebGL Labyrinth × Emoji Avatar Studio · Полное 3D-издание
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5 text-sm font-mono-tabular">
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">МОНЕТЫ:</span>
                <span className="font-bold text-amber-300">🪙 {coins}</span>
              </div>
              <span aria-hidden="true" className="text-purple-400/40">
                ·
              </span>
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">МАКС. СЕКТОР:</span>
                <span className="font-bold text-emerald-300">УР. {highLevel}</span>
              </div>
              <span aria-hidden="true" className="text-purple-400/40">
                ·
              </span>
              <div>
                <span className="text-purple-300/75 text-xs mr-1.5">СКИНЫ:</span>
                <span className="font-bold text-purple-200">{unlockedSkins.length}/19</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2.5">
                <h2
                  style={{ textWrap: 'balance' }}
                  className="text-3xl sm:text-5xl font-extrabold text-white leading-[1.1] tracking-tight"
                >
                  Создай 3D-Героя, Исследуй 3D-Лабиринт и Срази Боссов
                </h2>
                <p className="text-sm sm:text-base text-purple-200/85 max-w-xl leading-relaxed">
                  Соберите голографическую 3D-карточку бойца, отправляйтесь в трёхмерный WebGL-лабиринт с динамическим освещением за кристаллами звёзд ⭐ и сундуками 🎁, и побеждайте стражей 👾 на RPG-Арене.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-purple-200">
                  Размер и сложность 3D-лабиринта:
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['EASY', 'MEDIUM', 'HARD'] as DifficultyKey[]).map((key) => {
                    const cfg = DIFFICULTIES[key];
                    const selected = difficulty === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDifficulty(key)}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          selected
                            ? 'bg-purple-600/35 border-purple-400 text-white shadow-md'
                            : 'bg-[#1D1636] border-purple-300/15 text-purple-200 hover:bg-purple-900/30'
                        }`}
                      >
                        <div className="text-sm font-bold whitespace-nowrap">{cfg.label}</div>
                        <div className="text-[11px] text-purple-200/75 mt-0.5">{cfg.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((v) => (v === '3d-chase' ? '3d-diorama' : '3d-chase'))
                  }
                  className="px-3.5 py-2 rounded-xl border bg-cyan-500/20 border-cyan-400/40 text-cyan-200 text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  {viewMode === '3d-chase'
                    ? '🎥 Камера: 3D От 3-го лица (Chase)'
                    : '🦅 Камера: 3D Диорама Лабиринта'}
                </button>

                <button
                  type="button"
                  onClick={() => setEnemiesEnabled((v) => !v)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                    enemiesEnabled
                      ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                      : 'bg-[#1D1636] border-purple-300/15 text-purple-300'
                  }`}
                >
                  {enemiesEnabled ? '👾 3D-Стражи: ВКЛ' : '👾 3D-Стражи: ВЫКЛ'}
                </button>
              </div>

              {/* Single-row Primary CTA & Studio Actions */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 pt-1">
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
                  🛠️ 3D-Студия ({savedHeroes.length})
                </button>

                <button
                  type="button"
                  onClick={() => setCodexOpen(true)}
                  className="px-4 py-3.5 rounded-2xl bg-[#1D1636] hover:bg-[#281E4B] border border-purple-300/20 text-purple-200 font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  📖 Сравнение 2 Игр
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#1C1533] border border-purple-300/20 rounded-3xl p-6 shadow-2xl">
              <div className="text-xs font-semibold text-purple-300 mb-3">
                Активный 3D-Боец (наведите для 3D-параллакса)
              </div>

              <EmojiAvatarCard
                baseEmoji={activeHero.baseEmoji}
                accessoryEmoji={activeHero.accessoryEmoji}
                flagEmoji={activeHero.flagEmoji}
                bgStyle={activeHero.backgroundStyle}
                role={activeHero.characterRole}
                sizePx={184}
                hasGlow={true}
                testId="title-hero-card"
              />

              <div className="mt-4 text-center">
                <div className="text-lg font-extrabold text-white">{activeHero.name}</div>
                <div className="text-xs text-purple-300/85 mt-0.5">
                  {ROLE_METADATA[activeHero.characterRole].titleRu} ·{' '}
                  {ELEMENTAL_SPELLS[activeHero.backgroundStyle].spellName}
                </div>
              </div>

              <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-purple-300/15 text-center font-mono-tabular">
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
                  setStudioInitialTab('shop');
                  setStudioOpen(true);
                }}
                className="mt-4 w-full py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-xs font-bold text-purple-100 transition-colors"
              >
                Сменить Скин или Настроить 3D-Карточку →
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-purple-300/70 pt-2">
            WASD / Стрелки / Клик по 3D-плитке — Шаг · C — Смена 3D-камеры · H — Скрыть панель · P — Пауза
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
                playerPos={playerPos}
                starsRemaining={starsRemaining}
                chestsRemaining={chestsRemaining}
                enemies={enemies}
                activeHero={activeHero}
                cameraMode={viewMode === '3d-chase' ? 'chase' : 'diorama'}
                boardShake={boardShake}
                onMoveStep={movePlayer}
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
                            {isExit && !isPlayer && '🏁'}
                            {isStar && !isPlayer && '⭐'}
                            {isChest && !isPlayer && '🎁'}
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
                    <div className="text-[11px] text-purple-300">
                      СЕКТОР #{level} · 3D LABYRINTH
                    </div>
                  </div>
                </button>

                <div className="w-32 sm:w-40">
                  <div className="flex items-center justify-between text-[11px] font-mono-tabular mb-0.5">
                    <span className="font-bold text-rose-300">ОЗ</span>
                    <span className="font-bold text-white">
                      {Math.round(playerHp)}/{activeHero.hp}
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
              <div className="flex items-center gap-4 font-mono-tabular">
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
                <div className="text-center">
                  <div className="text-[10px] text-purple-300">СТРАЖИ</div>
                  <div className="text-sm font-extrabold text-rose-300">👾 {enemies.length}</div>
                </div>
              </div>

              {/* Top-Right Compact Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setStudioInitialTab('shop');
                    setStudioOpen(true);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-600/35 hover:bg-purple-600/55 border border-purple-400/40 text-xs font-bold text-purple-100 whitespace-nowrap"
                >
                  🛠️ 3D-Студия
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
                      <button
                        type="button"
                        onClick={() => setViewMode('3d-chase')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                          viewMode === '3d-chase'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/15'
                        }`}
                      >
                        🎥 3D Вслед
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('3d-diorama')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                          viewMode === '3d-diorama'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/15'
                        }`}
                      >
                        🦅 3D Диорама
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('2d-classic')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                          viewMode === '2d-classic'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/15'
                        }`}
                      >
                        🗺️ 2D Сетка
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
                Сектор лабиринта #{level} · Герой: {activeHero.name}
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
                  {playerHp}/{activeHero.hp}
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
          4. VICTORY / GAME OVER MODAL ('gameover')
         ========================================================= */}
      {shellState === 'gameover' && runSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={runSummary.victory ? 'Уровень Пройден' : 'Поражение'}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="w-full max-w-md bg-[#1C1533] border-2 border-purple-400/50 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="text-5xl">{runSummary.victory ? '🏆' : '💀'}</div>
            <div>
              <h2 className="text-2xl font-extrabold text-white">
                {runSummary.victory
                  ? `3D-Сектор #${runSummary.levelCleared} Очищен!`
                  : 'Герой Пал в 3D-Лабиринте'}
              </h2>
              <p className="text-xs text-purple-200/80 mt-1">
                {runSummary.victory
                  ? runSummary.starsCollected >= runSummary.totalStars
                    ? 'Идеальное прохождение! Собраны все звёзды (+30 бонусных монет)!'
                    : 'Вы успешно достигли 3D-арки выхода 🏁 (+15 бонусных монет)!'
                  : 'Стражи лабиринта оказались сильнее. Улучшите билд в 3D-Студии и попробуйте снова!'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono-tabular">
              <div className="p-3 rounded-2xl bg-[#130E24] border border-purple-300/15">
                <div className="text-[11px] text-purple-300">ЗВЁЗДЫ</div>
                <div className="text-lg font-extrabold text-amber-300">
                  ⭐ {runSummary.starsCollected}/{runSummary.totalStars}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#130E24] border border-purple-300/15">
                <div className="text-[11px] text-purple-300">ДОБЫТО</div>
                <div className="text-lg font-extrabold text-emerald-300">
                  +{runSummary.coinsEarned} 🪙
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#130E24] border border-purple-300/15">
                <div className="text-[11px] text-purple-300">ВРЕМЯ</div>
                <div className="text-lg font-extrabold text-white">
                  {runSummary.clearTimeSec}с
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                data-start="true"
                onClick={() => startMazeRun(level, difficulty)}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-lg transition-colors"
              >
                {runSummary.victory
                  ? `🚀 Следующий 3D-Лабиринт (#${level}) →`
                  : '🔄 Попробовать Снова'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShellState('title');
                  setStudioInitialTab('shop');
                  setStudioOpen(true);
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-purple-100 font-bold text-sm transition-colors"
              >
                🛠️ Открыть 3D-Студию и Магазин Скинов
              </button>
              <button
                type="button"
                onClick={() => setShellState('title')}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-purple-200 font-semibold text-xs transition-colors"
              >
                🏠 Вернуться на Титульный Экран
              </button>
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
        playerHp={playerHp}
        playerMaxHp={activeHero.hp}
        initialStarEnergy={starEnergy}
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
        coins={coins}
        unlockedSkins={unlockedSkins}
        onPurchaseOrEquipSkin={handlePurchaseOrEquipSkin}
        initialTab={studioInitialTab}
      />

      <SynergyCodexModal isOpen={codexOpen} onClose={() => setCodexOpen(false)} />
    </div>
  );
}
