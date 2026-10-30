export type TileType = 'WALL' | 'PATH' | 'STAR' | 'CHEST' | 'START' | 'EXIT';

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
    label: 'Ретро 17×17',
    subtitle: '9 звёзд · 4 стража',
    rows: 17,
    cols: 17,
    starCount: 9,
    enemyCount: 4,
  },
};

export type BackgroundStyle = 'Cosmic' | 'Neon' | 'Ocean' | 'Forest' | 'Gold';

export type CharacterRole = 'Knight' | 'Mage' | 'Cyber-Ninja' | 'Chef' | 'Astronaut';

export type BiomeKey = 'CYBER_NEON' | 'MEDIEVAL_CITADEL' | 'SUNKEN_ATLANTIS' | 'SOLAR_SUPERNOVA';

export interface BiomeDefinition {
  key: BiomeKey;
  titleRu: string;
  subtitleRu: string;
  emoji: string;
  skyHex: number;
  fogHex: number;
  fogDensity: number;
  floorFill: string;
  floorStroke: string;
  wallFill: string;
  wallStroke: string;
  capHex: number;
  borderTintHex: number;
  innerTintHex: number;
  keyLightHex: number;
  rimLightHex: number;
  torchlightRadius?: number;
}

export const BIOMES: Record<BiomeKey, BiomeDefinition> = {
  CYBER_NEON: {
    key: 'CYBER_NEON',
    titleRu: '⚡ Кибер-Неон',
    subtitleRu: 'Голографический сектор ЭЛТ-ядра',
    emoji: '⚡',
    skyHex: 0x130e24,
    fogHex: 0x130e24,
    fogDensity: 0.018,
    floorFill: '#1b152c',
    floorStroke: '#36295a',
    wallFill: '#38324c',
    wallStroke: '#252036',
    capHex: 0x7c3aed,
    borderTintHex: 0x9f85e8,
    innerTintHex: 0xc4b5fd,
    keyLightHex: 0xffe8c2,
    rimLightHex: 0x38bdf8,
  },
  MEDIEVAL_CITADEL: {
    key: 'MEDIEVAL_CITADEL',
    titleRu: '🏰 Средневековая Цитадель',
    subtitleRu: 'Каменный бастион с факелами и тайными вратами',
    emoji: '🏰',
    skyHex: 0x0e0a08,
    fogHex: 0x0e0a08,
    fogDensity: 0.042,
    floorFill: '#241c18',
    floorStroke: '#46352b',
    wallFill: '#4a3b32',
    wallStroke: '#291f1a',
    capHex: 0xd97706,
    borderTintHex: 0xa88b73,
    innerTintHex: 0xd6bfa9,
    keyLightHex: 0xffb366,
    rimLightHex: 0xf59e0b,
    torchlightRadius: 16,
  },
  SUNKEN_ATLANTIS: {
    key: 'SUNKEN_ATLANTIS',
    titleRu: '🌊 Затопленная Атлантида',
    subtitleRu: 'Аквамариновые руины и биолюминесцентные кристаллы',
    emoji: '🌊',
    skyHex: 0x061826,
    fogHex: 0x061826,
    fogDensity: 0.024,
    floorFill: '#0c273d',
    floorStroke: '#1a4f78',
    wallFill: '#164663',
    wallStroke: '#0b293b',
    capHex: 0x06b6d4,
    borderTintHex: 0x38bdf8,
    innerTintHex: 0x7dd3fc,
    keyLightHex: 0xa5f3fc,
    rimLightHex: 0x2dd4bf,
  },
  SOLAR_SUPERNOVA: {
    key: 'SOLAR_SUPERNOVA',
    titleRu: '✨ Золотая Сверхновая',
    subtitleRu: 'Имперская кузница астрального золота',
    emoji: '✨',
    skyHex: 0x1f1108,
    fogHex: 0x1f1108,
    fogDensity: 0.02,
    floorFill: '#2b180a',
    floorStroke: '#6b3c15',
    wallFill: '#5c3818',
    wallStroke: '#38200b',
    capHex: 0xfbbf24,
    borderTintHex: 0xf59e0b,
    innerTintHex: 0xfde68a,
    keyLightHex: 0xfff3c4,
    rimLightHex: 0xf97316,
  },
};

// ============================================================================
// ITERATION 2 INNOVATION: 3D COMPANION FAMILIARS (ФАМИЛЬЯРЫ-СПУТНИКИ)
// ============================================================================
export type FamiliarId = 'owl' | 'wolf' | 'fairy' | 'dragonling';

export interface FamiliarCompanion {
  id: FamiliarId;
  emoji: string;
  nameRu: string;
  titleRu: string;
  combatStrikeDamage: number;
  combatHeal: number;
  passiveDescRu: string;
  auraHex: number;
}

export const FAMILIARS_CATALOG: Record<FamiliarId, FamiliarCompanion> = {
  owl: {
    id: 'owl',
    emoji: '🦉',
    nameRu: 'Мудрая Сова Астрала',
    titleRu: 'Провидец Лабиринта',
    combatStrikeDamage: 12,
    combatHeal: 6,
    passiveDescRu: 'Расширяет радиус разведки Тумана Войны на мини-карте и лечит +6 ОЗ каждый ход боя',
    auraHex: 0x38bdf8,
  },
  wolf: {
    id: 'wolf',
    emoji: '🐺',
    nameRu: 'Призрачный Лютоволк',
    titleRu: 'Страж Севера',
    combatStrikeDamage: 20,
    combatHeal: 0,
    passiveDescRu: 'Терзает босса на 20 ед. чистого урона после каждой вашей атаки на RPG-Арене',
    auraHex: 0xf43f5e,
  },
  fairy: {
    id: 'fairy',
    emoji: '🧚',
    nameRu: 'Изумрудная Фея Света',
    titleRu: 'Хранительница Жизни',
    combatStrikeDamage: 10,
    combatHeal: 12,
    passiveDescRu: 'Исцеляет героя на +12 ОЗ каждый ход дуэли и смягчает урон от ловушек',
    auraHex: 0x34d399,
  },
  dragonling: {
    id: 'dragonling',
    emoji: '🐲',
    nameRu: 'Золотой Дракончик',
    titleRu: 'Искатель Сокровищ',
    combatStrikeDamage: 16,
    combatHeal: 4,
    passiveDescRu: 'Дышит пламенем (+16 урона в бою) и приносит +4 бонусных монеты за каждую звезду ⭐',
    auraHex: 0xfbbf24,
  },
};

// ============================================================================
// ITERATION 2 INNOVATION: ROYAL NOBILITY PRESTIGE RANKS (ТИТУЛЫ ДВОРЯНСТВА)
// ============================================================================
export interface RoyalRankInfo {
  rankIndex: number;
  titleRu: string;
  crestEmoji: string;
  minScore: number;
  nextScore: number;
  goldBonusPercent: number;
}

export const ROYAL_RANKS: RoyalRankInfo[] = [
  { rankIndex: 1, titleRu: 'Оруженосец Лабиринта', crestEmoji: '🛡️', minScore: 0, nextScore: 3, goldBonusPercent: 0 },
  { rankIndex: 2, titleRu: 'Странствующий Рыцарь', crestEmoji: '⚔️', minScore: 3, nextScore: 7, goldBonusPercent: 10 },
  { rankIndex: 3, titleRu: 'Барон Средневековой Цитадели', crestEmoji: '🏰', minScore: 7, nextScore: 12, goldBonusPercent: 20 },
  { rankIndex: 4, titleRu: 'Великий Магистр Рун', crestEmoji: '🔮', minScore: 12, nextScore: 20, goldBonusPercent: 35 },
  { rankIndex: 5, titleRu: 'Император Вселенной Эмодзи', crestEmoji: '👑', minScore: 20, nextScore: 999, goldBonusPercent: 50 },
];

export function evaluateRoyalRank(
  bountiesCompleted: number,
  highLevel: number,
  totalWins: number
): RoyalRankInfo {
  const prestigeScore = bountiesCompleted * 2 + (highLevel - 1) + Math.floor(totalWins / 2);
  for (let i = ROYAL_RANKS.length - 1; i >= 0; i--) {
    if (prestigeScore >= ROYAL_RANKS[i].minScore) {
      return ROYAL_RANKS[i];
    }
  }
  return ROYAL_RANKS[0];
}

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
  forgedRelicName?: string;
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
    badge: 'Танк Цитадели',
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
    desc: 'Сокрушительный урон заклинаниями и рунами Unicode',
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
    bonusDesc: 'Высокий шанс критического разряда и оглушения меха-стражей',
  },
  Ocean: {
    title: '🌊 Океан',
    spellName: '🌊 Цунами Unicode',
    emoji: '🌊',
    bonusDesc: 'Мощная волна урона + заморозка атаки врага',
  },
  Forest: {
    title: '🍃 Лес',
    spellName: '🍃 Дыхание Природы',
    emoji: '🍃',
    bonusDesc: 'Наносит урон и восстанавливает +14 ОЗ герою',
  },
  Gold: {
    title: '✨ Золото',
    spellName: '✨ Золотой Метеорит',
    emoji: '✨',
    bonusDesc: 'Взрывной урон и +8 бонусных монет за удар',
  },
};

export interface GlyphSynergy {
  id: string;
  titleRu: string;
  badgeEmoji: string;
  descriptionRu: string;
  bonusHp: number;
  bonusAtk: number;
  bonusDef: number;
  passiveKey: 'FIRST_STRIKE_CRIT' | 'DOUBLE_STAR_GOLD' | 'PHASE_WALK' | 'HOLY_AEGIS' | 'ARCANE_OVERLOAD' | 'VAMPIRIC_STEP';
}

export function evaluateGlyphSynergy(
  role: CharacterRole,
  baseEmoji: string,
  accessoryEmoji: string,
  flagEmoji: string,
  bgStyle: BackgroundStyle
): GlyphSynergy {
  if (baseEmoji === '🐉' && (accessoryEmoji === '👑' || accessoryEmoji === '💎') && bgStyle === 'Gold') {
    return {
      id: 'dragon-emperor',
      titleRu: '👑 Император Золотого Дракона',
      badgeEmoji: '🐉',
      descriptionRu: 'Каждая звезда ⭐ в лабиринте приносит ×2 золота (+10 🪙 вместо +5 🪙)',
      bonusHp: 20,
      bonusAtk: 10,
      bonusDef: 8,
      passiveKey: 'DOUBLE_STAR_GOLD',
    };
  }

  if (role === 'Knight' && (accessoryEmoji === '🛡️' || accessoryEmoji === '⚔️')) {
    return {
      id: 'citadel-paladin',
      titleRu: '🏰 Паладин Средневекового Ордена',
      badgeEmoji: '🛡️',
      descriptionRu: 'Священный щит: блокирует 25% урона от ловушек и первых ударов боссов',
      bonusHp: 22,
      bonusAtk: 6,
      bonusDef: 12,
      passiveKey: 'HOLY_AEGIS',
    };
  }

  if ((baseEmoji === '🤠' || flagEmoji === '🏴‍☠️') && (accessoryEmoji === '🔥' || accessoryEmoji === '⚔️')) {
    return {
      id: 'outlaw-gunslinger',
      titleRu: '🔥 Вольный Стрелок Пустоши',
      badgeEmoji: '🤠',
      descriptionRu: 'Первая атака на RPG-Арене гарантированно наносит критический урон ×1.75',
      bonusHp: 10,
      bonusAtk: 14,
      bonusDef: 4,
      passiveKey: 'FIRST_STRIKE_CRIT',
    };
  }

  if ((baseEmoji === '🤖' || baseEmoji === '🦊' || role === 'Cyber-Ninja') && (bgStyle === 'Neon' || accessoryEmoji === '⚡')) {
    return {
      id: 'quantum-phantom',
      titleRu: '⚡ Квантовый Кибер-Фантом',
      badgeEmoji: '⚡',
      descriptionRu: 'Даёт +1 заряд фазового прыжка и +15% к шансу критического удара',
      bonusHp: 12,
      bonusAtk: 11,
      bonusDef: 6,
      passiveKey: 'PHASE_WALK',
    };
  }

  if (role === 'Mage' || baseEmoji === '🔮' || accessoryEmoji === '❄️' || flagEmoji === '🌌') {
    return {
      id: 'arcane-grandmaster',
      titleRu: '🔮 Архимаг Древних Рун',
      badgeEmoji: '🌌',
      descriptionRu: 'Комбо-синтез заклинаний наносит +25% урона и даёт +1 ⚡ в начале боя',
      bonusHp: 8,
      bonusAtk: 15,
      bonusDef: 5,
      passiveKey: 'ARCANE_OVERLOAD',
    };
  }

  return {
    id: 'starlight-wanderer',
    titleRu: '✨ Странник Звёздного Лабиринта',
    badgeEmoji: '✨',
    descriptionRu: 'Каждый шаг по неизведанным плиткам укрепляет дух героя (+2 ОЗ при сборе звезды)',
    bonusHp: 10,
    bonusAtk: 6,
    bonusDef: 6,
    passiveKey: 'VAMPIRIC_STEP',
  };
}

export interface ForgedRelicRecipe {
  id: string;
  ing1: string;
  ing2: string;
  resultEmoji: string;
  nameRu: string;
  bonusHp: number;
  bonusAtk: number;
  bonusDef: number;
  effectRu: string;
}

export const FORGE_RECIPES: ForgedRelicRecipe[] = [
  {
    id: 'hellfire-blade',
    ing1: '⚔️',
    ing2: '🔥',
    resultEmoji: '🔥',
    nameRu: '🔥 Клинок Инферно',
    bonusHp: 5,
    bonusAtk: 16,
    bonusDef: 2,
    effectRu: 'Поджигает врагов в дуэли (доп. ожог 8 ед. урона каждый ход)',
  },
  {
    id: 'frost-aegis',
    ing1: '🛡️',
    ing2: '❄️',
    resultEmoji: '❄️',
    nameRu: '❄️ Эгида Вечной Мерзлоты',
    bonusHp: 25,
    bonusAtk: 4,
    bonusDef: 15,
    effectRu: 'Отражает холод и снижает атаку босса на 20%',
  },
  {
    id: 'thunder-crown',
    ing1: '👑',
    ing2: '⚡',
    resultEmoji: '👑',
    nameRu: '👑 Корона Громовержца',
    bonusHp: 15,
    bonusAtk: 14,
    bonusDef: 8,
    effectRu: 'Цепная молния при каждом критическом ударе',
  },
  {
    id: 'astral-chalice',
    ing1: '💎',
    ing2: '✨',
    resultEmoji: '💎',
    nameRu: '💎 Грааль Звёздного Света',
    bonusHp: 30,
    bonusAtk: 10,
    bonusDef: 10,
    effectRu: 'Усиливает исцеление эликсиром на +45%',
  },
];

export function forgeEmojiRelic(ing1: string, ing2: string): ForgedRelicRecipe {
  const match = FORGE_RECIPES.find(
    (r) => (r.ing1 === ing1 && r.ing2 === ing2) || (r.ing1 === ing2 && r.ing2 === ing1)
  );
  if (match) return match;

  const hash = deterministicStringHash(`${ing1}:${ing2}`);
  return {
    id: `custom-relic-${hash}`,
    ing1,
    ing2,
    resultEmoji: ing1,
    nameRu: `⚗️ Рунный Артефакт (${ing1}+${ing2})`,
    bonusHp: 8 + (hash % 14),
    bonusAtk: 6 + (hash % 10),
    bonusDef: 5 + (hash % 8),
    effectRu: 'Древний сплав двух глифов усиливает базовые параметры героя',
  };
}

export interface RoguelikePerk {
  id: string;
  titleRu: string;
  emoji: string;
  rarity: 'RARE' | 'EPIC' | 'LEGENDARY';
  descRu: string;
}

export const ROGUELIKE_PERKS_POOL: RoguelikePerk[] = [
  {
    id: 'perk-vampirism',
    titleRu: '🩸 Кровавый Контракт Вампира',
    emoji: '🩸',
    rarity: 'EPIC',
    descRu: 'Каждая обычная атака на RPG-Арене исцеляет героя на 30% от нанесённого урона.',
  },
  {
    id: 'perk-trap-immunity',
    titleRu: '🥾 Крылатые Сапоги Цитадели',
    emoji: '🥾',
    rarity: 'RARE',
    descRu: 'Полный иммунитет к напольным шипам ⚙️ в лабиринте + шаг по шипам даёт +1 ⚡ маны.',
  },
  {
    id: 'perk-midas-touch',
    titleRu: '👑 Благословение Короля Мидаса',
    emoji: '👑',
    rarity: 'LEGENDARY',
    descRu: 'Все звёзды ⭐, сундуки 🎁 и боссы приносят на +60% больше золотых монет.',
  },
  {
    id: 'perk-spell-weaver',
    titleRu: '🎹 Кристалл Комбо-Магии',
    emoji: '🎹',
    rarity: 'LEGENDARY',
    descRu: 'Заклинания Синтезатора Рун наносят +35% урона и усиливают заморозку.',
  },
  {
    id: 'perk-titan-heart',
    titleRu: '❤️‍🔥 Сердце Древнего Титана',
    emoji: '❤️‍🔥',
    rarity: 'RARE',
    descRu: 'Мгновенно восстанавливает полное здоровье и даёт +25 к макс. ОЗ на время похода.',
  },
  {
    id: 'perk-shadow-cloak',
    titleRu: '🌀 Плащ Пространственного Сдвига',
    emoji: '🌀',
    rarity: 'EPIC',
    descRu: 'Использование телепортов 🌀 в лабиринте исцеляет +15 ОЗ и даёт +2 ⚡ маны.',
  },
];

export interface BountyContract {
  id: string;
  titleRu: string;
  descRu: string;
  rewardCoins: number;
  targetType: 'STARS' | 'ENEMIES' | 'SHRINE_OR_PORTAL';
  targetCount: number;
  progress: number;
  completed: boolean;
  tier?: number;
}

export const INITIAL_BOUNTY_CONTRACTS: BountyContract[] = [
  {
    id: 'bounty-stars',
    titleRu: '📜 Указ Короля I: Звездочёт',
    descRu: 'Соберите 4 кристалла звёзд ⭐ в 3D-лабиринте',
    rewardCoins: 45,
    targetType: 'STARS',
    targetCount: 4,
    progress: 0,
    completed: false,
    tier: 1,
  },
  {
    id: 'bounty-hunter',
    titleRu: '⚔️ Указ Короля I: Охота на Стражей',
    descRu: 'Одержите 2 победы над стражами или мимиками на RPG-Арене',
    rewardCoins: 60,
    targetType: 'ENEMIES',
    targetCount: 2,
    progress: 0,
    completed: false,
    tier: 1,
  },
  {
    id: 'bounty-explorer',
    titleRu: '⛩️ Указ Короля I: Тайны Архитекторов',
    descRu: 'Активируйте Алтарь ⛩️, Врата с ключом 🗝️ или Портал 🌀',
    rewardCoins: 40,
    targetType: 'SHRINE_OR_PORTAL',
    targetCount: 1,
    progress: 0,
    completed: false,
    tier: 1,
  },
];

export function generateNextTierBounty(completedContract: BountyContract): BountyContract {
  const nextTier = (completedContract.tier ?? 1) + 1;
  const nextTarget = completedContract.targetCount + (completedContract.targetType === 'STARS' ? 3 : 1);
  const nextReward = completedContract.rewardCoins + 25;

  const prefix =
    completedContract.targetType === 'STARS'
      ? `📜 Указ Короля #${nextTier}: Астральный Сбор`
      : completedContract.targetType === 'ENEMIES'
      ? `⚔️ Указ Короля #${nextTier}: Гроза Боссов`
      : `⛩️ Указ Короля #${nextTier}: Хранитель Ключей`;

  const desc =
    completedContract.targetType === 'STARS'
      ? `Соберите ещё ${nextTarget} кристаллов звёзд ⭐ в походах`
      : completedContract.targetType === 'ENEMIES'
      ? `Победите ещё ${nextTarget} стражей или мимиков на RPG-Арене`
      : `Активируйте ${nextTarget} древних объектов (Ключ 🗝️, Алтарь ⛩️ или Портал 🌀)`;

  return {
    id: `${completedContract.id}-t${nextTier}-${Date.now()}`,
    titleRu: prefix,
    descRu: desc,
    rewardCoins: nextReward,
    targetType: completedContract.targetType,
    targetCount: nextTarget,
    progress: 0,
    completed: false,
    tier: nextTier,
  };
}

export function deterministicStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function calculateHeroStats(
  role: CharacterRole,
  baseEmoji: string,
  accessoryEmoji: string,
  backgroundStyle: BackgroundStyle,
  flagEmoji: string = '🏁'
): { hp: number; attack: number; defense: number } {
  const meta = ROLE_METADATA[role] ?? ROLE_METADATA['Cyber-Ninja'];
  const hpBonus = deterministicStringHash(baseEmoji) % 15;
  const atkBonus = deterministicStringHash(accessoryEmoji) % 8;
  const defBonus = deterministicStringHash(backgroundStyle) % 6;
  const synergy = evaluateGlyphSynergy(role, baseEmoji, accessoryEmoji, flagEmoji, backgroundStyle);

  return {
    hp: meta.baseHp + hpBonus + synergy.bonusHp,
    attack: meta.baseAtk + atkBonus + synergy.bonusAtk,
    defense: meta.baseDef + defBonus + synergy.bonusDef,
  };
}

export interface Position {
  r: number;
  c: number;
}

export type EnemyPolicy = 'CHASER' | 'PATROLLER' | 'GUARDIAN';

export type EliteAffix = 'ARMORED' | 'VAMPIRIC' | 'BLAZING' | 'NONE';

export const ELITE_AFFIX_META: Record<EliteAffix, { labelRu: string; badge: string }> = {
  NONE: { labelRu: '', badge: '' },
  ARMORED: { labelRu: '🛡️ Бронированный', badge: '🛡️' },
  VAMPIRIC: { labelRu: '🩸 Вампирский', badge: '🩸' },
  BLAZING: { labelRu: '🔥 Огненная Аура', badge: '🔥' },
};

export interface MazeEnemy {
  id: string;
  r: number;
  c: number;
  emoji: string;
  name: string;
  policy: EnemyPolicy;
  elementWeakness: BackgroundStyle;
  affix?: EliteAffix;
  patrolDir: { dr: number; dc: number };
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  rewardCoins: number;
  telegraphing: boolean;
  isMimic?: boolean;
  clashed?: boolean;
  trapDamaged?: boolean;
}

export interface PortalPair {
  a: Position;
  b: Position;
}

export interface MazeData {
  rows: number;
  cols: number;
  grid: TileType[][];
  stars: Position[];
  chests: Position[];
  traps: Position[];
  shrines: Position[];
  portals: PortalPair | null;
  keyPos: Position | null;
  leverPos: Position | null;
  merchantPos: Position | null;
  phaseGates: Position[];
  enemies: MazeEnemy[];
  start: Position;
  exit: Position;
}

export type TarotCardId = 'wheel-of-fortune' | 'the-tower' | 'the-star' | 'the-chariot';

export interface TarotFateCard {
  id: TarotCardId;
  arcanaNumber: string;
  emoji: string;
  titleRu: string;
  subtitleRu: string;
  effectRu: string;
  goldBonusPct: number;
  atkBonusPct: number;
  bonusStartMana: number;
  autoOpenPhaseGates: boolean;
}

export const TAROT_CARDS_CATALOG: TarotFateCard[] = [
  {
    id: 'wheel-of-fortune',
    arcanaNumber: 'X',
    emoji: '🎡',
    titleRu: 'X · Колесо Фортуны',
    subtitleRu: 'Аркан Золотого Изобилия',
    effectRu: '+40% золота со всех звёзд и сундуков + старт похода с +1 ⚡ маны',
    goldBonusPct: 40,
    atkBonusPct: 0,
    bonusStartMana: 1,
    autoOpenPhaseGates: false,
  },
  {
    id: 'the-tower',
    arcanaNumber: 'XVI',
    emoji: '🏰',
    titleRu: 'XVI · Цитадель Грома',
    subtitleRu: 'Аркан Сокрушительной Мощи',
    effectRu: '+20% к атаке героя на RPG-Арене + 1.5D-Волна [E] бьёт стражей вдвое сильнее',
    goldBonusPct: 0,
    atkBonusPct: 20,
    bonusStartMana: 0,
    autoOpenPhaseGates: false,
  },
  {
    id: 'the-star',
    arcanaNumber: 'XVII',
    emoji: '🌟',
    titleRu: 'XVII · Астральная Звезда',
    subtitleRu: 'Аркан Небесного Исцеления',
    effectRu: 'Каждая звезда ⭐ исцеляет ещё +14 ОЗ и даёт +1 заряд Квантового Сдвига [Q]',
    goldBonusPct: 15,
    atkBonusPct: 5,
    bonusStartMana: 1,
    autoOpenPhaseGates: false,
  },
  {
    id: 'the-chariot',
    arcanaNumber: 'VII',
    emoji: '🛸',
    titleRu: 'VII · Колесница Тессеракта',
    subtitleRu: 'Аркан 4D-Пространства',
    effectRu: '4D-Фазовые Заслонки 🟪 открыты со старта похода + дополнительный заряд [Q]',
    goldBonusPct: 10,
    atkBonusPct: 10,
    bonusStartMana: 0,
    autoOpenPhaseGates: true,
  },
];

export interface BestiaryEntryMeta {
  emoji: string;
  nameRu: string;
  titleRu: string;
  loreRu: string;
  weakness: BackgroundStyle;
}

export const BESTIARY_LORE_CATALOG: BestiaryEntryMeta[] = [
  {
    emoji: '👾',
    nameRu: 'Кибер-Захватчик',
    titleRu: 'Синтетический Дозорный Ядра',
    loreRu: 'Древний алгоритм защиты, патрулирующий прямые коридоры. Уязвим к высокочастотному Неону.',
    weakness: 'Neon',
  },
  {
    emoji: '👻',
    nameRu: 'Древний Полтергейст',
    titleRu: 'Фантом Забытых Катакомб',
    loreRu: 'Бестелесный дух павших рыцарей Цитадели. Боится солнечного сияния Королевского Золота.',
    weakness: 'Gold',
  },
  {
    emoji: '🐉',
    nameRu: 'Коррозийный Дракон',
    titleRu: 'Хранитель Врат Бездны',
    loreRu: 'Крылатый змей, стерегущий выход из сектора. Его чешуя трескается от ледяных течений Океана.',
    weakness: 'Ocean',
  },
  {
    emoji: '🦁',
    nameRu: 'Огненная Химера',
    titleRu: 'Яростный Охотник Горнила',
    loreRu: 'Чудовище алхимического синтеза, преследующее жертву по запаху маны. Уязвимо к стихии Океана.',
    weakness: 'Ocean',
  },
  {
    emoji: '🐙',
    nameRu: 'Глубоководный Кракен',
    titleRu: 'Владыка Затопленной Атлантиды',
    loreRu: 'Исполинский страж подводных сводов с мощным панцирем. Корни Изумрудного Леса сковывают его щупальца.',
    weakness: 'Forest',
  },
  {
    emoji: '🤖',
    nameRu: 'Меха-Страж Врат',
    titleRu: 'Автоматон Королевской Кузницы',
    loreRu: 'Закованный в титановую броню часовой. Короткое замыкание от Неонового Импульса пробивает его щиты.',
    weakness: 'Neon',
  },
  {
    emoji: '🎁',
    nameRu: 'Зубастый Сундук-Мимик',
    titleRu: 'Коварная Ловушка Сребролюбцев',
    loreRu: 'Оживший средневековый ларец с вампирскими клыками. Сверхновая Космоса испепеляет его деревянный панцирь.',
    weakness: 'Cosmic',
  },
];

export function evaluateBestiaryHuntBonus(
  enemyEmoji: string,
  killsMap: Record<string, number>
): { kills: number; damageMultiplier: number; bonusPct: number } {
  const kills = Math.max(0, killsMap[enemyEmoji] ?? 0);
  const bonusPct = Math.min(35, kills * 7);
  return {
    kills,
    damageMultiplier: 1 + bonusPct / 100,
    bonusPct,
  };
}

export const BOSS_ROSTER = [
  {
    name: '👾 Кибер-Захватчик',
    emoji: '👾',
    policy: 'PATROLLER' as EnemyPolicy,
    weakness: 'Neon' as BackgroundStyle,
    hp: 125,
    atk: 22,
    def: 10,
    reward: 25,
  },
  {
    name: '👻 Древний Полтергейст',
    emoji: '👻',
    policy: 'CHASER' as EnemyPolicy,
    weakness: 'Gold' as BackgroundStyle,
    hp: 110,
    atk: 25,
    def: 9,
    reward: 25,
  },
  {
    name: '🐉 Коррозийный Дракон',
    emoji: '🐉',
    policy: 'GUARDIAN' as EnemyPolicy,
    weakness: 'Ocean' as BackgroundStyle,
    hp: 170,
    atk: 24,
    def: 14,
    reward: 40,
  },
  {
    name: '🦁 Огненная Химера',
    emoji: '🦁',
    policy: 'CHASER' as EnemyPolicy,
    weakness: 'Ocean' as BackgroundStyle,
    hp: 145,
    atk: 24,
    def: 12,
    reward: 35,
  },
  {
    name: '🐙 Глубоководный Кракен',
    emoji: '🐙',
    policy: 'GUARDIAN' as EnemyPolicy,
    weakness: 'Forest' as BackgroundStyle,
    hp: 185,
    atk: 20,
    def: 16,
    reward: 45,
  },
  {
    name: '🤖 Меха-Страж Врат',
    emoji: '🤖',
    policy: 'PATROLLER' as EnemyPolicy,
    weakness: 'Neon' as BackgroundStyle,
    hp: 140,
    atk: 23,
    def: 15,
    reward: 30,
  },
];

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

  if (cCount > 3) grid[1][2] = 'PATH';
  if (rCount > 3) grid[2][1] = 'PATH';

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
  if (grid[exit.r - 1][exit.c] === 'WALL' && grid[exit.r][exit.c - 1] === 'WALL') {
    grid[exit.r - 1][exit.c] = 'PATH';
  }

  const walkableSpots: Position[] = [];
  const innerWalls: Position[] = [];
  for (let r = 1; r < rCount - 1; r++) {
    for (let c = 1; c < cCount - 1; c++) {
      if (
        grid[r][c] === 'PATH' &&
        !(r === start.r && c === start.c) &&
        !(r === exit.r && c === exit.c)
      ) {
        walkableSpots.push({ r, c });
      } else if (grid[r][c] === 'WALL') {
        // Check if this inner wall separates two walkable tiles
        const horizPass = grid[r][c - 1] !== 'WALL' && grid[r][c + 1] !== 'WALL';
        const vertPass = grid[r - 1][c] !== 'WALL' && grid[r + 1][c] !== 'WALL';
        if (horizPass || vertPass) {
          innerWalls.push({ r, c });
        }
      }
    }
  }

  const shuffledPool = shuffle(walkableSpots);
  let cursor = 0;

  const stars: Position[] = shuffledPool.slice(cursor, cursor + Math.min(starCount, shuffledPool.length));
  cursor += stars.length;
  for (const s of stars) {
    grid[s.r][s.c] = 'STAR';
  }

  const chestCount = rawRows >= 13 ? 2 : 1;
  const chests: Position[] = shuffledPool.slice(cursor, cursor + chestCount);
  cursor += chests.length;
  for (const ch of chests) {
    grid[ch.r][ch.c] = 'CHEST';
  }

  const keyPos: Position | null = shuffledPool[cursor] ?? null;
  if (keyPos) cursor += 1;

  const leverPos: Position | null = shuffledPool[cursor] ?? null;
  if (leverPos) cursor += 1;

  const merchantPos: Position | null = shuffledPool[cursor] ?? null;
  if (merchantPos) cursor += 1;

  const phaseGates: Position[] = shuffle(innerWalls).slice(0, rawRows >= 13 ? 3 : 2);

  const shrines: Position[] = shuffledPool.slice(cursor, cursor + 1);
  cursor += shrines.length;

  let portals: PortalPair | null = null;
  if (shuffledPool.length - cursor >= 2) {
    portals = {
      a: shuffledPool[cursor],
      b: shuffledPool[cursor + 1],
    };
    cursor += 2;
  }

  const trapCandidates = shuffledPool
    .slice(cursor)
    .filter((p) => p.r + p.c >= 5);
  const trapCount = rawRows >= 13 ? 3 : 2;
  const traps: Position[] = trapCandidates.slice(0, trapCount);

  const farSpots = shuffle(
    walkableSpots.filter((p) => p.r + p.c >= 6 && !(p.r === exit.r && p.c === exit.c))
  );

  const policies: EnemyPolicy[] = ['CHASER', 'PATROLLER', 'GUARDIAN'];
  const affixes: EliteAffix[] = ['ARMORED', 'VAMPIRIC', 'BLAZING'];
  const actualEnemyCount = Math.min(enemyCount, farSpots.length);
  const enemies: MazeEnemy[] = [];

  for (let i = 0; i < actualEnemyCount; i++) {
    const pos = farSpots[i];
    const policy = policies[i % policies.length];
    const template = BOSS_ROSTER[(level + i) % BOSS_ROSTER.length];
    const affix: EliteAffix = level >= 2 || i === 0 ? affixes[(level + i) % affixes.length] : 'NONE';

    const scale = 1 + (level - 1) * 0.08;
    const defBonus = affix === 'ARMORED' ? 6 : 0;
    const atkBonus = affix === 'BLAZING' ? 4 : 0;

    enemies.push({
      id: `enemy-${level}-${i}`,
      r: pos.r,
      c: pos.c,
      emoji: template.emoji,
      name: template.name,
      policy,
      elementWeakness: template.weakness,
      affix,
      patrolDir: i % 2 === 0 ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 },
      maxHp: Math.round(template.hp * scale),
      hp: Math.round(template.hp * scale),
      attack: Math.round(template.atk * scale) + atkBonus,
      defense: Math.round(template.def * scale) + defBonus,
      rewardCoins: template.reward + (level - 1) * 5 + (affix !== 'NONE' ? 10 : 0),
      telegraphing: false,
    });
  }

  return {
    rows: rCount,
    cols: cCount,
    grid,
    stars,
    chests,
    traps,
    shrines,
    portals,
    keyPos,
    leverPos,
    merchantPos,
    phaseGates,
    enemies,
    start,
    exit,
  };
}

export type SectorWeatherKey =
  | 'CLEAR_AETHER'
  | 'METEOR_EMBER'
  | 'CHRONO_MIST'
  | 'ASTRAL_STORM';

export interface SectorWeatherMeta {
  id: SectorWeatherKey;
  emoji: string;
  titleRu: string;
  badgeRu: string;
  descRu: string;
  particleColorHex: number;
  enemySpeedMultiplier: number;
  shockwaveBonusPct: number;
  arenaCritBonus: number;
  rewindHealBonus: number;
}

export const SECTOR_WEATHERS_CATALOG: Record<SectorWeatherKey, SectorWeatherMeta> = {
  CLEAR_AETHER: {
    id: 'CLEAR_AETHER',
    emoji: '✨',
    titleRu: 'Чистый Эфир',
    badgeRu: '✨ 4.5D ЭФИР',
    descRu: 'Кристальная атмосфера: стандартная скорость стражей и чёткий 1.5D-волновод',
    particleColorHex: 0xc084fc,
    enemySpeedMultiplier: 1.0,
    shockwaveBonusPct: 0,
    arenaCritBonus: 0,
    rewindHealBonus: 0,
  },
  METEOR_EMBER: {
    id: 'METEOR_EMBER',
    emoji: '☄️',
    titleRu: 'Метеоритный Пепел',
    badgeRu: '☄️ 4.5D ПЕПЕЛ',
    descRu: 'Огненный звездопад: импульс [E] и магия наносят +25% урона, каждая звезда даёт +4 🪙',
    particleColorHex: 0xf97316,
    enemySpeedMultiplier: 1.0,
    shockwaveBonusPct: 25,
    arenaCritBonus: 0.08,
    rewindHealBonus: 0,
  },
  CHRONO_MIST: {
    id: 'CHRONO_MIST',
    emoji: '🌫️',
    titleRu: 'Хроно-Туман Вечности',
    badgeRu: '🌫️ 4.5D ХРОНО-ТУМАН',
    descRu: 'Временная дымка: стражи замедлены на 25%, а Хроно-Отмотка [Z] лечит +14 ОЗ и даёт +1 ⚡',
    particleColorHex: 0x22d3ee,
    enemySpeedMultiplier: 1.3,
    shockwaveBonusPct: 10,
    arenaCritBonus: 0.05,
    rewindHealBonus: 14,
  },
  ASTRAL_STORM: {
    id: 'ASTRAL_STORM',
    emoji: '🌩️',
    titleRu: 'Астральная Буря',
    badgeRu: '🌩️ 4.5D БУРЯ',
    descRu: 'Гиперпространственный вихрь: каждые 3 шага дают +1 ⚡ маны, +15% к шансу крита на Арене',
    particleColorHex: 0x38bdf8,
    enemySpeedMultiplier: 0.95,
    shockwaveBonusPct: 15,
    arenaCritBonus: 0.15,
    rewindHealBonus: 6,
  },
};

export type GuildOrderId =
  | 'ORDER_TEMPLARS'
  | 'ORDER_ALCHEMISTS'
  | 'ORDER_SHADOW_NAVIGATORS';

export interface GuildOrderMeta {
  id: GuildOrderId;
  emoji: string;
  titleRu: string;
  mottoRu: string;
  descRu: string;
  bonusHp: number;
  potionPowerMult: number;
  bonusStartQuantum: number;
  goldBonusPct: number;
  arenaDefBonus: number;
}

export const GUILD_ORDERS_CATALOG: GuildOrderMeta[] = [
  {
    id: 'ORDER_TEMPLARS',
    emoji: '🛡️',
    titleRu: 'Орден Храмовников Солнца',
    mottoRu: 'Щит Света несокрушим',
    descRu: '+20 к Макс. ОЗ героя и +8 к защите на RPG-Арене',
    bonusHp: 20,
    potionPowerMult: 1.0,
    bonusStartQuantum: 0,
    goldBonusPct: 0,
    arenaDefBonus: 8,
  },
  {
    id: 'ORDER_ALCHEMISTS',
    emoji: '⚗️',
    titleRu: 'Гильдия Алхимиков Звёзд',
    mottoRu: 'Трансмутация эфира и золота',
    descRu: 'Эликсиры пояса [1][2][3] на +40% эффективнее + бонус +15% золота',
    bonusHp: 5,
    potionPowerMult: 1.4,
    bonusStartQuantum: 0,
    goldBonusPct: 15,
    arenaDefBonus: 2,
  },
  {
    id: 'ORDER_SHADOW_NAVIGATORS',
    emoji: '🧭',
    titleRu: 'Братство Навигаторов Бездны',
    mottoRu: 'Сквозь горизонт тессеракта',
    descRu: '+1 заряд Квантового Сдвига [Q] со старта и +25% к добыче монет',
    bonusHp: 0,
    potionPowerMult: 1.1,
    bonusStartQuantum: 1,
    goldBonusPct: 25,
    arenaDefBonus: 4,
  },
];

export type AlchemicalPotionId = 'elixir-phoenix' | 'ether-stargazer' | 'oil-basilisk';

export interface AlchemicalPotionMeta {
  id: AlchemicalPotionId;
  hotkey: '1' | '2' | '3';
  emoji: string;
  titleRu: string;
  shortTitleRu: string;
  descRu: string;
  refillCost: number;
}

export const ALCHEMICAL_POTIONS_CATALOG: AlchemicalPotionMeta[] = [
  {
    id: 'elixir-phoenix',
    hotkey: '1',
    emoji: '🧪',
    titleRu: 'Эликсир Феникса',
    shortTitleRu: 'Феникс [1]',
    descRu: 'Мгновенно исцеляет +45 ОЗ герою прямо в лабиринте',
    refillCost: 12,
  },
  {
    id: 'ether-stargazer',
    hotkey: '2',
    emoji: '⚗️',
    titleRu: 'Эфир Звездочёта',
    shortTitleRu: 'Эфир [2]',
    descRu: 'Восполняет +3 ⚡ маны и даёт +1 заряд Квантового Сдвига [Q]',
    refillCost: 15,
  },
  {
    id: 'oil-basilisk',
    hotkey: '3',
    emoji: '🏺',
    titleRu: 'Масло Василиска',
    shortTitleRu: 'Василиск [3]',
    descRu: 'Замораживает всех стражей на 4 такта ❄️ и открывает 4D-Заслонки 🟪',
    refillCost: 18,
  },
];

export function computeTargetCompass(
  playerPos: Position,
  targetPos: Position,
  targetLabelRu: string
): {
  arrow: string;
  dirCodeRu: string;
  distance: number;
  summaryRu: string;
} {
  const dr = targetPos.r - playerPos.r;
  const dc = targetPos.c - playerPos.c;
  const distance = Math.abs(dr) + Math.abs(dc);

  if (distance === 0) {
    return {
      arrow: '🎯',
      dirCodeRu: 'ЦЕЛЬ',
      distance: 0,
      summaryRu: `🎯 На точке: ${targetLabelRu}`,
    };
  }

  let arrow = '⬆️';
  let dirCodeRu = 'С';
  if (dr < 0 && dc === 0) {
    arrow = '⬆️';
    dirCodeRu = 'С';
  } else if (dr > 0 && dc === 0) {
    arrow = '⬇️';
    dirCodeRu = 'Ю';
  } else if (dr === 0 && dc > 0) {
    arrow = '➡️';
    dirCodeRu = 'В';
  } else if (dr === 0 && dc < 0) {
    arrow = '⬅️';
    dirCodeRu = 'З';
  } else if (dr < 0 && dc > 0) {
    arrow = '↗️';
    dirCodeRu = 'С-В';
  } else if (dr < 0 && dc < 0) {
    arrow = '↖️';
    dirCodeRu = 'С-З';
  } else if (dr > 0 && dc > 0) {
    arrow = '↘️';
    dirCodeRu = 'Ю-В';
  } else {
    arrow = '↙️';
    dirCodeRu = 'Ю-З';
  }

  return {
    arrow,
    dirCodeRu,
    distance,
    summaryRu: `${arrow} ${dirCodeRu} · ${distance} кл. до ${targetLabelRu}`,
  };
}

export function computeRunMasteryGrade(
  starsCollected: number,
  totalStars: number,
  clearTimeSec: number,
  enemiesDefeated: number,
  victory: boolean
): {
  grade: 'S+' | 'S' | 'A' | 'B' | 'C';
  titleRu: string;
  bonusCoins: number;
} {
  if (!victory) {
    return {
      grade: 'C',
      titleRu: 'Испытание Не Завершено',
      bonusCoins: 5,
    };
  }
  const allStars = starsCollected >= totalStars;
  if (allStars && clearTimeSec <= 45 && enemiesDefeated >= 1) {
    return {
      grade: 'S+',
      titleRu: 'Гранд-Магистр Тессеракта',
      bonusCoins: 45,
    };
  }
  if (allStars || clearTimeSec <= 40) {
    return {
      grade: 'S',
      titleRu: 'Верховный Архитектор Цитадели',
      bonusCoins: 30,
    };
  }
  if (starsCollected >= Math.ceil(totalStars * 0.6)) {
    return {
      grade: 'A',
      titleRu: 'Рыцарь Звёздного Кодекса',
      bonusCoins: 20,
    };
  }
  return {
    grade: 'B',
    titleRu: 'Искатель Лабиринта',
    bonusCoins: 10,
  };
}

export function isWalkableTile(
  maze: MazeData,
  r: number,
  c: number,
  phaseGatesOpen: boolean = false
): boolean {
  if (r < 0 || r >= maze.rows || c < 0 || c >= maze.cols) return false;
  if (maze.grid[r][c] !== 'WALL') return true;
  if (phaseGatesOpen && maze.phaseGates?.some((g) => g.r === r && g.c === c)) {
    return true;
  }
  return false;
}

/**
 * 1.5D Corridor Resonance Shockwave [E]:
 * Fires a directed energy wave along a straight corridor up to 5 tiles.
 * If the current facing direction hits a wall at step 1, automatically picks the longest open corridor from playerPos.
 */
export function castCorridorShockwave(
  maze: MazeData,
  playerPos: Position,
  preferredDir: { dr: number; dc: number },
  phaseGatesOpen: boolean = false
): {
  dir: { dr: number; dc: number };
  rayTiles: Position[];
} {
  const dirs = [
    preferredDir,
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: -1, dc: 0 },
  ];

  let bestDir = preferredDir;
  let bestRay: Position[] = [];

  for (const d of dirs) {
    if (d.dr === 0 && d.dc === 0) continue;
    const ray: Position[] = [];
    for (let step = 1; step <= 5; step++) {
      const nr = playerPos.r + d.dr * step;
      const nc = playerPos.c + d.dc * step;
      if (!isWalkableTile(maze, nr, nc, phaseGatesOpen)) break;
      ray.push({ r: nr, c: nc });
    }
    if (d.dr === preferredDir.dr && d.dc === preferredDir.dc && ray.length > 0) {
      return { dir: d, rayTiles: ray };
    }
    if (ray.length > bestRay.length) {
      bestRay = ray;
      bestDir = d;
    }
  }

  return { dir: bestDir, rayTiles: bestRay };
}

export interface TerrainCombatBuff {
  id: string;
  titleRu: string;
  badge: string;
  descRu: string;
  bonusDef: number;
  bonusCritChance: number;
  healPerTurn: number;
  bossOpeningDamagePct: number;
}

export function evaluateTerrainCombatBuff(maze: MazeData, pos: Position): TerrainCombatBuff {
  const isNear = (list: Position[]) =>
    list.some((item) => Math.abs(item.r - pos.r) + Math.abs(item.c - pos.c) <= 2);

  if (isNear(maze.shrines)) {
    return {
      id: 'terrain-shrine',
      titleRu: '⛩️ Священная Земля Алтаря',
      badge: '⛩️ АУРА АЛТАРЯ',
      descRu: '+12 к защите героя и +8 ОЗ регенерации каждый ход дуэли',
      bonusDef: 12,
      bonusCritChance: 0.05,
      healPerTurn: 8,
      bossOpeningDamagePct: 0,
    };
  }

  if (
    maze.portals &&
    (Math.abs(maze.portals.a.r - pos.r) + Math.abs(maze.portals.a.c - pos.c) <= 2 ||
      Math.abs(maze.portals.b.r - pos.r) + Math.abs(maze.portals.b.c - pos.c) <= 2)
  ) {
    return {
      id: 'terrain-portal',
      titleRu: '🌀 Квантовый Разлом Портала',
      badge: '🌀 АНОМАЛИЯ РАЗЛОМА',
      descRu: '+22% к шансу критического удара за счёт искривления пространства',
      bonusDef: 4,
      bonusCritChance: 0.22,
      healPerTurn: 0,
      bossOpeningDamagePct: 0,
    };
  }

  if (isNear(maze.traps)) {
    return {
      id: 'terrain-traps',
      titleRu: '⚙️ Осадный Рубеж Шипов',
      badge: '⚙️ ОСАДНЫЙ РУБЕЖ',
      descRu: 'Страж получает -12% ОЗ от механических ловушек в самом начале боя',
      bonusDef: 6,
      bonusCritChance: 0.08,
      healPerTurn: 0,
      bossOpeningDamagePct: 12,
    };
  }

  return {
    id: 'terrain-bastion',
    titleRu: '🏰 Каменный Бастион Цитадели',
    badge: '🏰 СВОДЫ БАСТИОНА',
    descRu: 'Крепкие стены коридора дают +8 к защите героя и +4 ОЗ/ход',
    bonusDef: 8,
    bonusCritChance: 0.05,
    healPerTurn: 4,
    bossOpeningDamagePct: 0,
  };
}

export type DimensionalMode =
  | '1.5d-wave'
  | '2.5d-diorama'
  | '3d-chase'
  | '3.5d-quantum'
  | '2d-classic';

export interface DimensionalModeMeta {
  id: DimensionalMode;
  badge: string;
  labelRu: string;
  shortLabelRu: string;
  descRu: string;
  fov: number;
}

export const DIMENSIONAL_MODE_META: Record<DimensionalMode, DimensionalModeMeta> = {
  '1.5d-wave': {
    id: '1.5d-wave',
    badge: '1.5D',
    labelRu: '〰️ 1.5D Спектр-Волновод',
    shortLabelRu: '〰️ 1.5D Спектр',
    descRu: 'Фрактальная 1.5D-навигация: бегущая синусоидальная волна вдоль графа кратчайшего пути до ключа и звёзд',
    fov: 42,
  },
  '2.5d-diorama': {
    id: '2.5d-diorama',
    badge: '2.5D',
    labelRu: '🎴 2.5D HD-Диорама',
    shortLabelRu: '🎴 2.5D Диорама',
    descRu: 'Изометрическая Tilt-Shift проекция (FOV 28°) с многослойными биллбордами и баллистическим салютом кристаллов',
    fov: 28,
  },
  '3d-chase': {
    id: '3d-chase',
    badge: '3.0D',
    labelRu: '🎥 3.0D Погоня',
    shortLabelRu: '🎥 3.0D Вслед',
    descRu: 'Классическая 3D-камера от 3-го лица с PBR-освещением и динамическим факелом',
    fov: 46,
  },
  '3.5d-quantum': {
    id: '3.5d-quantum',
    badge: '3.5D',
    labelRu: '🌀 3.5D Квантум-Хроно',
    shortLabelRu: '🌀 3.5D Квантум',
    descRu: '4-мерная гиперпроекция (3D + Время/Фаза): шлейф из 4 хроно-фантомов [Z], фазовый прицел сквозь стены [Q] и рентген-лучи',
    fov: 54,
  },
  '2d-classic': {
    id: '2d-classic',
    badge: '2.0D',
    labelRu: '🗺️ 2.0D Тактическая Сетка',
    shortLabelRu: '🗺️ 2.0D Сетка',
    descRu: 'Ортогональная 2D-матрица лабиринта сверху для классического планирования ходов',
    fov: 45,
  },
};

/**
 * Computes the 3.5D Quantum Phase Shift target tile (2 steps away across an adjacent wall).
 * Checks lastMoveDir first; if that direction is not a jumpable wall, scans the 4 cardinal directions
 * so the player always sees where [Q] Quantum Phase Shift can tunnel.
 */
export function computeQuantumPhaseTarget(
  maze: MazeData,
  playerPos: Position,
  lastMoveDir: { dr: number; dc: number },
  quantumCharges: number
): { target: Position; dir: { dr: number; dc: number } } | null {
  if (quantumCharges <= 0) return null;

  const candidateDirs: { dr: number; dc: number }[] = [];
  if (lastMoveDir.dr !== 0 || lastMoveDir.dc !== 0) {
    candidateDirs.push(lastMoveDir);
  }
  const cardinals = [
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
    { dr: -1, dc: 0 },
  ];
  for (const d of cardinals) {
    if (!candidateDirs.some((c) => c.dr === d.dr && c.dc === d.dc)) {
      candidateDirs.push(d);
    }
  }

  for (const d of candidateDirs) {
    const wallR = playerPos.r + d.dr;
    const wallC = playerPos.c + d.dc;
    const jumpR = playerPos.r + d.dr * 2;
    const jumpC = playerPos.c + d.dc * 2;
    const wallInBounds =
      wallR >= 0 && wallR < maze.rows && wallC >= 0 && wallC < maze.cols;
    if (
      wallInBounds &&
      maze.grid[wallR][wallC] === 'WALL' &&
      isWalkableTile(maze, jumpR, jumpC)
    ) {
      return {
        target: { r: jumpR, c: jumpC },
        dir: d,
      };
    }
  }

  return null;
}


/**
 * Steps all maze enemies using 3 AI policies + Tactical Trap Luring + Faction Infighting!
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

  const moved = enemies.map((enemy) => {
    const validNeighbors = dirs
      .map((d) => ({ r: enemy.r + d.dr, c: enemy.c + d.dc, dr: d.dr, dc: d.dc }))
      .filter((n) => isWalkableTile(maze, n.r, n.c) && !(n.r === 1 && n.c === 1));

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
      const distToPlayer = Math.abs(enemy.r - playerPos.r) + Math.abs(enemy.c - playerPos.c);
      const target = distToPlayer <= 3 ? playerPos : maze.exit;
      chosen = validNeighbors.reduce((best, curr) => {
        const bestDist = Math.abs(best.r - target.r) + Math.abs(best.c - target.c);
        const currDist = Math.abs(curr.r - target.r) + Math.abs(curr.c - target.c);
        return currDist <= bestDist ? curr : best;
      }, validNeighbors[0]);
    }

    // Check Tactical Trap Luring: if enemy steps onto a floor spike trap ⚙️, they lose 20% HP!
    const steppedOnTrap = maze.traps.some((t) => t.r === chosen.r && t.c === chosen.c);
    const nextHp = steppedOnTrap
      ? Math.max(20, Math.round(enemy.hp * 0.8))
      : enemy.hp;

    const newDistToPlayer = Math.abs(chosen.r - playerPos.r) + Math.abs(chosen.c - playerPos.c);
    return {
      ...enemy,
      r: chosen.r,
      c: chosen.c,
      hp: nextHp,
      patrolDir: nextPatrolDir,
      telegraphing: newDistToPlayer <= 2,
      clashed: false,
      trapDamaged: steppedOnTrap,
    };
  });

  // Check Faction Infighting: if 2 enemies step on the same tile, they clash and lose 18% HP!
  for (let i = 0; i < moved.length; i++) {
    for (let j = i + 1; j < moved.length; j++) {
      if (moved[i].r === moved[j].r && moved[i].c === moved[j].c) {
        moved[i] = {
          ...moved[i],
          hp: Math.max(25, Math.round(moved[i].hp * 0.82)),
          clashed: true,
        };
        moved[j] = {
          ...moved[j],
          hp: Math.max(25, Math.round(moved[j].hp * 0.82)),
          clashed: true,
        };
      }
    }
  }

  return moved;
}

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
  const selfHeal = hero.backgroundStyle === 'Forest' ? 14 : 0;
  const bonusCoins = hero.backgroundStyle === 'Gold' ? 8 : 0;

  return {
    spellName: spellMeta.spellName,
    damage,
    selfHeal,
    bonusCoins,
  };
}

export type RuneGlyph = '🔥' | '❄️' | '⚡';

export interface WovenSpellResult {
  comboCode: string;
  spellTitleRu: string;
  damage: number;
  selfHeal: number;
  inflictBurn: number;
  inflictFreeze: boolean;
  inflictShock: boolean;
}

export function weaveRuneComboSpell(
  runes: RuneGlyph[],
  heroAtk: number,
  hasSpellWeaverPerk: boolean = false
): WovenSpellResult {
  const code = runes.join('');
  const fireCount = runes.filter((r) => r === '🔥').length;
  const iceCount = runes.filter((r) => r === '❄️').length;
  const voltCount = runes.filter((r) => r === '⚡').length;

  let spellTitleRu = '⚛️ Тройной Рунный Каскад';
  if (fireCount === 3) spellTitleRu = '🌋 Метеоритный Апокалипсис Инферно';
  else if (iceCount === 3) spellTitleRu = '🧊 Абсолютный Ноль Вечности';
  else if (voltCount === 3) spellTitleRu = '🌩️ Гнев Небесного Торнадо';
  else if (fireCount === 1 && iceCount === 1 && voltCount === 1) {
    spellTitleRu = '🌌 Первородный Триумвират Стихий';
  } else if (fireCount >= 2) {
    spellTitleRu = '🔥 Пламенный Шторм Феникса';
  } else if (iceCount >= 2) {
    spellTitleRu = '❄️ Криогенный Бастион Атлантиды';
  } else if (voltCount >= 2) {
    spellTitleRu = '⚡ Квантовый Плазменный Разряд';
  }

  const baseMultiplier = fireCount === 1 && iceCount === 1 && voltCount === 1 ? 2.15 : 1.85;
  const perkBoost = hasSpellWeaverPerk ? 1.35 : 1.0;
  const damage = Math.round((heroAtk * baseMultiplier + fireCount * 8 + voltCount * 6) * perkBoost);
  const selfHeal = iceCount * 12;
  const inflictBurn = fireCount >= 1 ? fireCount * 7 : 0;
  const inflictFreeze = iceCount >= 2 || (fireCount === 1 && iceCount === 1 && voltCount === 1);
  const inflictShock = voltCount >= 2;

  return {
    comboCode: code,
    spellTitleRu,
    damage,
    selfHeal,
    inflictBurn,
    inflictFreeze,
    inflictShock,
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
    ...calculateHeroStats('Cyber-Ninja', '🦊', '👑', 'Cosmic', '🏁'),
    wins: 3,
    mazesCleared: 2,
  },
  {
    id: 'hero-retro-cowboy',
    name: 'Паладин Цитадели',
    baseEmoji: '🤠',
    accessoryEmoji: '⚔️',
    flagEmoji: '🏴‍☠️',
    backgroundStyle: 'Gold',
    characterRole: 'Knight',
    ...calculateHeroStats('Knight', '🤠', '⚔️', 'Gold', '🏴‍☠️'),
    wins: 2,
    mazesCleared: 4,
  },
  {
    id: 'hero-arcane-dragon',
    name: 'Император Драконов',
    baseEmoji: '🐉',
    accessoryEmoji: '👑',
    flagEmoji: '🌌',
    backgroundStyle: 'Gold',
    characterRole: 'Mage',
    ...calculateHeroStats('Mage', '🐉', '👑', 'Gold', '🌌'),
    wins: 5,
    mazesCleared: 3,
  },
];
