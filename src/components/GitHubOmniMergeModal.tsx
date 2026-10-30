import React, { useState } from 'react';
import {
  X,
  GitMerge,
  Sparkles,
  Download,
  Upload,
  CheckCircle2,
  Shield,
  Zap,
  Coins,
  Layers,
  Wrench,
  Copy,
} from 'lucide-react';
import {
  HeroAvatar,
  MULTIVERSE_TALENTS,
  GAME_MODES,
  GameModeKey,
  SECTOR_ANOMALIES,
  SectorAnomalyKey,
  LEGENDARY_GITHUB_HEROES,
  SHOP_SKINS_CATALOG,
  calculateTalentBonuses,
  mergeMultiverseProfiles,
  resolveGitConflictAdditive,
  MultiverseProfileSnapshot,
} from '../game/rules';

interface GitHubOmniMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  level: number;
  heroes: HeroAvatar[];
  unlockedSkins: string[];
  claimedAchievements: string[];
  talentRanks: Record<string, number>;
  gameMode: GameModeKey;
  sectorAnomaly: SectorAnomalyKey;
  onSelectGameMode: (mode: GameModeKey) => void;
  onSelectAnomaly: (anomaly: SectorAnomalyKey) => void;
  onUpgradeTalent: (talentId: string, cost: number) => void;
  onApplyMergedProfile: (merged: MultiverseProfileSnapshot, statusMsg: string) => void;
}

const SAMPLE_CONFLICT_SNIPPET = `<<<<<<< HEAD (Версия на GitHub)
export const EXTRA_GITHUB_BIOME = 'CRYSTAL_CAVERN';
export const GITHUB_BONUS_COINS = 100;
=======
export const MULTIVERSE_BIOMES_COUNT = 8;
export const AI_AUTOPILOT_ENABLED = true;
>>>>>>> aistudio-multiverse (Версия AI Studio)`;

export const GitHubOmniMergeModal: React.FC<GitHubOmniMergeModalProps> = ({
  isOpen,
  onClose,
  coins,
  level,
  heroes,
  unlockedSkins,
  claimedAchievements,
  talentRanks,
  gameMode,
  sectorAnomaly,
  onSelectGameMode,
  onSelectAnomaly,
  onUpgradeTalent,
  onApplyMergedProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'CONFLICT_FIXER' | 'MERGE' | 'TALENTS' | 'MODES'>(
    'CONFLICT_FIXER'
  );
  const [jsonInput, setJsonInput] = useState('');
  const [conflictInput, setConflictInput] = useState(SAMPLE_CONFLICT_SNIPPET);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const talentBonuses = calculateTalentBonuses(talentRanks);

  const currentSnapshot: MultiverseProfileSnapshot = {
    version: 'v6.0-Omni-Multiverse',
    coins,
    level,
    heroes,
    unlockedSkins,
    claimedAchievements,
    talentRanks,
  };

  const handleResolveGitConflict = () => {
    const res = resolveGitConflictAdditive(conflictInput);
    setConflictInput(res.resolvedCode);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(res.resolvedCode).catch(() => {});
    }
    if (res.conflictsResolved > 0) {
      setFeedback(
        `✅ Разрешено конфликтов Git: ${res.conflictsResolved}! Обе ветки объединены на увеличение (+${res.linesAdded} строк дополнено), результат скопирован в буфер обмена.`
      );
    } else {
      setFeedback(
        'ℹ️ Маркеры конфликта (<<<<<<< / ======= / >>>>>>>) не найдены — код уже чист и готов к отправке в GitHub!'
      );
    }
  };

  const handleInjectLegendaryBranch = () => {
    const merged = mergeMultiverseProfiles(currentSnapshot, {
      coins: 120,
      heroes: LEGENDARY_GITHUB_HEROES,
      unlockedSkins: ['🤖', '🦄', '🐯', '👑', '🐉'],
    });
    onApplyMergedProfile(
      merged,
      '🚀 Ветка GitHub «Omega Legendary Roster» объединена без потерь: +3 Легендарных Героя и +120 🪙!'
    );
    setFeedback(
      '✅ Добавлены 3 легендарных героя (Кибер-Паладин Омега, Серафим, Сёгун) и +120 монет!'
    );
  };

  const handleInjectFullWardrobeBranch = () => {
    const allEmojis = SHOP_SKINS_CATALOG.map((s) => s.emoji);
    const merged = mergeMultiverseProfiles(currentSnapshot, {
      coins: 200,
      unlockedSkins: allEmojis,
      talentRanks: {
        'talent-vitality-core': Math.max(talentRanks['talent-vitality-core'] ?? 0, 2),
        'talent-plasma-blade': Math.max(talentRanks['talent-plasma-blade'] ?? 0, 2),
      },
    });
    onApplyMergedProfile(
      merged,
      '🌌 Ветка GitHub «Full Wardrobe & Quantum Core» объединена: открыты все 24 скина, +200 🪙 и ранги талантов!'
    );
    setFeedback(
      '✅ Все 24 скина открыты, добавлено +200 🪙 и повышены ранги талантов без удаления ваших данных!'
    );
  };

  const handleExportCopy = () => {
    const serialized = JSON.stringify(currentSnapshot, null, 2);
    setJsonInput(serialized);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(serialized).catch(() => {});
    }
    setFeedback(
      '📋 Снимок вашего профиля скопирован в поле ниже (готов для GitHub / резервной копии)!'
    );
  };

  const handleImportMergeJson = () => {
    if (!jsonInput.trim()) {
      setFeedback(
        '⚠️ Вставьте JSON-снимок другой версии в текстовое поле для аддитивного слияния.'
      );
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput) as Partial<MultiverseProfileSnapshot>;
      const merged = mergeMultiverseProfiles(currentSnapshot, parsed);
      onApplyMergedProfile(
        merged,
        '🔄 Выполнено аддитивное слияние JSON-профиля: все герои, монеты, скины и таланты объединены без потерь!'
      );
      setFeedback('✅ Успешное слияние! Все показатели сложены и дополнены без удаления.');
    } catch {
      setFeedback('⚠️ Ошибка чтения JSON: проверьте корректность скобок формата JSON.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-indigo-500/40 bg-slate-900 p-4 sm:p-6 text-slate-100 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
              <GitMerge className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  🔄 Решение Конфликтов GitHub & Слияние на Увеличение (v1–v6)
                </h2>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                  Accept Both · Без Потерь
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Устранение ошибки конфликта GitHub (&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD ======= &gt;&gt;&gt;&gt;&gt;&gt;&gt;) методом сложения обеих веток
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('CONFLICT_FIXER')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'CONFLICT_FIXER'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Wrench className="h-3.5 w-3.5" />
              🛠️ Решатель Конфликта GitHub (&lt;&lt;&lt;&lt;&lt;&lt;&lt;)
            </button>
            <button
              onClick={() => setActiveTab('MERGE')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'MERGE'
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <GitMerge className="h-3.5 w-3.5" />
              📦 Слияние Веток & JSON
            </button>
            <button
              onClick={() => setActiveTab('TALENTS')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'TALENTS'
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              🌌 Дерево Талантов ({talentBonuses.totalRanks}/25)
            </button>
            <button
              onClick={() => setActiveTab('MODES')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 border ${
                activeTab === 'MODES'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:border-slate-500'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              🎮 Режимы & 🌦️ Аномалии
            </button>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-300">
            <Coins className="h-4 w-4" />
            <span>Казна: {coins} 🪙</span>
            <span className="text-slate-500">|</span>
            <span>Героев: {heroes.length}</span>
          </div>
        </div>

        {feedback && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-2 text-xs font-semibold text-emerald-200">
            <span>{feedback}</span>
            <button
              onClick={() => setFeedback(null)}
              className="text-emerald-400 hover:text-white ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'CONFLICT_FIXER' && (
            <div className="space-y-4">
              {/* Step-by-step GitHub Push Conflict Guide */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/25 p-4 space-y-2">
                <h3 className="text-sm font-black text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Почему возникает ошибка конфликта при отправке на GitHub и как её решить за 30 секунд?
                </h3>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Когда ветка на GitHub (`main`) уже содержит коммиты, сделанные напрямую на GitHub, а вы отправляете новую версию из AI Studio, Git останавливает перезапись, чтобы не стереть ваши изменения на GitHub.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3">
                    <div className="font-black text-amber-300">Шаг 1 · Новая ветка при экспорте</div>
                    <p className="mt-1 text-slate-300">
                      При отправке кода из AI Studio на GitHub выберите создание новой ветки (например, <code className="text-amber-200">multiverse-v6</code>) вместо принудительной записи в <code className="text-amber-200">main</code>.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3">
                    <div className="font-black text-cyan-300">Шаг 2 · Pull Request → Resolve Conflicts</div>
                    <p className="mt-1 text-slate-300">
                      На сайте GitHub откроется кнопка <strong>«Resolve conflicts»</strong>. Чтобы объединить код <strong>на увеличение</strong>, никогда не удаляйте код между маркерами — удалите только сами 3 строки маркеров: <code className="text-rose-300">&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code className="text-rose-300">=======</code> и <code className="text-rose-300">&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>!
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3">
                    <div className="font-black text-emerald-300">Шаг 3 · Авто-Склейщик ниже</div>
                    <p className="mt-1 text-slate-300">
                      Или просто вставьте текст конфликтного файла из GitHub в поле ниже и нажмите <strong>«Объединить Обе Ветки (Accept Both)»</strong> — алгоритм сам уберёт маркеры и сложит весь код!
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Conflict Marker Merger */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      🛠️ Автоматический Склейщик Конфликтов Git (Accept Both Changes / На Увеличение Кода)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Вставьте сюда код с маркерами <code className="text-rose-300">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</code> ... <code className="text-rose-300">=======</code> ... <code className="text-rose-300">&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code>, чтобы сохранить обе версии без удаления строк
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleResolveGitConflict}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg hover:bg-emerald-400 transition"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      ✨ Объединить Обе Ветки на Увеличение (Accept Both)
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(conflictInput).catch(() => {});
                        }
                        setFeedback('📋 Готовый объединённый код скопирован в буфер обмена!');
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Копировать
                    </button>
                  </div>
                </div>

                <textarea
                  value={conflictInput}
                  onChange={(e) => setConflictInput(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-300 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'MERGE' && (
            <div className="space-y-4">
              {/* 1-Click GitHub Branch Injectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-fuchsia-500/30 bg-slate-800/80 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-fuchsia-300">
                        Ветка GitHub #1 · Omega Roster
                      </span>
                      <span className="rounded bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">
                        +3 Героя · +120 🪙
                      </span>
                    </div>
                    <h4 className="mt-1 text-base font-bold text-white">
                      🤖 Легендарный Отряд Омега
                    </h4>
                    <p className="mt-1 text-xs text-slate-300">
                      Добавляет в ваш текущий список героев 3 прокачанных аватара 3-го ранга:{' '}
                      <strong>🤖 Кибер-Паладин Омега</strong>, <strong>🦄 Серафим Мультивселенной</strong> и{' '}
                      <strong>🐯 Изумрудный Сёгун</strong> без удаления созданных вами героев.
                    </p>
                  </div>
                  <button
                    onClick={handleInjectLegendaryBranch}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 py-2.5 text-xs font-black text-white shadow-lg hover:from-fuchsia-500 hover:to-indigo-500 transition"
                  >
                    ➕ Влить Ветку «Omega Roster» в Игру
                  </button>
                </div>

                <div className="rounded-2xl border border-amber-500/30 bg-slate-800/80 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                        Ветка GitHub #2 · Ultimate Wardrobe & Core
                      </span>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        24 Скина · +200 🪙
                      </span>
                    </div>
                    <h4 className="mt-1 text-base font-bold text-white">
                      👑 Полный Гардероб (24 Скина) + Квантовые Таланты
                    </h4>
                    <p className="mt-1 text-xs text-slate-300">
                      Разблокирует все 24 эмодзи-скина в Магазине, пополняет казну на +200 🪙 и повышает ранги базовых талантов Мультивселенной.
                    </p>
                  </div>
                  <button
                    onClick={handleInjectFullWardrobeBranch}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-black text-slate-950 shadow-lg hover:from-amber-400 hover:to-orange-400 transition"
                  >
                    ➕ Влить Ветку «Full Wardrobe & Core»
                  </button>
                </div>
              </div>

              {/* Manual JSON Snapshot Import / Export */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      🔄 Прямой Импорт / Экспорт JSON-Снимка (GitHub / Локальные сохранения)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Скопируйте текущий профиль для сохранения в GitHub или вставьте JSON из любой другой версии для объединения
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportCopy}
                      className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Экспорт в JSON
                    </button>
                    <button
                      onClick={handleImportMergeJson}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:bg-emerald-400 transition"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Объединить JSON
                    </button>
                  </div>
                </div>
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  rows={5}
                  placeholder="Нажмите «Экспорт в JSON», чтобы увидеть полный код вашего профиля, или вставьте сюда JSON из другой ветки для слияния..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 p-3 font-mono text-[11px] text-emerald-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'TALENTS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                  <div className="text-[10px] font-bold uppercase text-rose-300">Бонус ОЗ Отряда</div>
                  <div className="text-lg font-black text-white">+{talentBonuses.bonusHp} ❤️</div>
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                  <div className="text-[10px] font-bold uppercase text-amber-300">Бонус Атаки</div>
                  <div className="text-lg font-black text-white">+{talentBonuses.bonusAtk} ⚔️</div>
                </div>
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center">
                  <div className="text-[10px] font-bold uppercase text-cyan-300">Бонус Защиты</div>
                  <div className="text-lg font-black text-white">+{talentBonuses.bonusDef} 🛡️</div>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                  <div className="text-[10px] font-bold uppercase text-emerald-300">Монет за Звезду</div>
                  <div className="text-lg font-black text-white">+{talentBonuses.bonusStarCoins} 🪙</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MULTIVERSE_TALENTS.map((node) => {
                  const rank = talentRanks[node.id] ?? 0;
                  const isMax = rank >= node.maxRank;
                  const cost = node.baseCost + rank * 15;
                  const canAfford = coins >= cost && !isMax;

                  return (
                    <div
                      key={node.id}
                      className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 border border-slate-700 text-2xl">
                          {node.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-white">{node.name}</h4>
                            <span className="rounded-md bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                              Ранг {rank} / {node.maxRank}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-300">{node.desc}</p>
                        </div>
                      </div>

                      <button
                        disabled={!canAfford}
                        onClick={() => onUpgradeTalent(node.id, cost)}
                        className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition ${
                          isMax
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                            : canAfford
                            ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-md'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isMax ? 'МАКС' : `Улучшить · ${cost} 🪙`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'MODES' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-cyan-300 mb-2.5 flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  🎮 Выбор Режима Игры (Все режимы доступны одновременно)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(GAME_MODES) as GameModeKey[]).map((key) => {
                    const m = GAME_MODES[key];
                    const selected = gameMode === key;
                    return (
                      <button
                        key={key}
                        onClick={() => onSelectGameMode(key)}
                        className={`rounded-2xl border p-3.5 text-left transition ${
                          selected
                            ? 'border-cyan-400 bg-cyan-950/50 shadow-lg shadow-cyan-500/10'
                            : 'border-slate-700 bg-slate-800/70 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">
                            {m.icon} {m.label}
                          </span>
                          <span className="rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            Награда ×{m.coinMultiplier}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-300">{m.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-fuchsia-300 mb-2.5 flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  🌦️ Квантовые Аномалии и Погода Сектора (Дополнительные Бонусы)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {(Object.keys(SECTOR_ANOMALIES) as SectorAnomalyKey[]).map((key) => {
                    const anom = SECTOR_ANOMALIES[key];
                    const selected = sectorAnomaly === key;
                    return (
                      <button
                        key={key}
                        onClick={() => onSelectAnomaly(key)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          selected
                            ? 'border-fuchsia-400 bg-fuchsia-950/50 shadow-lg shadow-fuchsia-500/10'
                            : 'border-slate-700 bg-slate-800/70 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-white">
                            {anom.icon} {anom.label}
                          </span>
                          {selected && (
                            <span className="text-[10px] font-bold text-fuchsia-300">АКТИВНО</span>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] text-slate-300 leading-snug">{anom.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
