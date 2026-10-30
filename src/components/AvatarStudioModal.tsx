import React, { useState } from 'react';
import {
  ACCESSORY_EMOJI_OPTIONS,
  ACHIEVEMENTS_CATALOG,
  BackgroundStyle,
  BASE_EMOJI_OPTIONS,
  BOSS_ROSTER,
  calculateHeroStats,
  CharacterRole,
  ELEMENTAL_SPELLS,
  evaluateGlyphSynergy,
  FamiliarId,
  FAMILIARS_CATALOG,
  FLAG_EMOJI_OPTIONS,
  FORGE_RECIPES,
  forgeEmojiRelic,
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
  onUpgradeHero?: (heroId: string) => void;
  coins: number;
  unlockedSkins: string[];
  onPurchaseOrEquipSkin: (skin: ShopSkin) => void;
  onRollGachaSkin?: () => string | null;
  onForgeRelicForActiveHero?: (
    relicName: string,
    resultAccEmoji: string,
    bonusHp: number,
    bonusAtk: number,
    bonusDef: number,
    cost: number
  ) => void;
  activeFamiliarId?: FamiliarId;
  onSelectFamiliar?: (id: FamiliarId) => void;
  claimedAchievements?: string[];
  onChallengeBestiaryBoss?: (bossIndex: number) => void;
  initialTab?: 'builder' | 'gallery' | 'shop' | 'forge' | 'hall';
}

const NAME_PREFIXES = ['Ловкий', 'Мудрый', 'Кибер-', 'Звёздный', 'Неоновый', 'Древний', 'Астральный', 'Ретро-'];
const NAME_SUFFIXES = ['Лис', 'Паладин', 'Шериф', 'Дракон', 'Астронавт', 'Архимаг', 'Страж', 'Фантом'];

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  isOpen,
  onClose,
  activeHero,
  savedHeroes,
  onSelectHero,
  onSaveNewHero,
  onDeleteHero,
  onUpgradeHero,
  coins,
  unlockedSkins,
  onPurchaseOrEquipSkin,
  onRollGachaSkin,
  onForgeRelicForActiveHero,
  activeFamiliarId = 'owl',
  onSelectFamiliar,
  claimedAchievements = [],
  onChallengeBestiaryBoss,
  initialTab = 'builder',
}) => {
  const [activeTab, setActiveTab] = useState<'builder' | 'gallery' | 'shop' | 'forge' | 'hall'>(initialTab);
  const [builderName, setBuilderName] = useState(activeHero.name);
  const [baseEmoji, setBaseEmoji] = useState(activeHero.baseEmoji);
  const [accessoryEmoji, setAccessoryEmoji] = useState(activeHero.accessoryEmoji);
  const [flagEmoji, setFlagEmoji] = useState(activeHero.flagEmoji);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>(activeHero.backgroundStyle);
  const [role, setRole] = useState<CharacterRole>(activeHero.characterRole);
  const [shopCategory, setShopCategory] = useState<'All' | 'Smiley' | 'Retro' | 'Animals' | 'Love/Items'>('All');
  const [forgeIng1, setForgeIng1] = useState<string>('⚔️');
  const [forgeIng2, setForgeIng2] = useState<string>('🔥');
  const [statusNotice, setStatusNotice] = useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setBuilderName(activeHero.name);
      setBaseEmoji(activeHero.baseEmoji);
      setAccessoryEmoji(activeHero.accessoryEmoji);
      setFlagEmoji(activeHero.flagEmoji);
      setBgStyle(activeHero.backgroundStyle);
      setRole(activeHero.characterRole);
      setStatusNotice('');
    }
  }, [isOpen, initialTab, activeHero]);

  if (!isOpen) return null;

  const previewStats = calculateHeroStats(role, baseEmoji, accessoryEmoji, bgStyle, flagEmoji);
  const previewSynergy = evaluateGlyphSynergy(role, baseEmoji, accessoryEmoji, flagEmoji, bgStyle);
  const spellMeta = ELEMENTAL_SPELLS[bgStyle];
  const forgedPreview = forgeEmojiRelic(forgeIng1, forgeIng2);
  const currentFamiliar =
    FAMILIARS_CATALOG[activeFamiliarId] ?? FAMILIARS_CATALOG.owl;

  const handleExportHeroPosterPng = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, 600, 800);
      grad.addColorStop(0, '#1e1438');
      grad.addColorStop(1, '#0d081a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 800);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 8;
      ctx.strokeRect(24, 24, 552, 752);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(builderName || activeHero.name, 300, 90);

      ctx.fillStyle = '#fcd34d';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${previewSynergy.badgeEmoji} ${previewSynergy.titleRu}`, 300, 128);

      ctx.font = '140px sans-serif';
      ctx.fillText(baseEmoji, 300, 320);
      ctx.font = '64px sans-serif';
      ctx.fillText(accessoryEmoji, 410, 230);
      ctx.fillText(flagEmoji, 190, 360);
      ctx.fillText(currentFamiliar.emoji, 190, 220);

      ctx.fillStyle = '#e9d5ff';
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillText(
        `❤️ ОЗ: ${previewStats.hp}   ⚔️ АТК: ${previewStats.attack}   🛡️ ЗАЩ: ${previewStats.defense}`,
        300,
        490
      );

      ctx.fillStyle = '#c4b5fd';
      ctx.font = '18px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`Фамильяр: ${currentFamiliar.emoji} ${currentFamiliar.nameRu}`, 300, 545);
      ctx.fillText(`Магия: ${spellMeta.spellName}`, 300, 585);
      if (activeHero.forgedRelicName) {
        ctx.fillStyle = '#fde047';
        ctx.fillText(`Реликвия: ${activeHero.forgedRelicName}`, 300, 625);
      }

      ctx.fillStyle = '#a78bfa';
      ctx.font = 'bold 16px Outfit, sans-serif';
      ctx.fillText('EMOJI UNIVERSE 3D · КОЛЛЕКЦИОННАЯ КАРТОЧКА ГЕРОЯ', 300, 730);

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${(builderName || 'emoji-hero').replace(/\s+/g, '_')}_3d_card.png`;
      link.href = url;
      link.click();
      setStatusNotice('📸 Коллекционный 3D-Постер героя успешно сохранён в формате PNG!');
    } catch {
      setStatusNotice('📸 Постер сформирован!');
    }
  };

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
    setStatusNotice(`Герой «${trimmed}» [${previewSynergy.titleRu}] сохранён и выбран активным!`);
  };

  const filteredSkins =
    shopCategory === 'All'
      ? SHOP_SKINS_CATALOG
      : SHOP_SKINS_CATALOG.filter((s) => s.category === shopCategory);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Студия Эмодзи-Аватаров, Алхимическая Кузница и Магазин"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#1A1430] border border-purple-400/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-3.5 bg-[#241B42] border-b border-purple-300/15">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              Студия 3D-Героев, Фамильяров, Алхимическая Кузница и Скины
            </h2>
            <p className="text-xs text-purple-200/75 truncate">
              Собирайте Синергии Глифов, выбирайте 3D-фамильяра, куйте реликвии и экспортируйте PNG-постеры
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
        <div className="flex flex-wrap items-center gap-2 px-6 py-2.5 bg-[#161029] border-b border-purple-300/10">
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'builder'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200/80 hover:bg-white/5'
            }`}
          >
            🛠️ 3D-Конструктор + Фамильяр
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('forge')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'forge'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-200/85 hover:bg-white/5'
            }`}
          >
            ⚗️ Средневековая Кузница Рун
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200/80 hover:bg-white/5'
            }`}
          >
            🎭 Галерея ({savedHeroes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'shop'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-purple-200/80 hover:bg-white/5'
            }`}
          >
            🕹️ Шкаф Скинов ({unlockedSkins.length}/{SHOP_SKINS_CATALOG.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hall')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === 'hall'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-200/85 hover:bg-white/5'
            }`}
          >
            🏆 Достижения ({claimedAchievements.length}/{ACHIEVEMENTS_CATALOG.length}) и Бестиарий
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
              {/* Left Column: Live 3D Card & Calculated RPG Stats + Glyph Synergy + PNG Export */}
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

                {/* Semantic Glyph Synergy Banner */}
                <div className="w-full mt-4 p-3 rounded-xl bg-[#150E28] border border-amber-400/35 text-xs space-y-1">
                  <div className="font-bold text-amber-300 flex items-center justify-between">
                    <span>🧬 {previewSynergy.titleRu}</span>
                    <span>{previewSynergy.badgeEmoji}</span>
                  </div>
                  <p className="text-purple-200/85 text-[11px] leading-relaxed">
                    {previewSynergy.descriptionRu}
                  </p>
                </div>

                <div className="w-full mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-rose-300 font-semibold">❤️ Здоровье (HP)</span>
                    <span className="font-mono-tabular font-bold text-white">{previewStats.hp} / 190</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (previewStats.hp / 190) * 100)}%` }}
                      className="h-full bg-rose-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-amber-300 font-semibold">⚔️ Атака (ATK)</span>
                    <span className="font-mono-tabular font-bold text-white">{previewStats.attack} / 60</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (previewStats.attack / 60) * 100)}%` }}
                      className="h-full bg-amber-500 rounded-full"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-emerald-300 font-semibold">🛡️ Защита (DEF)</span>
                    <span className="font-mono-tabular font-bold text-white">{previewStats.defense} / 50</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, (previewStats.defense / 50) * 100)}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportHeroPosterPng}
                  className="w-full mt-3.5 py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/40 text-cyan-200 font-bold text-xs transition-colors"
                >
                  📸 Скачать 3D-Постер Карточки (PNG)
                </button>
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
                      placeholder="Например: Паладин Цитадели"
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
                    1. Базовый Персонаж (влияет на ОЗ и Синергию Глифов):
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
                    2. Оружие / Реликвия (влияет на АТК и Синергию):
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
                    3. Герб / Знамя Ордена:
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

                {/* 6. 3D Companion Familiar Selector */}
                <div>
                  <span className="block text-xs font-semibold text-purple-200 mb-1.5">
                    6. 3D-Фамильяр (Спутник в лабиринте и на RPG-Арене):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {Object.values(FAMILIARS_CATALOG).map((fam) => {
                      const isSel = activeFamiliarId === fam.id;
                      return (
                        <button
                          key={fam.id}
                          type="button"
                          onClick={() => {
                            onSelectFamiliar?.(fam.id);
                            setStatusNotice(`Выбран 3D-фамильяр: ${fam.emoji} ${fam.nameRu}`);
                          }}
                          className={`p-2 rounded-xl border text-left transition-colors ${
                            isSel
                              ? 'bg-cyan-600/35 border-cyan-300 text-white'
                              : 'bg-[#140E26] border-purple-300/20 text-purple-200 hover:bg-purple-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold flex items-center justify-between">
                            <span>
                              {fam.emoji} {fam.nameRu}
                            </span>
                            {isSel && <span className="text-[10px] text-cyan-200">✓ АКТИВЕН</span>}
                          </div>
                          <div className="text-[10px] text-purple-200/75 mt-0.5 leading-snug">
                            {fam.passiveDescRu}
                          </div>
                        </button>
                      );
                    })}
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

          {/* MEDIEVAL RUNE ALCHEMY FORGE TAB */}
          {activeTab === 'forge' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#22193D] border border-amber-400/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-amber-300">
                    ⚗️ Средневековая Наковальня Рун и Алхимии Эмодзи
                  </h3>
                  <p className="text-xs text-purple-200/85 max-w-xl">
                    Сплавьте два глифа оружия или стихии за <strong>25 🪙</strong>, чтобы выковать легендарный артефакт и навсегда повысить характеристики активного героя (<strong>{activeHero.name}</strong>).
                  </p>
                </div>
                {activeHero.forgedRelicName && (
                  <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-200 whitespace-nowrap">
                    Экипировано: {activeHero.forgedRelicName}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                <div className="md:col-span-7 space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-purple-200 mb-1.5">
                      Первая Руна (Оружие / Заготовка):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['⚔️', '🛡️', '👑', '💎', '🎩', '🚀'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setForgeIng1(em)}
                          className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center ${
                            forgeIng1 === em
                              ? 'bg-amber-600 border-2 border-white'
                              : 'bg-[#140E26] border border-purple-300/20'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-purple-200 mb-1.5">
                      Вторая Руна (Стихийная Сущность):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['🔥', '❄️', '⚡', '✨', '🍀', '🔮'].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setForgeIng2(em)}
                          className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center ${
                            forgeIng2 === em
                              ? 'bg-amber-600 border-2 border-white'
                              : 'bg-[#140E26] border border-purple-300/20'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-1">
                    <div className="text-xs font-semibold text-purple-300 mb-2">
                      Известные Свитки Рецептов Королевской Кузницы:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {FORGE_RECIPES.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setForgeIng1(rec.ing1);
                            setForgeIng2(rec.ing2);
                          }}
                          className="p-2.5 rounded-xl bg-[#140E26] hover:bg-purple-900/30 border border-purple-300/20 text-left text-xs"
                        >
                          <div className="font-bold text-amber-300">
                            {rec.ing1} + {rec.ing2} = {rec.nameRu}
                          </div>
                          <div className="text-[11px] text-purple-200/75 mt-0.5">
                            +{rec.bonusHp} ОЗ · +{rec.bonusAtk} АТК · +{rec.bonusDef} ЗАЩ
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Forge Result Preview Card */}
                <div className="md:col-span-5 p-5 rounded-3xl bg-[#22193D] border-2 border-amber-400/40 text-center space-y-4">
                  <div className="text-4xl">
                    {forgeIng1} ➕ {forgeIng2} ➡️ {forgedPreview.resultEmoji}
                  </div>
                  <div>
                    <div className="text-lg font-extrabold text-white">{forgedPreview.nameRu}</div>
                    <p className="text-xs text-purple-200/80 mt-1">{forgedPreview.effectRu}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 font-mono-tabular text-xs">
                    <div className="p-2 rounded-xl bg-[#140E26] text-rose-300 font-bold">
                      +{forgedPreview.bonusHp} ОЗ
                    </div>
                    <div className="p-2 rounded-xl bg-[#140E26] text-amber-300 font-bold">
                      +{forgedPreview.bonusAtk} АТК
                    </div>
                    <div className="p-2 rounded-xl bg-[#140E26] text-emerald-300 font-bold">
                      +{forgedPreview.bonusDef} ЗАЩ
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (coins < 25) {
                        setStatusNotice('Недостаточно золота для ковки (нужно 25 🪙)!');
                        return;
                      }
                      onForgeRelicForActiveHero?.(
                        forgedPreview.nameRu,
                        forgedPreview.resultEmoji,
                        forgedPreview.bonusHp,
                        forgedPreview.bonusAtk,
                        forgedPreview.bonusDef,
                        25
                      );
                      setStatusNotice(
                        `Выкована реликвия «${forgedPreview.nameRu}» для героя ${activeHero.name}!`
                      );
                    }}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-sm shadow-lg transition-colors"
                  >
                    🔨 Выковать и Зачаровать Героя (🪙 25)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedHeroes.map((hero) => {
                  const isEquipped = hero.id === activeHero.id;
                  const syn = evaluateGlyphSynergy(
                    hero.characterRole,
                    hero.baseEmoji,
                    hero.accessoryEmoji,
                    hero.flagEmoji,
                    hero.backgroundStyle
                  );
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
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono-tabular font-bold text-amber-300">
                            УР. {hero.upgradeLevel ?? 1}
                          </span>
                          {isEquipped && (
                            <span className="text-xs font-semibold text-emerald-300">· Активен</span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-300 font-semibold truncate">
                          {syn.titleRu}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs font-mono-tabular">
                          <span className="text-rose-300 font-semibold">❤️ {hero.hp}</span>
                          <span className="text-amber-300 font-semibold">⚔️ {hero.attack}</span>
                          <span className="text-emerald-300 font-semibold">🛡️ {hero.defense}</span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectHero(hero);
                              setStatusNotice(`Выбран герой «${hero.name}»`);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                              isEquipped
                                ? 'bg-emerald-600 text-white'
                                : 'bg-purple-600 hover:bg-purple-500 text-white'
                            }`}
                          >
                            {isEquipped ? 'В походе' : 'Выбрать'}
                          </button>

                          {onUpgradeHero && (
                            <button
                              type="button"
                              onClick={() => {
                                if (coins < 25) {
                                  setStatusNotice('Для прокачки в Кузнице нужно 25 🪙!');
                                  return;
                                }
                                onUpgradeHero(hero.id);
                                setStatusNotice(
                                  `🔨 Герой «${hero.name}» прокачан до УР. ${(hero.upgradeLevel ?? 1) + 1} (+15 ОЗ, +5 АТК, +4 ЗАЩ)!`
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              ⬆️ УР.+1 (25 🪙)
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const code = `${hero.name}|${hero.baseEmoji}${hero.accessoryEmoji}${hero.flagEmoji}|${hero.characterRole}|${hero.backgroundStyle}|HP:${hero.hp}/ATK:${hero.attack}/DEF:${hero.defense}`;
                              navigator.clipboard?.writeText(code).catch(() => {});
                              setStatusNotice(`📋 Код сборки «${hero.name}» скопирован в буфер обмена!`);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-purple-200 text-xs font-semibold transition-colors"
                            title="Скопировать код сборки героя"
                          >
                            📋 Код
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
                      {cat === 'All' ? 'Все 24 Скина' : cat}
                    </button>
                  ))}
                </div>

                {onRollGachaSkin && (
                  <button
                    type="button"
                    onClick={() => {
                      const msg = onRollGachaSkin();
                      if (msg) setStatusNotice(msg);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-400 hover:to-pink-500 text-white text-xs font-extrabold shadow-md transition-transform active:scale-95 whitespace-nowrap"
                  >
                    🎰 Капсула Удачи: Случайный Скин (30 🪙)
                  </button>
                )}
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

          {activeTab === 'hall' && (
            <div className="space-y-6">
              {/* Section 1: Achievements */}
              <div>
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider mb-3">
                  🏆 Зал Славы и Медали Мультивселенной ({claimedAchievements.length}/{ACHIEVEMENTS_CATALOG.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ACHIEVEMENTS_CATALOG.map((ach) => {
                    const unlocked = claimedAchievements.includes(ach.id);
                    return (
                      <div
                        key={ach.id}
                        className={`p-3.5 rounded-2xl border flex items-center gap-3.5 ${
                          unlocked
                            ? 'bg-amber-500/15 border-amber-400/50 text-white'
                            : 'bg-[#140E26] border-purple-300/15 text-purple-300/60'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-xl bg-black/40 flex items-center justify-center text-2xl shrink-0">
                          {ach.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white truncate">
                              {ach.title}
                            </span>
                            <span
                              className={`text-[11px] font-mono-tabular font-bold px-2 py-0.5 rounded-md ${
                                unlocked
                                  ? 'bg-emerald-500/30 text-emerald-200'
                                  : 'bg-white/5 text-amber-300/80'
                              }`}
                            >
                              {unlocked ? 'ПОЛУЧЕНО ✓' : `+${ach.rewardCoins} 🪙`}
                            </span>
                          </div>
                          <p className="text-xs text-purple-200/75 mt-0.5">{ach.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Interactive Boss Bestiary */}
              <div>
                <h3 className="text-sm font-extrabold text-rose-300 uppercase tracking-wider mb-3">
                  👾 Бестиарий 3D-Стражей Лабиринта (Вызов на Прямую Дуэль)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {BOSS_ROSTER.map((boss, idx) => (
                    <div
                      key={boss.name}
                      className="p-3.5 rounded-2xl bg-[#22193D] border border-rose-400/25 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#3B0A1E] border border-rose-400/40 flex items-center justify-center text-3xl shrink-0">
                          {boss.emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-white truncate">
                            {boss.name}
                          </div>
                          <div className="text-[11px] text-amber-300 font-semibold">
                            Уязвимость: {ELEMENTAL_SPELLS[boss.weakness].title}
                          </div>
                          <div className="text-[11px] text-purple-200/80 font-mono-tabular">
                            ❤️ {boss.hp} · ⚔️ {boss.atk} · 🪙 +{boss.reward}
                          </div>
                        </div>
                      </div>
                      {onChallengeBestiaryBoss && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onChallengeBestiaryBoss(idx);
                          }}
                          className="w-full py-1.5 rounded-xl bg-rose-600/40 hover:bg-rose-600 border border-rose-400/40 text-xs font-bold text-white transition-colors"
                        >
                          ⚔️ Вызвать на 3D-Дуэль
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
