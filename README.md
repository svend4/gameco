# Emoji Universe: Maze & RPG Studio (`gameco`)

Объединённая ретро-аркада в 3D-лабиринтах и RPG-студия эмодзи: создание 3D-карточек героев с параллаксом, исследование биомов и лабиринтов, сражения на арене со щитами, заклинаниями и зельями, транзитная система `Liminal Stargate`, кодекс синергий глифов и серверная поддержка Gemini API.

Проект настроен с поддержкой Google AI Studio (`metadata.json`, `public/assets/aistudio/`, `vite.config.ts`).

## Структура репозитория

- `index.html` — точка входа HTML с заголовком *Emoji Universe: Maze & RPG Studio*.
- `metadata.json` — конфигурация возможностей AI Studio (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`).
- `vite.config.ts`, `tsconfig.json`, `package.json`, `bun.lock` — конфигурация сборки Vite, TypeScript и зависимостей.
- `src/`:
  - `App.tsx`, `main.tsx`, `index.css` — основное приложение React и стили;
  - `components/`:
    - `Maze3DViewport.tsx` — 3D-вьюпорт лабиринта на Three.js;
    - `CartographerMinimap.tsx` — миникарта картографа;
    - `EmojiAvatarCard.tsx`, `AvatarStudioModal.tsx` — 3D-карточка и студия аватаров эмодзи;
    - `ArenaBattleModal.tsx` — модальное окно боевой арены (включая механику щитов);
    - `LiminalStargateTransitModal.tsx` — транзитная система перемещения `Liminal Stargate`;
    - `SynergyCodexModal.tsx` — кодекс синергий;
    - `GitHubOmniMergeModal.tsx` — модальное окно `GitHub Omni Merge`;
  - `game/`:
    - `rules.ts` — игровые правила (биомы, боссы, заклинания, зелья, таланты, характеристики героев, ранги, синергии глифов, контракты);
    - `rules.test.ts` — модульные тесты игровой логики;
    - `sound.ts` — звуковая система.
- `public/assets/aistudio/` — ресурсы Google AI Studio.
- `LICENSE` — текст лицензии AGPL-3.0.

## Технологический стек

- **Frontend:** React `^19.0.1`, TypeScript `^7.0.2`, Vite `^8.3.0`, Tailwind CSS `^4.3.3` (`@tailwindcss/vite`)
- **3D и анимации:** Three.js `^0.186.1` (`@types/three`), Motion `^12.23.24`, Lucide React `^0.546.0`
- **AI и серверные зависимости:** `@google/genai` `^2.4.0`, Express `^4.21.2`, `dotenv` `^17.2.3`, `tsx` `^4.21.0`

## Установка и команды (`package.json`)

Установка зависимостей:

```bash
bun install
# или: npm install
```

Доступные скрипты:

- `bun run dev` — запуск dev-сервера Vite (`vite --port=3000 --host=0.0.0.0`)
- `bun run build` — сборка проекта (`vite build`)
- `bun run preview` — предпросмотр собранного бандла (`vite preview`)
- `bun run lint` — проверка типов TypeScript (`tsc --noEmit`)
- `bun run clean` — очистка артефактов сборки (`rm -rf dist server.js`)

## Ветки репозитория

- `main` — основная (и единственная исходная) ветка репозитория; других неслитых веток или открытых PR до создания PR с данным `README.md` в репозитории не было.

## Лицензия

Проект распространяется под лицензией [GNU Affero General Public License v3.0](LICENSE).
