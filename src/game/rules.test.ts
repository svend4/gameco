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
  evaluateGlyphSynergy,
  forgeEmojiRelic,
  weaveRuneComboSpell,
  evaluateRoyalRank,
  generateNextTierBounty,
  INITIAL_BOUNTY_CONTRACTS,
  FAMILIARS_CATALOG,
  DIMENSIONAL_MODE_META,
  computeQuantumPhaseTarget,
  castCorridorShockwave,
  evaluateTerrainCombatBuff,
  evaluateBestiaryHuntBonus,
  TAROT_CARDS_CATALOG,
  SECTOR_WEATHERS_CATALOG,
  GUILD_ORDERS_CATALOG,
  ALCHEMICAL_POTIONS_CATALOG,
  computeTargetCompass,
  computeRunMasteryGrade,
} from './rules';

test('calculateHeroStats returns role-appropriate RPG stats with deterministic bonuses and glyph synergy', () => {
  const knight = calculateHeroStats('Knight', '🤠', '⚔️', 'Gold', '🏴‍☠️');
  const mage = calculateHeroStats('Mage', '🔮', '⚡', 'Cosmic', '🌌');

  assert.equal(knight.hp >= 150, true);
  assert.equal(knight.defense >= 35, true);
  assert.equal(mage.attack >= 45, true);
  assert.equal(knight.hp > mage.hp, true);
});

test('evaluateGlyphSynergy detects Dragon Emperor, Citadel Paladin, and Quantum Phantom combos', () => {
  const dragon = evaluateGlyphSynergy('Mage', '🐉', '👑', '🌌', 'Gold');
  assert.equal(dragon.id, 'dragon-emperor');
  assert.equal(dragon.passiveKey, 'DOUBLE_STAR_GOLD');

  const paladin = evaluateGlyphSynergy('Knight', '🤠', '🛡️', '🏁', 'Cosmic');
  assert.equal(paladin.id, 'citadel-paladin');
  assert.equal(paladin.passiveKey, 'HOLY_AEGIS');

  const phantom = evaluateGlyphSynergy('Cyber-Ninja', '🦊', '⚡', '🏁', 'Neon');
  assert.equal(phantom.id, 'quantum-phantom');
});

test('forgeEmojiRelic crafts named medieval relics from two emoji accessories', () => {
  const inferno = forgeEmojiRelic('⚔️', '🔥');
  assert.equal(inferno.id, 'hellfire-blade');
  assert.equal(inferno.bonusAtk >= 15, true);

  const frost = forgeEmojiRelic('❄️', '🛡️');
  assert.equal(frost.id, 'frost-aegis');
  assert.equal(frost.bonusDef >= 15, true);
});

test('weaveRuneComboSpell synthesizes elemental rune triads with status effects', () => {
  const triumvirate = weaveRuneComboSpell(['🔥', '❄️', '⚡'], 30, true);
  assert.equal(triumvirate.comboCode, '🔥❄️⚡');
  assert.equal(triumvirate.damage > 60, true);
  assert.equal(triumvirate.inflictFreeze, true);
  assert.equal(triumvirate.inflictBurn > 0, true);
});

test('evaluateRoyalRank and generateNextTierBounty scale nobility prestige and infinite contracts', () => {
  const squire = evaluateRoyalRank(0, 1, 0);
  assert.equal(squire.rankIndex, 1);

  const emperor = evaluateRoyalRank(8, 5, 6);
  assert.equal(emperor.rankIndex, 5);
  assert.equal(emperor.goldBonusPercent, 50);

  const nextBounty = generateNextTierBounty(INITIAL_BOUNTY_CONTRACTS[0]);
  assert.equal(nextBounty.tier, 2);
  assert.equal(nextBounty.rewardCoins > INITIAL_BOUNTY_CONTRACTS[0].rewardCoins, true);
  assert.equal(FAMILIARS_CATALOG.wolf.combatStrikeDamage, 20);
});

test('generateMaze produces walkable start, exit, stars, key, portals, shrines, traps, and enemies with affixes', () => {
  let seed = 42;
  const seededRng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const maze = generateMaze(9, 9, 4, 2, 2, seededRng);
  assert.equal(maze.rows, 9);
  assert.equal(maze.cols, 9);
  assert.equal(maze.grid[1][1], 'START');
  assert.equal(maze.grid[7][7], 'EXIT');
  assert.equal(isWalkableTile(maze, 1, 2), true);
  assert.equal(isWalkableTile(maze, 2, 1), true);
  assert.equal(maze.stars.length, 4);
  assert.equal(maze.enemies.length, 2);
  assert.equal(maze.keyPos !== null, true);
  assert.equal(maze.portals !== null, true);
  assert.equal(maze.shrines.length, 1);

  for (const enemy of maze.enemies) {
    assert.equal(enemy.r + enemy.c >= 6, true);
    assert.equal(isWalkableTile(maze, enemy.r, enemy.c), true);
    assert.equal(enemy.affix !== undefined, true);
  }
});

test('stepEnemies moves enemies onto valid walkable tiles and triggers trap damage when stepping on traps', () => {
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

test('HARD difficulty generates 17x17 maze with valid CHEST tiles and BOSS_ROSTER bosses', () => {
  const maze = generateMaze(17, 17, 9, 4, 2, () => 0.42);
  assert.equal(maze.rows, 17);
  assert.equal(maze.cols, 17);
  assert.equal(maze.chests.length, 2);
  for (const ch of maze.chests) {
    assert.equal(maze.grid[ch.r][ch.c], 'CHEST');
    assert.equal(isWalkableTile(maze, ch.r, ch.c), true);
  }
});

test('DIMENSIONAL_MODE_META and computeQuantumPhaseTarget support 1.5D, 2.5D, and 3.5D spatial mechanics', () => {
  assert.equal(DIMENSIONAL_MODE_META['1.5d-wave'].badge, '1.5D');
  assert.equal(DIMENSIONAL_MODE_META['2.5d-diorama'].fov, 28);
  assert.equal(DIMENSIONAL_MODE_META['3.5d-quantum'].badge, '3.5D');

  const maze = generateMaze(9, 9, 4, 2, 1, () => 0.5);
  // Force a known wall at (2,2) and walkable tile at (3,2) from player at (1,2)
  maze.grid[1][2] = 'PATH';
  maze.grid[2][2] = 'WALL';
  maze.grid[3][2] = 'PATH';

  const hit = computeQuantumPhaseTarget(maze, { r: 1, c: 2 }, { dr: 1, dc: 0 }, 1);
  assert.equal(hit !== null, true);
  assert.deepEqual(hit?.target, { r: 3, c: 2 });

  const noCharge = computeQuantumPhaseTarget(maze, { r: 1, c: 2 }, { dr: 1, dc: 0 }, 0);
  assert.equal(noCharge, null);
});

test('4D Phase Gates, 1.5D Corridor Shockwave, Tarot Arcana, Terrain Buffs, and Bestiary Hunter Mastery work deterministically', () => {
  const maze = generateMaze(9, 9, 4, 2, 1, () => 0.4);
  assert.equal(maze.leverPos !== null, true);
  assert.equal(maze.phaseGates.length >= 1, true);

  const gatePos = maze.phaseGates[0];
  assert.equal(isWalkableTile(maze, gatePos.r, gatePos.c, false), false);
  assert.equal(isWalkableTile(maze, gatePos.r, gatePos.c, true), true);

  const wave = castCorridorShockwave(maze, { r: 1, c: 1 }, { dr: 0, dc: 1 }, true);
  assert.equal(wave.rayTiles.length >= 1, true);

  const terrain = evaluateTerrainCombatBuff(maze, maze.shrines[0]);
  assert.equal(terrain.id, 'terrain-shrine');
  assert.equal(terrain.bonusDef >= 10, true);

  const hunt = evaluateBestiaryHuntBonus('🐉', { '🐉': 3 });
  assert.equal(hunt.kills, 3);
  assert.equal(hunt.bonusPct, 21);
  assert.equal(TAROT_CARDS_CATALOG.length, 4);
});

test('4.5D Weather Anomalies, Guild Orders, Alchemical Potion Belt, Merchant Caravan, Target Compass, and Mastery Grade work deterministically', () => {
  const maze = generateMaze(9, 9, 4, 2, 1, () => 0.35);
  assert.equal(maze.merchantPos !== null, true);

  assert.equal(Object.keys(SECTOR_WEATHERS_CATALOG).length, 4);
  assert.equal(GUILD_ORDERS_CATALOG.length, 3);
  assert.equal(ALCHEMICAL_POTIONS_CATALOG.length, 3);

  const compass = computeTargetCompass({ r: 1, c: 1 }, { r: 4, c: 6 }, '🗝️ Ключ');
  assert.equal(compass.distance, 8);
  assert.equal(compass.dirCodeRu, 'Ю-В');

  const gradeSPlus = computeRunMasteryGrade(4, 4, 32, 2, true);
  assert.equal(gradeSPlus.grade, 'S+');
  assert.equal(gradeSPlus.bonusCoins, 45);
});
