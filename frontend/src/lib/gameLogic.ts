export interface Tile {
  id: number;
  fruitType: string;
  matched: boolean;
  covered: boolean;
  coveredBy?: number;
  frozen?: boolean;
  hidden?: boolean;
  chained?: boolean; // Boss level mechanic: chained fruits
}

export interface PowerUp {
  type: string;
  count: number;
}

export interface BossObjective {
  type: 'chained' | 'timed' | 'explosion-chain';
  description: string;
  completed: boolean;
}

export interface Level {
  tiles: Tile[];
  timeLimit: number;
  powerUps: PowerUp[];
  isBoss?: boolean;
  bossObjective?: BossObjective;
}

const FRUIT_TYPES = ['apple', 'orange', 'banana', 'grape', 'strawberry', 'cherry', 'watermelon', 'pineapple'];

/**
 * Calculate world-specific baseline difficulty multiplier
 * Each world introduces additional baseline difficulty compared to previous worlds
 * Extended to support 12 worlds with progressive scaling
 */
function getWorldDifficultyMultiplier(worldId: number): number {
  switch (worldId) {
    case 1: return 1.0;    // Garden - baseline
    case 2: return 1.15;   // Ocean - 15% harder
    case 3: return 1.30;   // Candyland - 30% harder
    case 4: return 1.45;   // Forest - 45% harder
    case 5: return 1.60;   // Volcano - 60% harder
    case 6: return 1.75;   // Space - 75% harder
    case 7: return 1.90;   // Desert - 90% harder
    case 8: return 2.05;   // Arctic - 105% harder
    case 9: return 2.20;   // Jungle - 120% harder
    case 10: return 2.35;  // Crystal - 135% harder
    case 11: return 2.50;  // Shadow - 150% harder
    case 12: return 2.65;  // Rainbow - 165% harder
    default: return 1.0;
  }
}

/**
 * Calculate advanced difficulty parameters with both intra-world and inter-world scaling
 * Provides compound difficulty progression across 30 levels per world and 12 worlds
 */
function calculateAdvancedDifficultyParams(worldId: number, levelId: number) {
  // Normalize level to 0-1 range for smooth intra-world scaling (30 levels)
  const normalizedLevel = (levelId - 1) / 29;
  
  // Get world-specific baseline multiplier for inter-world scaling
  const worldMultiplier = getWorldDifficultyMultiplier(worldId);
  
  // Boss levels (level 30) get enhanced difficulty
  const isBoss = levelId === 30;
  const bossMultiplier = isBoss ? 1.5 : 1.0;
  
  // Required matches with compound scaling
  // Base range: 6-12 pairs early, 30-50 pairs late
  // World multiplier increases the upper bound significantly
  const basePairMin = 6;
  const basePairMax = 30 + Math.floor(20 * (worldMultiplier - 1.0));
  const pairCount = Math.floor((basePairMin + normalizedLevel * (basePairMax - basePairMin)) * bossMultiplier);
  
  // Time limits with compound pressure
  // Base range: 150s early, 60-90s late
  // World multiplier reduces available time further
  // Boss levels get stricter time constraints
  const baseMaxTime = 150;
  const baseMinTime = Math.max(60, 120 - Math.floor(30 * (worldMultiplier - 1.0)));
  const timeLimit = Math.floor((baseMaxTime - normalizedLevel * (baseMaxTime - baseMinTime)) / (isBoss ? 1.2 : 1.0));
  
  // Obstacle density with exponential scaling
  // Base range: 0-40% early worlds, up to 80% in late worlds
  const baseMinDensity = 0.0;
  const baseMaxDensity = 0.4 + (0.4 * (worldMultiplier - 1.0) / 1.65);
  const obstacleDensity = (baseMinDensity + normalizedLevel * (baseMaxDensity - baseMinDensity)) * bossMultiplier;
  
  // Layer depth increases with both level and world progression
  // Early levels: 1-2 layers, Mid levels: 3-4 layers, Late levels + advanced worlds: 5-7 layers
  // Boss levels get maximum layer depth
  let layerDepth = 1;
  if (isBoss) {
    layerDepth = Math.min(8, 6 + Math.floor(worldId / 3));
  } else if (levelId <= 5) {
    layerDepth = worldId <= 2 ? 1 : 2;
  } else if (levelId <= 10) {
    layerDepth = worldId <= 2 ? 2 : worldId <= 4 ? 3 : 4;
  } else if (levelId <= 15) {
    layerDepth = worldId <= 3 ? 2 : worldId <= 6 ? 4 : 5;
  } else if (levelId <= 20) {
    layerDepth = worldId <= 4 ? 3 : worldId <= 8 ? 5 : 6;
  } else if (levelId <= 25) {
    layerDepth = worldId <= 6 ? 4 : worldId <= 10 ? 6 : 7;
  } else {
    layerDepth = worldId <= 8 ? 5 : worldId <= 11 ? 7 : 8;
  }
  
  // Tile variety increases with world progression for added complexity
  const tileVariety = Math.min(FRUIT_TYPES.length, 4 + Math.floor(worldId * 0.4) + Math.floor(normalizedLevel * 2));
  
  // Move efficiency requirement (for star calculations)
  // Higher worlds require better accuracy
  const moveEfficiencyRequired = 0.7 + (0.2 * (worldMultiplier - 1.0) / 1.65) + (normalizedLevel * 0.1);
  
  return {
    pairCount,
    timeLimit,
    obstacleDensity,
    layerDepth,
    tileVariety,
    moveEfficiencyRequired,
    normalizedLevel,
    worldMultiplier,
    isBoss
  };
}

/**
 * Generate boss objective based on world theme
 */
function generateBossObjective(worldId: number): BossObjective {
  const objectives: Array<BossObjective['type']> = ['chained', 'timed', 'explosion-chain'];
  const objectiveType = objectives[worldId % 3];
  
  const descriptions: Record<BossObjective['type'], string> = {
    'chained': 'Zincirleme meyveleri sırayla eşleştirin',
    'timed': 'Süre dolmadan tüm karoları temizleyin',
    'explosion-chain': 'Patlama zincirlerini önleyin'
  };
  
  return {
    type: objectiveType,
    description: descriptions[objectiveType],
    completed: false
  };
}

/**
 * Apply world-specific mechanics with advanced progressive difficulty scaling
 * Each world has unique obstacle patterns that scale with level progression
 * Extended to support 12 worlds with unique mechanics
 */
function applyWorldMechanics(
  tiles: Tile[], 
  worldId: number, 
  levelId: number, 
  obstacleDensity: number, 
  layerDepth: number,
  isBoss: boolean
) {
  const tileCount = tiles.length;
  const worldMultiplier = getWorldDifficultyMultiplier(worldId);
  
  // Adjust obstacle density based on world difficulty
  const adjustedDensity = obstacleDensity * worldMultiplier;
  
  // Boss levels get special chained fruit mechanic
  if (isBoss) {
    const chainCount = Math.floor(tileCount * 0.2);
    for (let i = 0; i < chainCount; i++) {
      if (i < tileCount) {
        tiles[i].chained = true;
      }
    }
  }
  
  switch (worldId) {
    case 1: // Garden - gentle introduction with gradual layering
      if (levelId > 3) {
        const coverCount = Math.floor(tileCount * adjustedDensity * 0.4);
        for (let i = 0; i < coverCount; i++) {
          tiles[i].covered = true;
          if (i + coverCount < tileCount) {
            tiles[i].coveredBy = tiles[i + coverCount].id;
          }
        }
      }
      break;
      
    case 2: // Ocean - wave-pattern obstacles with increasing layers
      const oceanCoverCount = Math.floor(tileCount * adjustedDensity * 0.6);
      for (let i = 0; i < oceanCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / layerDepth), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      if (levelId > 12) {
        const frozenCount = Math.floor(tileCount * 0.15);
        for (let i = 0; i < frozenCount; i += 3) {
          if (i < tileCount && !tiles[i].covered) {
            tiles[i].frozen = true;
          }
        }
      }
      break;
      
    case 3: // Candyland - sweet-themed challenges with candy-specific patterns
      const candyObstacleCount = Math.floor(tileCount * adjustedDensity * 0.65);
      for (let i = 0; i < candyObstacleCount; i += 2) {
        if (i < tileCount) {
          tiles[i].covered = true;
          if (i + candyObstacleCount < tileCount) {
            tiles[i].coveredBy = tiles[i + candyObstacleCount].id;
          }
        }
      }
      
      if (levelId > 10) {
        const hiddenCount = Math.floor(tileCount * 0.2);
        for (let i = 0; i < hiddenCount; i += 4) {
          if (i < tileCount && !tiles[i].covered) {
            tiles[i].hidden = true;
          }
        }
      }
      break;
      
    case 4: // Forest - nature-based obstacles with tree-layer complexity
      const frozenCount = Math.floor(tileCount * adjustedDensity * 0.5);
      for (let i = 0; i < frozenCount; i++) {
        const index = Math.floor(i * (tileCount / frozenCount));
        if (index < tileCount) {
          tiles[index].frozen = true;
        }
      }
      
      if (levelId > 8) {
        const forestCoverCount = Math.floor(tileCount * adjustedDensity * 0.5);
        for (let i = 0; i < forestCoverCount; i++) {
          tiles[i].covered = true;
          if (i + forestCoverCount < tileCount) {
            tiles[i].coveredBy = tiles[i + forestCoverCount].id;
          }
        }
      }
      break;
      
    case 5: // Volcano - intense heat-themed challenges with lava-rock obstacles
      const volcanoCoverCount = Math.floor(tileCount * adjustedDensity * 0.75);
      for (let i = 0; i < volcanoCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / (layerDepth + 1)), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      if (levelId > 6) {
        const volcanoFrozenCount = Math.floor(tileCount * 0.25);
        for (let i = 0; i < volcanoFrozenCount; i += 3) {
          if (i < tileCount && !tiles[i].covered) {
            tiles[i].frozen = true;
          }
        }
      }
      
      if (levelId > 14) {
        const volcanoHiddenCount = Math.floor(tileCount * 0.15);
        for (let i = 0; i < volcanoHiddenCount; i += 5) {
          if (i < tileCount && !tiles[i].covered && !tiles[i].frozen) {
            tiles[i].hidden = true;
          }
        }
      }
      break;
      
    case 6: // Space - advanced cosmic puzzles with stellar complexity
      const hiddenCount = Math.floor(tileCount * adjustedDensity * 0.4);
      for (let i = 0; i < hiddenCount; i++) {
        const index = Math.floor(i * (tileCount / hiddenCount));
        if (index < tileCount) {
          tiles[index].hidden = true;
        }
      }
      
      const spaceCoverCount = Math.floor(tileCount * adjustedDensity * 0.8);
      for (let i = 0; i < spaceCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / layerDepth), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      if (levelId > 5) {
        const spaceFrozenCount = Math.floor(tileCount * 0.3);
        for (let i = 0; i < spaceFrozenCount; i += 2) {
          if (i < tileCount && !tiles[i].covered && !tiles[i].hidden) {
            tiles[i].frozen = true;
          }
        }
      }
      break;

    case 7: // Desert - sandy obstacles with heat waves
      const desertCoverCount = Math.floor(tileCount * adjustedDensity * 0.7);
      for (let i = 0; i < desertCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / layerDepth), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      if (levelId > 8) {
        const desertHiddenCount = Math.floor(tileCount * 0.25);
        for (let i = 0; i < desertHiddenCount; i += 3) {
          if (i < tileCount && !tiles[i].covered) {
            tiles[i].hidden = true;
          }
        }
      }
      break;

    case 8: // Arctic - ice-themed with frozen obstacles
      const arcticFrozenCount = Math.floor(tileCount * adjustedDensity * 0.6);
      for (let i = 0; i < arcticFrozenCount; i++) {
        const index = Math.floor(i * (tileCount / arcticFrozenCount));
        if (index < tileCount) {
          tiles[index].frozen = true;
        }
      }
      
      const arcticCoverCount = Math.floor(tileCount * adjustedDensity * 0.65);
      for (let i = 0; i < arcticCoverCount; i++) {
        tiles[i].covered = true;
        if (i + arcticCoverCount < tileCount) {
          tiles[i].coveredBy = tiles[i + arcticCoverCount].id;
        }
      }
      break;

    case 9: // Jungle - dense vegetation with complex layers
      const jungleCoverCount = Math.floor(tileCount * adjustedDensity * 0.8);
      for (let i = 0; i < jungleCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / (layerDepth + 1)), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      if (levelId > 10) {
        const jungleHiddenCount = Math.floor(tileCount * 0.3);
        for (let i = 0; i < jungleHiddenCount; i += 2) {
          if (i < tileCount && !tiles[i].covered) {
            tiles[i].hidden = true;
          }
        }
      }
      break;

    case 10: // Crystal - prismatic challenges with gem-like obstacles
      const crystalCoverCount = Math.floor(tileCount * adjustedDensity * 0.75);
      for (let i = 0; i < crystalCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / layerDepth), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      const crystalFrozenCount = Math.floor(tileCount * 0.35);
      for (let i = 0; i < crystalFrozenCount; i += 2) {
        if (i < tileCount && !tiles[i].covered) {
          tiles[i].frozen = true;
        }
      }
      
      if (levelId > 12) {
        const crystalHiddenCount = Math.floor(tileCount * 0.2);
        for (let i = 0; i < crystalHiddenCount; i += 3) {
          if (i < tileCount && !tiles[i].covered && !tiles[i].frozen) {
            tiles[i].hidden = true;
          }
        }
      }
      break;

    case 11: // Shadow - mysterious dark obstacles with maximum complexity
      const shadowHiddenCount = Math.floor(tileCount * adjustedDensity * 0.5);
      for (let i = 0; i < shadowHiddenCount; i++) {
        const index = Math.floor(i * (tileCount / shadowHiddenCount));
        if (index < tileCount) {
          tiles[index].hidden = true;
        }
      }
      
      const shadowCoverCount = Math.floor(tileCount * adjustedDensity * 0.85);
      for (let i = 0; i < shadowCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / layerDepth), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      if (levelId > 8) {
        const shadowFrozenCount = Math.floor(tileCount * 0.3);
        for (let i = 0; i < shadowFrozenCount; i += 2) {
          if (i < tileCount && !tiles[i].covered && !tiles[i].hidden) {
            tiles[i].frozen = true;
          }
        }
      }
      break;

    case 12: // Rainbow - legendary difficulty with all obstacle types
      const rainbowCoverCount = Math.floor(tileCount * adjustedDensity * 0.9);
      for (let i = 0; i < rainbowCoverCount; i++) {
        tiles[i].covered = true;
        const coverIndex = Math.min(i + Math.floor(tileCount / (layerDepth + 1)), tileCount - 1);
        tiles[i].coveredBy = tiles[coverIndex].id;
      }
      
      const rainbowFrozenCount = Math.floor(tileCount * 0.4);
      for (let i = 0; i < rainbowFrozenCount; i += 2) {
        if (i < tileCount && !tiles[i].covered) {
          tiles[i].frozen = true;
        }
      }
      
      if (levelId > 10) {
        const rainbowHiddenCount = Math.floor(tileCount * 0.35);
        for (let i = 0; i < rainbowHiddenCount; i += 2) {
          if (i < tileCount && !tiles[i].covered && !tiles[i].frozen) {
            tiles[i].hidden = true;
          }
        }
      }
      break;
  }
}

/**
 * Generate level with advanced progressive difficulty scaling
 * Implements both intra-world level progression (30 levels) and inter-world difficulty escalation (12 worlds)
 * Level 30 of each world is designated as a boss level with special mechanics
 */
export function generateLevel(worldId: number, levelId: number): Level {
  // Validate inputs
  if (worldId < 1 || worldId > 12) {
    console.error(`Invalid worldId: ${worldId}, defaulting to 1`);
    worldId = 1;
  }
  if (levelId < 1 || levelId > 30) {
    console.error(`Invalid levelId: ${levelId}, defaulting to 1`);
    levelId = 1;
  }

  // Calculate advanced difficulty parameters with compound scaling
  const { 
    pairCount, 
    timeLimit, 
    obstacleDensity, 
    layerDepth, 
    tileVariety,
    normalizedLevel,
    isBoss
  } = calculateAdvancedDifficultyParams(worldId, levelId);
  
  const tiles: Tile[] = [];
  const fruitPool = FRUIT_TYPES.slice(0, Math.min(tileVariety, FRUIT_TYPES.length));
  
  // Generate pairs with appropriate fruit variety
  for (let i = 0; i < pairCount; i++) {
    const fruitType = fruitPool[i % fruitPool.length];
    tiles.push(
      {
        id: i * 2,
        fruitType,
        matched: false,
        covered: false,
      },
      {
        id: i * 2 + 1,
        fruitType,
        matched: false,
        covered: false,
      }
    );
  }

  // Shuffle tiles for randomization
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Apply world-specific mechanics with advanced progressive difficulty
  applyWorldMechanics(tiles, worldId, levelId, obstacleDensity, layerDepth, isBoss);

  // Power-up availability scales with difficulty to maintain balance
  // All power-ups available from start, but counts decrease in harder levels/worlds
  const worldMultiplier = getWorldDifficultyMultiplier(worldId);
  const difficultyFactor = normalizedLevel * worldMultiplier;
  
  const powerUps: PowerUp[] = [
    { 
      type: 'bomb', 
      count: difficultyFactor < 1.5 ? 3 : difficultyFactor < 2.5 ? 2 : 1 
    },
    { 
      type: 'time', 
      count: difficultyFactor < 1.2 ? 3 : difficultyFactor < 2.0 ? 2 : 1 
    },
    { 
      type: 'hint', 
      count: difficultyFactor < 1.5 ? 4 : difficultyFactor < 2.5 ? 3 : 2 
    },
    { 
      type: 'shuffle', 
      count: difficultyFactor < 1.8 ? 2 : 1 
    }
  ];

  console.log(`[GameLogic] Generated level - World ${worldId}, Level ${levelId}${isBoss ? ' (BOSS)' : ''}: ${tiles.length} tiles, ${timeLimit}s time limit`);

  const level: Level = { 
    tiles, 
    timeLimit, 
    powerUps,
    isBoss
  };
  
  // Add boss objective for boss levels
  if (isBoss) {
    level.bossObjective = generateBossObjective(worldId);
  }
  
  return level;
}

/**
 * Calculate star rating based on performance with world-adjusted thresholds
 * Higher worlds require better performance for same star ratings
 */
export function calculateStarRating(
  worldId: number,
  levelId: number,
  timeRemaining: number,
  timeLimit: number,
  movesUsed: number,
  optimalMoves: number
): number {
  const worldMultiplier = getWorldDifficultyMultiplier(worldId);
  const timePercentage = timeRemaining / timeLimit;
  const moveEfficiency = optimalMoves / Math.max(movesUsed, 1);
  
  // Adjust thresholds based on world difficulty
  // Higher worlds require better performance for 3 stars
  const threeStarTimeThreshold = 0.5 + (0.15 * (worldMultiplier - 1.0) / 1.65);
  const threeStarMoveThreshold = 0.8 + (0.15 * (worldMultiplier - 1.0) / 1.65);
  const twoStarTimeThreshold = 0.25 + (0.1 * (worldMultiplier - 1.0) / 1.65);
  const twoStarMoveThreshold = 0.6 + (0.1 * (worldMultiplier - 1.0) / 1.65);
  
  // 3 stars: Fast completion with high accuracy
  if (timePercentage >= threeStarTimeThreshold && moveEfficiency >= threeStarMoveThreshold) {
    return 3;
  }
  
  // 2 stars: Moderate performance
  if (timePercentage >= twoStarTimeThreshold && moveEfficiency >= twoStarMoveThreshold) {
    return 2;
  }
  
  // 1 star: Level completed
  return 1;
}
