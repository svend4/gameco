import React from 'react';

interface SynergyCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SynergyCodexModal: React.FC<SynergyCodexModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Сравнение и Архитектура 2 Игр"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-4xl bg-[#1A1430] border border-purple-400/35 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-[#241B42] border-b border-purple-300/15">
          <div>
            <h2 className="text-xl font-bold text-white">
              📖 Архитектура Вселенной: Слияние Двух Эмодзи-Игр
            </h2>
            <p className="text-xs text-purple-200/75">
              Как механики Retro Emoji Maze и Emoji Avatar Studio объединены в единый геймплейный цикл
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
          {/* Two Apps Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#22193D] border border-purple-300/20 space-y-2">
              <h3 className="text-base font-bold text-amber-300">
                1. Retro Emoji Maze (Пространство и Аркада)
              </h3>
              <p className="text-xs text-purple-200/85 leading-relaxed">
                Отвечает за исследование процедурного мира: генерация лабиринтов алгоритмом поиска в глубину (DFS), сбор золотых звёзд ⭐ (+5 монет), эффект винтажного ЭЛТ-монитора (CRT Scanlines), магазин из 19 скинов и патрулирующих врагов на клеточной сетке.
              </p>
              <div className="pt-2 text-xs text-purple-300">
                Вклад в симбиоз: <strong>Где происходит приключение и как добываются ресурсы</strong>.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#22193D] border border-purple-300/20 space-y-2">
              <h3 className="text-base font-bold text-cyan-300">
                2. Emoji Avatar Studio (Герой и RPG-Арена)
              </h3>
              <p className="text-xs text-purple-200/85 leading-relaxed">
                Отвечает за индивидуальность героя и боевую систему: 6-слойная голографическая 3D-карточка с параллаксом (База + Оружие + Флаг + Стихия + Класс), расчёт характеристик (HP / ATK / DEF) и пошаговые дуэли с боссами и стихийными заклинаниями.
              </p>
              <div className="pt-2 text-xs text-purple-300">
                Вклад в симбиоз: <strong>Кто идёт в лабиринт и как проходят битвы со стражами</strong>.
              </div>
            </div>
          </div>

          {/* Shared Emoji Bestiary */}
          <div className="p-4 rounded-2xl bg-[#140E26] border border-purple-300/15 space-y-3">
            <h3 className="text-base font-bold text-white">
              🔗 Точки пересечения символов (Общий Бестиарий)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-2xl mb-1">👾 + 👻 + 🐉</div>
                <div className="font-bold text-white">Стражи и Боссы</div>
                <p className="text-purple-200/75 mt-1">
                  В лабиринте патрулируют коридоры, а при столкновении с игроком открывают полноэкранную RPG-дуэль из Avatar Studio.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-2xl mb-1">🦊 🤠 😎 🤖 👽 🦄</div>
                <div className="font-bold text-white">Единый Каталог Аватаров</div>
                <p className="text-purple-200/75 mt-1">
                  Монеты, собранные в лабиринте за звёзды ⭐ и победы, открывают скины в Ретро-Шкафу и дают бонусы к статам 3D-карточки.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-white/5">
                <div className="text-2xl mb-1">🏁 Финишный Портал</div>
                <div className="font-bold text-white">Символ Победы</div>
                <p className="text-purple-200/75 mt-1">
                  В Maze — это выход на следующий уровень и секретный скин за 200 монет, а в Studio — главная эмблема на карточке чемпиона.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
