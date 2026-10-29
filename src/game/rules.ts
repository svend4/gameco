export type TileType = 'WALL' | 'PATH' | 'STAR' | 'START' | 'EXIT';

export type DifficultyKey = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  key: DifficultyKey;
  label: string;
  subtitle: string;
  rows: number;
  cols: number;
  starCount: number;
  enemyCount: number;
}

export const DIFFICULTIES: Record<DifficultyKey, DifficultyConfig> = {
  EASY: {
    key: 'EASY',
    label: 'Классика 9×9',
    subtitle: '4 звезды · 2 стража',
    rows: 9,
    cols: 9,
    starCount: 4,
    enemyCount: 2,
  },
  MEDIUM: {
    key: 'MEDIUM',
    label: 'Медиум 13×13',
    subtitle: '6 звёзд · 3 стража',
    rows: 13,
    cols: 13,
    starCount: 6,
    enemyCount: 3,
  },
  HARD: {
    key: 'HARD',
    label: 'Ретро 15×15',
    subtitle: '9 звёзд · 4 стража',
    rows: 15,
    cols: 15,
    starCount: 9,
    enemyCount: 4,
  },
};

export type BackgroundStyle = 'Cosmic' | 'Neon' | 'Ocean' | 'Forest' | 'Gold';

export type CharacterRole = 'Knight' | 'Mage' | 'Cyber-Ninja' | 'Chef' | 'Astronaut';

export interface HeroAvatar {
  id: string;
  name: string;
  baseEmoji: string;
  accessoryEmoji: string;
  flagEmoji: string;
  backgroundStyle: BackgroundStyle;
  characterRole: CharacterRole;
  hp: number;
  attack: number;
  defense: number;
  wins: number;
  mazesCleared: number;
}

export interface ShopSkin {
  emoji: string;
  name: string;
  cost: number;
  category: 'Smiley' | 'Retro' | 'Animals' | 'Love/Items';
  bonusStat: string;
}

export const SHOP_SKINS_CATALOG: ShopSkin[] = [
  { emoji: '😀', name: 'Happy Smiley', cost: 0, category: 'Smiley', bonusStat: '+2 ОЗ' },
  { emoji: '🦊', name: 'Cyber Fox', cost: 0, category: 'Animals', bonusStat: '+3 АТК' },
  { emoji: '😎', name: 'Cool Neon', cost: 15, category: 'Smiley', bonusStat: '+4 АТК' },
  { emoji: '❤️', name: 'Retro Heart', cost: 20, category: 'Love/Items', bonusStat: '+12 ОЗ' },
  { emoji: '🐱', name: 'Neko Kitty', cost: 25, category: 'Animals', bonusStat: '+3 ЗАЩ' },
  { emoji: '🤠', name: 'Retro Cowboy', cost: 30, category: 'Smiley', bonusStat: '+5 АТК' },
  { emoji: '👾', name: 'Space Invader', cost: 40, category: 'Retro', bonusStat: '+6 АТК' },
  { emoji: '🐸', name: 'Crono Frog', cost: 45, category: 'Animals', bonusStat: '+5 ЗАЩ' },
  { emoji: '🤡', name: 'Arcade Clown', cost: 50, category: 'Smiley', bonusStat: '+10 ОЗ' },
  { emoji: '💖', name: 'Vibrant Heart', cost: 55, category: 'Love/Items', bonusStat: '+18 ОЗ' },
  { emoji: '🤖', name: 'Robo Pixel', cost: 60, category: 'Retro', bonusStat: '+7 ЗАЩ' },
  { emoji: '🍕', name: 'Pixel Pizza', cost: 70, category: 'Love/Items', bonusStat: '+15 ОЗ' },
  { emoji: '🐙', name: 'Oishi Octopus', cost: 75, category: 'Animals', bonusStat: '+6 АТК' },
  { emoji: '🦄', name: 'Dream Unicorn', cost: 100, category: 'Animals', bonusStat: '+8 АТК' },
  { emoji: '💎', name: 'Classic Gem', cost: 110, category: 'Love/Items', bonusStat: '+9 ЗАЩ' },
  { emoji: '👽', name: 'Cosmic Alien', cost: 120, category: 'Retro', bonusStat: '+9 АТК' },
  { emoji: '🐉', name: 'Dragon Quest', cost: 150, category: 'Animals', bonusStat: '+12 АТК' },
  { emoji: '🔮', name: 'Magic Orb', cost: 180, category: 'Retro', bonusStat: '+11 АТК' },
  { emoji: '🏁', name: 'Checker Finish', cost: 200, category: 'Love/Items', bonusStat: '+15 ОЗ / +8 АТК' },
];

export const BASE_EMOJI_OPTIONS = [
  '🦊', '🤠', '😎', '🤖', '👽', '👾', '🦄', '🐉', '🦁', '🐯', '🐼', '🐨', '🐱', '🐸', '🐙', '😀', '🤡', '🦉', '🐧', '🔮'
];

export const ACCESSORY_EMOJI_OPTIONS = [
  '👑', '⚔️', '🛡️', '🕶️', '🎧', '🎩', '🔥', '⚡', '❄️', '💎', '🚀', '🎸', '🎒', '🍀', '🎨', '✨'
];

export const FLAG_EMOJI_OPTIONS = [
  '🏁', '🏴‍☠️', '🌌', '🔮', '✨', '❤️', '🔥', '🌈', '🎖️', '🌍', '🚩', '🏳️‍🌈', '⚡'
];

export const ROLE_METADATA: Record<CharacterRole, { titleRu: string; badge: string; baseHp: number; baseAtk: number; baseDef: number; desc: string }> = {
  'Knight': {
    titleRu: '🛡️ Рыцарь',
    badge: 'Танк Лабиринта',
    baseHp: 140,
    baseAtk: 18,
    baseDef: 30,
    desc: 'Высокая броня и живучесть в схватках со стражами',
  },
  'Mage': {
    titleRu: '🔮 Маг',
    badge: 'Мастер Стихий',
    baseHp: 95,
    baseAtk: 35,
    baseDef: 14,
    desc: 'Сокрушительный урон заклинаниями Unicode',
  },
  'Cyber-Ninja': {
    titleRu: '🥷 Кибер-Ниндзя',
    badge: 'Тень Сетки',
    baseHp: 115,
    baseAtk: 28,
    baseDef: 19,
    desc: 'Сбалансированный крит-боец с быстрой реакцией',
  },
  'Chef': {
    titleRu: '👨‍🍳 Шеф-Повар',
    badge: 'Алхимик Звёзд',
    baseHp: 150,
    baseAtk: 16,
    baseDef: 22,
    desc: 'Огромный запас здоровья и усиленное исцеление',
  },
  'Astronaut': {
    titleRu: '👩‍🚀 Астронавт',
    badge: 'Исследователь ЭЛТ',
    baseHp: 125,
    baseAtk: 23,
    baseDef: 25,
    desc: 'Универсальный первопроходец глубоких секторов',
  },
};

export const ELEMENTAL_SPELLS: Record<BackgroundStyle, { title: string; spellName: string; emoji: string; bonusDesc: string }> = {
  Cosmic: {
    title: '🌌 Космос',
    spellName: '🌌 Вспышка Сверхновой',
    emoji: '🌌',
    bonusDesc: 'Пробивает защиту босса космическим излучением',
  },
  Neon: {
    title: '⚡ Неон',
    spellName: '⚡ Лазерный Импульс',
    emoji: '⚡',
    bonusDesc: 'Высокий шанс критического разряда по цепи',
  },
  Ocean: {
    title: '🌊 Океан',
    spellName: '🌊 Цунами Unicode',
    emoji: '🌊',
    bonusDesc: 'Мощная волна урона + охлаждение атаки врага',
  },
  Forest: {
    title: '🍃 Лес',
    spellName: '🍃 Дыхание Природы',
    emoji: '🍃',
    bonusDesc: 'Наносит урон и восстанавливает +12 ОЗ герою',
  },
  Gold: {
    title: '✨ Золото',
    spellName: '✨ Золотой Метеорит',
    emoji: '✨',
    bonusDesc: 'Взрывной урон и +5 бонусных монет за удар',
  },
};

export function deterministicStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Exact RPG Stat formula ported from Emoji Avatar Studio's AvatarViewModel.kt
 */
export function calculateHeroStats(
  role: CharacterRole,
  baseEmoji: string,
  accessoryEmoji: string,
  backgroundStyle: BackgroundStyle
): { hp: number; attack: number; defense: number } {
  const meta = ROLE_METADATA[role] ?? ROLE_METADATA['Cyber-Ninja'];
  const hpBonus = deterministicStringHash(baseEmoji) % 15;
  const atkBonus = deterministicStringHash(accessoryEmoji) % 8;
  const defBonus = deterministicStringHash(backgroundStyle) % 6;

  return {
    hp: meta.baseHp + hpBonus,
    attack: meta.baseAtk + atkBonus,
    defense: meta.baseDef + defBonus,
  };
}

export interface Position {
  r: number;
  c: number;
}

export type EnemyPolicy = 'CHASER' | 'PATROLLER' | 'GUARDIAN';

export interface MazeEnemy {
  id: string;
  r: number;
  c: number;
  emoji: string;
  name: string;
  policy: EnemyPolicy;
  patrolDir: { dr: number; dc: number };
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  rewardCoins: number;
  telegraphing: boolean;
}

export interface MazeData {
  rows: number;
  cols: number;
  grid: TileType[][];
  stars: Position[];
  chests: Position[];
  enemies: MazeEnemy[];
  start: Position;
  exit: Position;
}

export const BOSS_ROSTER = [
  { name: '👾 Инопланетный Слизень', emoji: '👾', policy: 'PATROLLER' as EnemyPolicy, hp: 115, atk: 20, def: 10, reward: 25 },
  { name: '👻 Фантом ЭЛТ-Лабиринта', emoji: '👻', policy: 'CHASER' as EnemyPolicy, hp: 105, atk: 22, def: 8, reward: 25 },
  { name: '🐉 Древний Пиксель-Дракон', emoji: '🐉', policy: 'GUARDIAN' as EnemyPolicy, hp: 155, atk: 26, def: 14, reward: 40 },
  { name: '🤖 Меха-Страж Врат', emoji: '🤖', policy: 'GUARDIAN' as EnemyPolicy, hp: 140, atk: 24, def: 16, reward: 35 },
  { name: '😈 Кибер-Демон Ядра', emoji: '😈', policy: 'CHASER' as EnemyPolicy, hp: 130, atk: 25, def: 12, reward: 30 },
];

/**
 * Generates a procedural odd-dimension maze using DFS carving (ported from MazeGenerator.kt)
 * plus guaranteed open spawn corridors so the player is never trapped at spawn.
 */
export function generateMaze(
  rawRows: number,
  rawCols: number,
  starCount: number,
  enemyCount: number,
  level: number = 1,
  rng: () => number = Math.random
): MazeData {
  const rCount = rawRows % 2 === 0 ? rawRows + 1 : rawRows;
  const cCount = rawCols % 2 === 0 ? rawCols + 1 : rawCols;

  const grid: TileType[][] = Array.from({ length: rCount }, () =>
    Array.from({ length: cCount }, () => 'WALL' as TileType)
  );
  const visited: boolean[][] = Array.from({ length: rCount }, () =>
    Array.from({ length: cCount }, () => false)
  );

  const isInBounds = (r: number, c: number) =>
    r >= 1 && r < rCount - 1 && c >= 1 && c < cCount - 1;

  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const dfs = (r: number, c: number) => {
    visited[r][c] = true;
    grid[r][c] = 'PATH';
    const dirs = shuffle([
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ]);
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (isInBounds(nr, nc) && !visited[nr][nc]) {
        grid[r + dr / 2][c + dc / 2] = 'PATH';
        grid[nr][nc] = 'PATH';
        dfs(nr, nc);
      }
    }
  };

  dfs(1, 1);

  // Ensure start (1,1) has both (1,2) and (2,1) open so player has immediate breathing room
  if (cCount > 3) grid[1][2] = 'PATH';
  if (rCount > 3) grid[2][1] = 'PATH';

  // Carve a few extra loops (braid passages) so the player can outmaneuver ghosts tactically
  for (let r = 2; r < rCount - 2; r += 2) {
    for (let c = 2; c < cCount - 2; c += 2) {
      if (grid[r][c] === 'WALL' && rng() < 0.25) {
        grid[r][c] = 'PATH';
      }
    }
  }

  const start: Position = { r: 1, c: 1 };
  const exit: Position = { r: rCount - 2, c: cCount - 2 };
  grid[start.r][start.c] = 'START';
  grid[exit.r][exit.c] = 'EXIT';
  // Ensure exit is reachable from at least one adjacent cell
  if (grid[exit.r - 1][exit.c] === 'WALL' && grid[exit.r][exit.c - 1] === 'WALL') {
    grid[exit.r - 1][exit.c] = 'PATH';
  }

  const walkableSpots: Position[] = [];
  for (let r = 1; r < rCount - 1; r++) {
    for (let c = 1; c < cCount - 1; c++) {
      if (
        grid[r][c] === 'PATH' &&
        !(r === start.r && c === start.c) &&
        !(r === exit.r && c === exit.c)
      ) {
        walkableSpots.push({ r, c });
      }
    }
  }

  const shuffledForStars = shuffle(walkableSpots);
  const stars: Position[] = shuffledForStars.slice(0, Math.min(starCount, shuffledForStars.length));
  for (const s of stars) {
    grid[s.r][s.c] = 'STAR';
  }

  const remainingForChests = shuffledForStars.slice(stars.length);
  const chestCount = rawRows >= 13 ? 2 : 1;
  const chests: Position[] = remainingForChests.slice(0, Math.min(chestCount, remainingForChests.length));
  for (const ch of chests) {
    grid[ch.r][ch.c] = 'CHEST';
  }

  // Place enemies at Manhattan distance >= 4 from start (1,1)
  const farSpots = shuffle(
    walkableSpots.filter((p) => p.r + p.c >= 6 && !(p.r === exit.r && p.c === exit.c))
  );

  const policies: EnemyPolicy[] = ['CHASER', 'PATROLLER', 'GUARDIAN'];
  const actualEnemyCount = Math.min(enemyCount, farSpots.length);
  const enemies: MazeEnemy[] = [];

  for (let i = 0; i < actualEnemyCount; i++) {
    const pos = farSpots[i];
    const policy = policies[i % policies.length];
    const template =
      policy === 'CHASER'
        ? BOSS_ROSTER[1]
        : policy === 'PATROLLER'
        ? BOSS_ROSTER[0]
        : BOSS_ROSTER[2 + (i % 2)];

    const scale = 1 + (level - 1) * 0.08;
    enemies.push({
      id: `enemy-${level}-${i}`,
      r: pos.r,
      c: pos.c,
      emoji: template.emoji,
      name: template.name,
      policy,
      patrolDir: i % 2 === 0 ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 },
      maxHp: Math.round(template.hp * scale),
      hp: Math.round(template.hp * scale),
      attack: Math.round(template.atk * scale),
      defense: Math.round(template.def * scale),
      rewardCoins: template.reward + (level - 1) * 5,
      telegraphing: false,
    });
  }

  return {
    rows: rCount,
    cols: cCount,
    grid,
    stars,
    chests,
    enemies,
    start,
    exit,
  };
}

export function isWalkableTile(maze: MazeData, r: number, c: number): boolean {
  if (r < 0 || r >= maze.rows || c < 0 || c >= maze.cols) return false;
  return maze.grid[r][c] !== 'WALL';
}

/**
 * Steps all maze enemies using 3 genuinely distinct AI movement policies:
 * 1. CHASER (👻): Actively seeks the player when within Manhattan distance <= 6, else wanders.
 * 2. PATROLLER (👾): Marches along corridors in a steady direction, reversing or turning at walls.
 * 3. GUARDIAN (🐉/🤖): Orbits/patrols near the exit portal (bottom-right quadrant) to guard the finish flag.
 */
export function stepEnemies(
  maze: MazeData,
  enemies: MazeEnemy[],
  playerPos: Position,
  rng: () => number = Math.random
): MazeEnemy[] {
  const dirs = [
    { dr: -1, dc: 0 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: 0, dc: 1 },
  ];

  return enemies.map((enemy) => {
    const validNeighbors = dirs
      .map((d) => ({ r: enemy.r + d.dr, c: enemy.c + d.dc, dr: d.dr, dc: d.dc }))
      .filter((n) => isWalkableTile(maze, n.r, n.c));

    if (validNeighbors.length === 0) return enemy;

    let chosen = validNeighbors[0];
    let nextPatrolDir = enemy.patrolDir;

    if (enemy.policy === 'CHASER') {
      const distToPlayer = Math.abs(enemy.r - playerPos.r) + Math.abs(enemy.c - playerPos.c);
      if (distToPlayer <= 6 || rng() < 0.45) {
        chosen = validNeighbors.reduce((best, curr) => {
          const bestDist = Math.abs(best.r - playerPos.r) + Math.abs(best.c - playerPos.c);
          const currDist = Math.abs(curr.r - playerPos.r) + Math.abs(curr.c - playerPos.c);
          return currDist < bestDist ? curr : best;
        }, validNeighbors[0]);
      } else {
        chosen = validNeighbors[Math.floor(rng() * validNeighbors.length)];
      }
    } else if (enemy.policy === 'PATROLLER') {
      const forward = validNeighbors.find(
        (n) => n.dr === enemy.patrolDir.dr && n.dc === enemy.patrolDir.dc
      );
      if (forward) {
        chosen = forward;
      } else {
        const reverse = validNeighbors.find(
          (n) => n.dr === -enemy.patrolDir.dr && n.dc === -enemy.patrolDir.dc
        );
        const sideOptions = validNeighbors.filter(
          (n) => !(n.dr === -enemy.patrolDir.dr && n.dc === -enemy.patrolDir.dc)
        );
        if (sideOptions.length > 0) {
          chosen = sideOptions[Math.floor(rng() * sideOptions.length)];
        } else if (reverse) {
          chosen = reverse;
        } else {
          chosen = validNeighbors[0];
        }
        nextPatrolDir = { dr: chosen.dr, dc: chosen.dc };
      }
    } else {
      // GUARDIAN: Stays close to the exit portal unless player is within 3 tiles
      const distToPlayer = Math.abs(enemy.r - playerPos.r) + Math.abs(enemy.c - playerPos.c);
      const target = distToPlayer <= 3 ? playerPos : maze.exit;
      chosen = validNeighbors.reduce((best, curr) => {
        const bestDist = Math.abs(best.r - target.r) + Math.abs(best.c - target.c);
        const currDist = Math.abs(curr.r - target.r) + Math.abs(curr.c - target.c);
        return currDist <= bestDist ? curr : best;
      }, validNeighbors[0]);
    }

    const newDistToPlayer = Math.abs(chosen.r - playerPos.r) + Math.abs(chosen.c - playerPos.c);
    return {
      ...enemy,
      r: chosen.r,
      c: chosen.c,
      patrolDir: nextPatrolDir,
      telegraphing: newDistToPlayer <= 2,
    };
  });
}

/**
 * Combat math ported from Emoji Avatar Studio's AvatarViewModel.kt
 */
export function calculateAttackDamage(
  attackerAtk: number,
  defenderDef: number,
  critChance: number = 0.2,
  rng: () => number = Math.random
): { damage: number; isCrit: boolean } {
  const isCrit = rng() < critChance;
  const baseDmg = Math.max(8, Math.floor(attackerAtk - defenderDef * 0.25));
  const variance = 1 + Math.floor(rng() * 7);
  let damage = baseDmg + variance;
  if (isCrit) {
    damage = Math.floor(damage * 1.5);
  }
  return { damage, isCrit };
}

export function calculateSpecialSpellOutcome(
  hero: HeroAvatar,
  rng: () => number = Math.random
): {
  spellName: string;
  damage: number;
  selfHeal: number;
  bonusCoins: number;
} {
  const spellMeta = ELEMENTAL_SPELLS[hero.backgroundStyle] ?? ELEMENTAL_SPELLS.Cosmic;
  const extra = 15 + Math.floor(rng() * 15);
  const damage = hero.attack + extra;
  const selfHeal = hero.backgroundStyle === 'Forest' ? 12 : 0;
  const bonusCoins = hero.backgroundStyle === 'Gold' ? 5 : 0;

  return {
    spellName: spellMeta.spellName,
    damage,
    selfHeal,
    bonusCoins,
  };
}

export function calculateHealAmount(
  role: CharacterRole,
  rng: () => number = Math.random
): number {
  const baseHeal = role === 'Chef' ? 34 : 25;
  const factor = 5 + Math.floor(rng() * 10);
  return baseHeal + factor;
}

export function purchaseSkinTransaction(
  coins: number,
  unlockedSkins: string[],
  skin: ShopSkin
): { success: boolean; nextCoins: number; nextUnlocked: string[] } {
  if (unlockedSkins.includes(skin.emoji)) {
    return { success: true, nextCoins: coins, nextUnlocked: unlockedSkins };
  }
  if (coins < skin.cost) {
    return { success: false, nextCoins: coins, nextUnlocked: unlockedSkins };
  }
  return {
    success: true,
    nextCoins: coins - skin.cost,
    nextUnlocked: [...unlockedSkins, skin.emoji],
  };
}

export const INITIAL_HERO_ROSTER: HeroAvatar[] = [
  {
    id: 'hero-cyber-fox',
    name: 'Кибер-Лис Неон',
    baseEmoji: '🦊',
    accessoryEmoji: '👑',
    flagEmoji: '🏁',
    backgroundStyle: 'Cosmic',
    characterRole: 'Cyber-Ninja',
    ...calculateHeroStats('Cyber-Ninja', '🦊', '👑', 'Cosmic'),
    wins: 3,
    mazesCleared: 2,
  },
  {
    id: 'hero-retro-cowboy',
    name: 'Звёздный Шериф',
    baseEmoji: '🤠',
    accessoryEmoji: '⚔️',
    flagEmoji: '🏴‍☠️',
    backgroundStyle: 'Gold',
    characterRole: 'Knight',
    ...calculateHeroStats('Knight', '🤠', '⚔️', 'Gold'),
    wins: 2,
    mazesCleared: 4,
  },
  {
    id: 'hero-arcane-dragon',
    name: 'Древний Архимаг',
    baseEmoji: '🐉',
    accessoryEmoji: '💎',
    flagEmoji: '🌌',
    backgroundStyle: 'Neon',
    characterRole: 'Mage',
    ...calculateHeroStats('Mage', '🐉', '💎', 'Neon'),
    wins: 5,
    mazesCleared: 3,
  },
];
