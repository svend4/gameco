import React, { useState } from 'react';
import {
  ACCESSORY_EMOJI_OPTIONS,
  BackgroundStyle,
  BASE_EMOJI_OPTIONS,
  calculateHeroStats,
  CharacterRole,
  ELEMENTAL_SPELLS,
  FLAG_EMOJI_OPTIONS,
  HeroAvatar,
  ROLE_METADATA,
  SHOP_SKINS_CATALOG,
  ShopSkin,
} from '../game/rules';
import { EmojiAvatarCard } from './EmojiAvatarCard';

interface AvatarStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeHero: HeroAvatar;
  savedHeroes: HeroAvatar[];
  onSelectHero: (hero: HeroAvatar) => void;
  onSaveNewHero: (hero: HeroAvatar) => void;
  onDeleteHero: (id: string) => void;
  coins: number;
  unlockedSkins: string[];
  onPurchaseOrEquipSkin: (skin: ShopSkin) => void;
  initialTab?: 'builder' | 'gallery' | 'shop';
}

const NAME_PREFIXES = ['Ловкий', 'Мудрый', 'Кибер-', 'Звёздный', 'Неоновый', 'Древний', 'Астральный', 'Ретро-'];
const NAME_SUFFIXES = ['Лис', 'Самурай', 'Шериф', 'Дракон', 'Астронавт', 'Магистр', 'Страж', 'Фантом'];

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  isOpen,
  onClose,
  activeHero,
  savedHeroes,
  onSelectHero,
  onSaveNewHero,
  onDeleteHero,
  coins,
  unlockedSkins,
  onPurchaseOrEquipSkin,
  initialTab = 'builder',
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'gallery' | 'shop'>(initialTab);
  const [builderName, setBuilderName] = useState(activeHero.name);
  const [baseEmoji, setBaseEmoji] = useState(activeHero.baseEmoji);
  const [accessoryEmoji, setAccessoryEmoji] = useState(activeHero.accessoryEmoji);
  const [flagEmoji, setFlagEmoji] = useState(activeHero.flagEmoji);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>(activeHero.backgroundStyle);
  const [role, setRole] = useState<CharacterRole>(activeHero.characterRole);
  const [shopCategory, setShopCategory] = useState<'All' | 'Smiley' | 'Retro' | 'Animals' | 'Love/Items'>('All');
  const [statusNotice, setStatusNotice] = useState<string>('');

  if (!isOpen) return null;

  const previewStats = calculateHeroStats(role, baseEmoji, accessoryEmoji, bgStyle);
  const spellMeta = ELEMENTAL_SPELLS[bgStyle];

  const handleRandomize = () => {
    const unlockedPool = BASE_EMOJI_OPTIONS.filter((e) => unlockedSkins.includes(e) || ['🦊', '🤠', '😎', '🤖', '🦁', '🐼'].includes(e));
    const pool = unlockedPool.length > 0 ? unlockedPool : BASE_EMOJI_OPTIONS;
    const rBase = pool[Math.floor(Math.random() * pool.length)];
    const rAcc = ACCESSORY_EMOJI_OPTIONS[Math.floor(Math.random() * ACCESSORY_EMOJI_OPTIONS.length)];
    const rFlag = FLAG_EMOJI_OPTIONS[Math.floor(Math.random() * FLAG_EMOJI_OPTIONS.length)];
    const styles: BackgroundStyle[] = ['Cosmic', 'Neon', 'Ocean', 'Forest', 'Gold'];
    const roles: CharacterRole[] = ['Knight', 'Mage', 'Cyber-Ninja', 'Chef', 'Astronaut'];
    const rBg = styles[Math.floor(Math.random() * styles.length)];
    const rRole = roles[Math.floor(Math.random() * roles.length)];
    const rName = `${NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]} ${
      NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)]
    }`;

    setBaseEmoji(rBase);
    setAccessoryEmoji(rAcc);
    setFlagEmoji(rFlag);
    setBgStyle(rBg);
    setRole(rRole);
    setBuilderName(rName);
    setStatusNotice(`Сгенерирован образ «${rName}»`);
  };

  const handleSaveHero = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = builderName.trim();
    if (!trimmed) {
      setStatusNotice('Пожалуйста, введите имя героя перед сохранением.');
      return;
    }
    const newHero: HeroAvatar = {
      id: `hero-${Date.now()}`,
      name: trimmed,
      baseEmoji,
      accessoryEmoji,
      flagEmoji,
      backgroundStyle: bgStyle,
      characterRole: role,
      ...previewStats,
      wins: 0,
      mazesCleared: 0,
    };
    onSaveNewHero(newHero);
    setStatusNotice(`Герой «${trimmed}» сохранён в базу и выбран активным бойцом!`);
  };

  const filteredSkins =
    shopCategory === 'All'
      ? SHOP_SKINS_CATALOG
      : SHOP_SKINS_CATALOG.filter((s) => s.category === shopCategory);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Студия Эмодзи-Аватаров и Магазин"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#1A1430] border border-purple-400/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-3.5 bg-[#241B42] border-b border-purple-300/15">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              Студия 3D-Аватаров и Ретро-Шкаф
            </h2>
            <p className="text-xs text-purple-200/75 truncate">
              Создавайте 3D-карточки со статами (Emoji Avatar Studio) и открывайте скины за монеты лабиринта (Retro Emoji Maze)
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/90 border border-purple-400/30 text-sm font-mono-tabular font-bold text-amber-300 whitespace-nowrap">
              🪙 {coins} монет
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть студию"
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Закрыть [Esc]
            </button>
          </div>
        </div>

        {/* Segmented Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-[#161029] border-b border-purple-300/10">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'builder'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200/80 hover:bg-white/5'
            }`}
          >
            🛠️ 3D-Конструктор Героя
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200/80 hover:bg-white/5'
            }`}
          >
            🎭 Галерея Бойцов ({savedHeroes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'shop'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200/80 hover:bg-white/5'
            }`}
          >
            🕹️ Шкаф Скинов Лабиринта ({unlockedSkins.length}/{SHOP_SKINS_CATALOG.length})
          </button>
        </div>

        {statusNotice && (
          <div className="px-6 py-1.5 bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-200 text-xs font-medium">
            {statusNotice}
          </div>
        )}

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'builder' && (
            <form onSubmit={handleSaveHero} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Live 3D Card & Calculated RPG Stats */}
              <div className="lg:col-span-5 lg:sticky lg:top-0 bg-[#22193D] border border-purple-300/15 rounded-2xl p-4 flex flex-col items-center">
                <span className="text-xs font-semibold text-purple-300/80 mb-2">
                  Интерактивный 3D-Параллакс (наведите курсор)
                </span>
                <EmojiAvatarCard
                  baseEmoji={baseEmoji}
                  accessoryEmoji={accessoryEmoji}
                  flagEmoji={flagEmoji}
                  bgStyle={bgStyle}
                  role={role}
                  sizePx={148}
                  hasGlow={true}
                  testId="studio-preview-card"
                />

                <div className="w-full mt-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-rose-300 font-semibold">❤️ Здоровье (HP)</span>
                    <span className="font-mono-tabular font-bold text-white">{previewStats.hp} / 170</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (previewStats.hp / 170) * 100)}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-amber-300 font-semibold">⚔️ Атака (ATK)</span>
                    <span className="font-mono-tabular font-bold text-white">{previewStats.attack} / 45</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (previewStats.attack / 45) * 100)}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-emerald-300 font-semibold">🛡️ Защита (DEF)</span>
                    <span className="font-mono-tabular font-bold text-white">{previewStats.defense} / 40</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (previewStats.defense / 40) * 100)}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="w-full mt-4 pt-3 border-t border-purple-300/15 text-xs text-purple-200/90 space-y-1">
                  <div className="font-semibold text-white">
                    Магия стихии: {spellMeta.spellName}
                  </div>
                  <div className="text-purple-300/75">{spellMeta.bonusDesc}</div>
                </div>
              </div>

              {/* Right Column: Customization Controls */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label htmlFor="hero-name-input" className="block text-xs font-semibold text-purple-200 mb-1">
                      Имя Героя
                    </label>
                    <input
                      id="hero-name-input"
                      type="text"
                      maxLength={22}
                      value={builderName}
                      onChange={(e) => setBuilderName(e.target.value)}
                      placeholder="Например: Кибер-Лис"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#140E26] border border-purple-400/30 text-white text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRandomize}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    🎲 Случайно
                  </button>
                </div>

                {/* 1. Base Emoji */}
                <div>
                  <span className="block text-xs font-semibold text-purple-200 mb-1">
                    1. Базовый Персонаж (влияет на бонус ОЗ):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {BASE_EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setBaseEmoji(emoji)}
                        aria-label={`Базовый эмодзи ${emoji}`}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-transform ${
                          baseEmoji === emoji
                            ? 'bg-purple-600 border-2 border-white scale-105'
                            : 'bg-[#140E26] border border-purple-300/20 hover:bg-purple-900/40'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Accessory Emoji */}
                <div>
                  <span className="block text-xs font-semibold text-purple-200 mb-1">
                    2. Аксессуар или Оружие (влияет на бонус АТК):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCESSORY_EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAccessoryEmoji(emoji)}
                        aria-label={`Аксессуар ${emoji}`}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-transform ${
                          accessoryEmoji === emoji
                            ? 'bg-purple-600 border-2 border-white scale-105'
                            : 'bg-[#140E26] border border-purple-300/20 hover:bg-purple-900/40'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Flag / Emblem */}
                <div>
                  <span className="block text-xs font-semibold text-purple-200 mb-1">
                    3. Флаг / Эмблема Ордена:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {FLAG_EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setFlagEmoji(emoji)}
                        aria-label={`Эмблема ${emoji}`}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-transform ${
                          flagEmoji === emoji
                            ? 'bg-purple-600 border-2 border-white scale-105'
                            : 'bg-[#140E26] border border-purple-300/20 hover:bg-purple-900/40'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Elemental Background & 5. RPG Class */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-purple-200 mb-1.5">
                      4. Стихия Фона (Заклинание):
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Cosmic', 'Neon', 'Ocean', 'Forest', 'Gold'] as BackgroundStyle[]).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setBgStyle(style)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors whitespace-nowrap ${
                            bgStyle === style
                              ? 'bg-purple-600 text-white border border-white'
                              : 'bg-[#140E26] text-purple-200 border border-purple-300/20 hover:bg-purple-900/40'
                          }`}
                        >
                          {ELEMENTAL_SPELLS[style].title}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-purple-200 mb-1.5">
                      5. Боевой RPG-Класс:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(['Cyber-Ninja', 'Knight', 'Mage', 'Chef', 'Astronaut'] as CharacterRole[]).map((rKey) => (
                        <button
                          key={rKey}
                          type="button"
                          onClick={() => setRole(rKey)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                            role === rKey
                              ? 'bg-purple-600 text-white border border-white'
                              : 'bg-[#140E26] text-purple-200 border border-purple-300/20 hover:bg-purple-900/40'
                          }`}
                        >
                          <span>{ROLE_METADATA[rKey].titleRu}</span>
                          <span className="text-[11px] opacity-75">{ROLE_METADATA[rKey].badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg transition-colors whitespace-nowrap"
                  >
                    💾 Сохранить и Выбрать Героя
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedHeroes.map((hero) => {
                  const isEquipped = hero.id === activeHero.id;
                  return (
                    <div
                      key={hero.id}
                      className={`p-4 rounded-2xl border flex items-center gap-4 transition-colors ${
                        isEquipped
                          ? 'bg-purple-900/40 border-purple-400'
                          : 'bg-[#22193D] border-purple-300/15'
                      }`}
                    >
                      <EmojiAvatarCard
                        baseEmoji={hero.baseEmoji}
                        accessoryEmoji={hero.accessoryEmoji}
                        flagEmoji={hero.flagEmoji}
                        bgStyle={hero.backgroundStyle}
                        role={hero.characterRole}
                        sizePx={96}
                        interactive={false}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white text-base truncate">{hero.name}</h3>
                          {isEquipped && (
                            <span className="text-xs font-semibold text-emerald-300">· Активен</span>
                          )}
                        </div>
                        <div className="text-xs text-purple-200/80 mt-0.5">
                          {ROLE_METADATA[hero.characterRole].titleRu} · {ELEMENTAL_SPELLS[hero.backgroundStyle].title}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs font-mono-tabular">
                          <span className="text-rose-300 font-semibold">❤️ {hero.hp}</span>
                          <span className="text-amber-300 font-semibold">⚔️ {hero.attack}</span>
                          <span className="text-emerald-300 font-semibold">🛡️ {hero.defense}</span>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectHero(hero);
                              setStatusNotice(`Выбран герой «${hero.name}»`);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                              isEquipped
                                ? 'bg-emerald-600 text-white'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {isEquipped ? 'Выбран в поход' : 'Выбрать бойца'}
                          </button>
                          {savedHeroes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteHero(hero.id)}
                              aria-label={`Удалить героя ${hero.name}`}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold transition-colors"
                            >
                              Удалить
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'shop' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(['All', 'Smiley', 'Retro', 'Animals', 'Love/Items'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setShopCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                        shopCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#22193D] text-purple-200 hover:bg-purple-900/40'
                      }`}
                    >
                      {cat === 'All' ? 'Все Скины' : cat}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-purple-300/80">
                  Покупка скина сразу устанавливает его на вашего текущего 3D-героя
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredSkins.map((skin) => {
                  const isUnlocked = unlockedSkins.includes(skin.emoji);
                  const isEquipped = activeHero.baseEmoji === skin.emoji;
                  const canAfford = coins >= skin.cost;

                  return (
                    <button
                      key={skin.emoji}
                      type="button"
                      onClick={() => {
                        onPurchaseOrEquipSkin(skin);
                        if (isUnlocked) {
                          setStatusNotice(`Скин ${skin.emoji} ${skin.name} экипирован!`);
                        } else if (canAfford) {
                          setStatusNotice(`Разблокирован и экипирован ${skin.emoji} ${skin.name}!`);
                        } else {
                          setStatusNotice(`Недостаточно монет для ${skin.name} (нужно ${skin.cost} 🪙). Собирайте ⭐ в лабиринте!`);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-center flex flex-col items-center justify-between h-36 transition-transform hover:scale-[1.02] ${
                        isEquipped
                          ? 'bg-purple-900/50 border-purple-400'
                          : isUnlocked
                          ? 'bg-[#22193D] border-purple-300/25'
                          : 'bg-[#161029] border-purple-300/10'
                      }`}
                    >
                      <span className="text-3xl leading-none mt-1">{skin.emoji}</span>
                      <div>
                        <div className="text-xs font-bold text-white truncate">{skin.name}</div>
                        <div className="text-[11px] text-purple-300/75">{skin.bonusStat}</div>
                      </div>
                      <div
                        className={`w-full py-1 rounded-lg text-[11px] font-bold font-mono-tabular ${
                          isEquipped
                            ? 'bg-emerald-600 text-white'
                            : isUnlocked
                            ? 'bg-purple-600/40 text-purple-100'
                            : canAfford
                            ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                            : 'bg-white/5 text-purple-300/50'
                        }`}
                      >
                        {isEquipped ? 'ЭКИПИРОВАН' : isUnlocked ? 'НАДЕТЬ' : `🪙 ${skin.cost}`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
