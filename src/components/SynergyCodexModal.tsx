import React from 'react';
import {
  BESTIARY_LORE_CATALOG,
  BountyContract,
  ELEMENTAL_SPELLS,
  evaluateBestiaryHuntBonus,
  RoyalRankInfo,
} from '../game/rules';

interface SynergyCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
  bounties?: BountyContract[];
  royalRank?: RoyalRankInfo;
  bountiesCompletedCount?: number;
  bestiaryKills?: Record<string, number>;
}

export const SynergyCodexModal: React.FC<SynergyCodexModalProps> = ({
  isOpen,
  onClose,
  bounties = [],
  royalRank,
  bountiesCompletedCount = 0,
  bestiaryKills = {},
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Кодекс Вселенной, Бестиарий и Контракты Короля"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#1A1430] border border-purple-400/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-[#241B42] border-b border-purple-300/15">
          <div>
            <h2 className="text-xl font-bold text-white">
              📖 Королевский Кодекс, Бестиарий Стражей и Контракты
            </h2>
            <p className="text-xs text-purple-200/75">
              Трофейный гербовник охотника (+7% урона за трофей), Бесконечные указы Короля и 1.5D/2.5D/3.5D/4D механики
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Закрыть
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-sm text-purple-100/90">
          {/* Royal Nobility Prestige Banner */}
          {royalRank && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2B1B4D] to-[#1B1233] border border-amber-400/45 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-300/50 flex items-center justify-center text-3xl">
                  {royalRank.crestEmoji}
                </div>
                <div>
                  <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                    Королевский Титул Дворянства (Ранг #{royalRank.rankIndex})
                  </div>
                  <div className="text-lg font-extrabold text-white">{royalRank.titleRu}</div>
                  <div className="text-xs text-purple-200/80">
                    Королевская надбавка к золоту: +{royalRank.goldBonusPercent}% 🪙
                  </div>
                </div>
              </div>
              <div className="text-right font-mono-tabular">
                <div className="text-xs text-purple-300">ВЫПОЛНЕНО УКАЗОВ</div>
                <div className="text-xl font-extrabold text-amber-300">
                  📜 {bountiesCompletedCount}
                </div>
              </div>
            </div>
          )}

          {/* King's Tavern Bounty Board */}
          {bounties.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#22193D] border border-amber-400/35 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-amber-300">
                  📜 Доска Бесконечных Королевских Контрактов
                </h3>
                <span className="text-xs text-purple-200/80">
                  При выполнении контракта Король немедленно издаёт указ следующего ранга!
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {bounties.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border ${
                      b.completed
                        ? 'bg-emerald-950/60 border-emerald-400/50'
                        : 'bg-[#140E26] border-purple-300/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span>{b.titleRu}</span>
                      <span className="text-amber-300">+{b.rewardCoins} 🪙</span>
                    </div>
                    <p className="text-[11px] text-purple-200/80 mt-1">{b.descRu}</p>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-mono-tabular">
                      <span className={b.completed ? 'text-emerald-300 font-bold' : 'text-purple-300'}>
                        {b.completed ? '✓ ВЫПОЛНЕНО' : `Прогресс: ${b.progress}/${b.targetCount}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MEDIEVAL & CYBER BESTIARY GRIMOIRE */}
          <div className="p-4 rounded-2xl bg-[#1D1536] border border-rose-400/35 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-rose-300">
                🐉 Средневековый Бестиарий и Трофейный Гербовник Охотника
              </h3>
              <span className="text-xs text-purple-200/80">
                Каждая победа над видом даёт +7% к урону против него на RPG-Арене (до +35%)!
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {BESTIARY_LORE_CATALOG.map((creature) => {
                const hunt = evaluateBestiaryHuntBonus(creature.emoji, bestiaryKills);
                const weakMeta = ELEMENTAL_SPELLS[creature.weakness];
                return (
                  <div
                    key={creature.emoji}
                    className="p-3 rounded-xl bg-[#130E24] border border-purple-300/20 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{creature.emoji}</span>
                          <div>
                            <div className="text-xs font-extrabold text-white">{creature.nameRu}</div>
                            <div className="text-[10px] text-purple-300">{creature.titleRu}</div>
                          </div>
                        </div>
                        <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-[10px] font-mono-tabular font-bold text-rose-200">
                          🏆 {hunt.kills}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-200/75 mt-2 leading-snug">
                        {creature.loreRu}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-purple-300/15 flex items-center justify-between text-[10px] font-mono-tabular">
                      <span className="text-cyan-300">Уязвим: {weakMeta.title}</span>
                      <span className="font-bold text-amber-300">
                        Бонус охоты: +{hunt.bonusPct}% АТК
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Innovations Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#22193D] border border-purple-300/20 space-y-2">
              <h3 className="text-base font-bold text-amber-300">
                🏰 Средневековые, Таро и Полевые Механики
              </h3>
              <ul className="text-xs text-purple-200/85 space-y-1.5 list-disc pl-4">
                <li>
                  <strong>Рычаг Архитектора 🎚️ и 4D-Фазовые Заслонки 🟪</strong>: активируйте кованый рычаг в лабиринте (шагом или волной `[E]`), чтобы опустить стены-монолиты и открыть короткие проходы.
                </li>
                <li>
                  <strong>Свиток Окаменения 🗿 `[F]` (Полевая Магия)</strong>: за 2 ⚡ маны замораживает всех стражей в лабиринте на 3 такта и притягивает ближайшую звезду ⭐!
                </li>
                <li>
                  <strong>2.5D Карты Таро Судьбы 🃏 и Бонус Рельефа Арены</strong>: вытягивайте Аркан Судьбы перед походом и используйте рельеф клетки (Алтарь ⛩️, Портал 🌀, Шипы ⚙️) в пошаговой дуэли.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#22193D] border border-purple-300/20 space-y-2">
              <h3 className="text-base font-bold text-cyan-300">
                ⚡ Дробные Измерения (1.5D / 2.5D / 3.5D / 4.0D)
              </h3>
              <ul className="text-xs text-purple-200/85 space-y-1.5 list-disc pl-4">
                <li>
                  <strong>1.5D Резонансный Импульс `[E]`</strong>: пускает ударную волну по прямому коридору (до 5 клеток), собирая звёзды ⭐, переключая рычаги 🎚️ и оглушая стражей (-25% ОЗ).
                </li>
                <li>
                  <strong>2.5D HD-Диорама и Салют Кристаллов</strong>: изометрический Tilt-Shift (`FOV 28°`) и баллистический разлёт 48 кристаллов с отскоком от пола.
                </li>
                <li>
                  <strong>3.5D Квантум-Хроно `[Z]` / `[Q]`</strong>: голографический шлейф из 4 хроно-фантомов прошлых тактов и прицел квантового прыжка сквозь стены.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

