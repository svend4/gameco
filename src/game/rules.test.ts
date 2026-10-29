import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHeroStats,
  generateMaze,
  isWalkableTile,
  stepEnemies,
  calculateAttackDamage,
  calculateSpecialSpellOutcome,
  purchaseSkinTransaction,
  SHOP_SKINS_CATALOG,
  INITIAL_HERO_ROSTER,
} from './rules';

test('calculateHeroStats returns role-appropriate RPG stats with deterministic bonuses', () => {
  const knight = calculateHeroStats('Knight', '🤠', '⚔️', 'Gold');
  const mage = calculateHeroStats('Mage', '🔮', '⚡', 'Cosmic');

  assert.equal(knight.hp >= 140 && knight.hp <= 155, true);
  assert.equal(knight.defense >= 30, true);
  assert.equal(mage.attack >= 35, true);
  assert.equal(knight.hp > mage.hp, true);
});

test('generateMaze produces walkable start, exit, stars, and enemies at safe distance', () => {
  let seed = 42;
  const seededRng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const maze = generateMaze(9, 9, 4, 2, 1, seededRng);
  assert.equal(maze.rows, 9);
  assert.equal(maze.cols, 9);
  assert.equal(maze.grid[1][1], 'START');
  assert.equal(maze.grid[7][7], 'EXIT');
  // Start has open neighbor at (1,2) and (2,1)
  assert.equal(isWalkableTile(maze, 1, 2), true);
  assert.equal(isWalkableTile(maze, 2, 1), true);
  assert.equal(maze.stars.length, 4);
  assert.equal(maze.enemies.length, 2);

  for (const enemy of maze.enemies) {
    assert.equal(enemy.r + enemy.c >= 6, true);
    assert.equal(isWalkableTile(maze, enemy.r, enemy.c), true);
  }
});

test('stepEnemies moves enemies onto valid walkable tiles and sets telegraphing near player', () => {
  const maze = generateMaze(9, 9, 4, 3, 1, () => 0.3);
  const stepped = stepEnemies(maze, maze.enemies, { r: 1, c: 2 }, () => 0.2);

  assert.equal(stepped.length, maze.enemies.length);
  for (const e of stepped) {
    assert.equal(isWalkableTile(maze, e.r, e.c), true);
  }
});

test('combat damage and elemental spell calculations respect crit and style rules', () => {
  const nonCrit = calculateAttackDamage(28, 12, 0.2, () => 0.5);
  const crit = calculateAttackDamage(28, 12, 0.2, () => 0.05);

  assert.equal(nonCrit.isCrit, false);
  assert.equal(crit.isCrit, true);
  assert.equal(crit.damage > nonCrit.damage, true);

  const hero = INITIAL_HERO_ROSTER[0];
  const spell = calculateSpecialSpellOutcome(hero, () => 0.5);
  assert.equal(spell.damage >= hero.attack + 15, true);
  assert.equal(spell.spellName.includes('Вспышка Сверхновой'), true);
});

test('purchaseSkinTransaction deducts coins and unlocks avatar skin when affordable', () => {
  const coolSkin = SHOP_SKINS_CATALOG.find((s) => s.emoji === '😎')!;
  const failRes = purchaseSkinTransaction(10, ['😀'], coolSkin);
  assert.equal(failRes.success, false);
  assert.equal(failRes.nextCoins, 10);

  const okRes = purchaseSkinTransaction(50, ['😀'], coolSkin);
  assert.equal(okRes.success, true);
  assert.equal(okRes.nextCoins, 35);
  assert.equal(okRes.nextUnlocked.includes('😎'), true);
});
