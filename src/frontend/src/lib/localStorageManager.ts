// LocalStorage manager for all player data

// Define Language enum locally since it's not in backend anymore
export enum Language {
  tr = "tr",
  en = "en",
  es = "es",
  fr = "fr",
  de = "de",
  it = "it",
  pt = "pt",
  ru = "ru",
  ja = "ja",
  zh = "zh",
}

export interface LevelProgress {
  stars: number;
  completed: boolean;
  lastUpdated: number;
}

export interface WorldProgress {
  worldId: number;
  levels: LevelProgress[];
  unlocked: boolean;
}

export interface DailyRewardData {
  lastClaimDate: number; // timestamp of last claim
  currentStreak: number; // 1-7 days
  streakHistory: number[]; // array of timestamps for the current 7-day cycle
}

export interface PowerUpCounts {
  bomb: number;
  clock: number;
  shuffle: number;
  magnifier: number;
}

export interface LocalPlayerData {
  username: string;
  theme: string;
  language: string;
  worlds: WorldProgress[];
  totalStars: number;
  dailyRewardData: DailyRewardData;
  powerUpCounts: PowerUpCounts;
  dailyRewards: Array<{
    rewardId: number;
    claimed: boolean;
    dateClaimed: number;
  }>;
  dailyPuzzles: Array<{
    puzzleId: number;
    completed: boolean;
    dateCompleted: number;
  }>;
  chestRewards: Array<{
    chestId: number;
    claimed: boolean;
    dateClaimed: number;
  }>;
}

const STORAGE_KEY = "fruitMatchPlayerData";

// Initialize default player data structure with 12 worlds and 30 levels each
function createDefaultPlayerData(
  username: string,
  theme: string,
  language: string,
): LocalPlayerData {
  const worlds: WorldProgress[] = [];

  // Create 12 worlds with 30 levels each
  for (let worldId = 1; worldId <= 12; worldId++) {
    const levels: LevelProgress[] = [];
    for (let levelId = 1; levelId <= 30; levelId++) {
      levels.push({
        stars: 0,
        completed: false,
        lastUpdated: Date.now(),
      });
    }

    worlds.push({
      worldId,
      levels,
      unlocked: worldId === 1, // Only first world unlocked by default
    });
  }

  return {
    username,
    theme,
    language,
    worlds,
    totalStars: 0,
    dailyRewardData: {
      lastClaimDate: 0,
      currentStreak: 0,
      streakHistory: [],
    },
    powerUpCounts: {
      bomb: 5,
      clock: 5,
      shuffle: 5,
      magnifier: 5,
    },
    dailyRewards: [],
    dailyPuzzles: [],
    chestRewards: [],
  };
}

// Load player data from localStorage (NEVER automatically clears)
export function loadPlayerData(): LocalPlayerData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      console.log("[LocalStorage] No existing player data found");
      return null;
    }

    const parsed = JSON.parse(data) as LocalPlayerData;

    // Ensure dailyRewardData exists (for backward compatibility)
    if (!parsed.dailyRewardData) {
      parsed.dailyRewardData = {
        lastClaimDate: 0,
        currentStreak: 0,
        streakHistory: [],
      };
    }

    // Ensure powerUpCounts exists (for backward compatibility)
    if (!parsed.powerUpCounts) {
      parsed.powerUpCounts = {
        bomb: 5,
        clock: 5,
        shuffle: 5,
        magnifier: 5,
      };
    }

    console.log(
      "[LocalStorage] ✓ Successfully loaded player data for:",
      parsed.username,
    );
    return parsed;
  } catch (error) {
    console.error("[LocalStorage] Failed to load player data:", error);
    return null;
  }
}

// Save player data to localStorage (persists indefinitely)
export function savePlayerData(data: LocalPlayerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log(
      "[LocalStorage] ✓ Successfully saved player data for:",
      data.username,
    );
  } catch (error) {
    console.error("[LocalStorage] Failed to save player data:", error);
  }
}

// Initialize new player (only called when no existing data)
export function initializePlayer(
  username: string,
  theme: string,
  language: string,
): LocalPlayerData {
  const data = createDefaultPlayerData(username, theme, language);
  savePlayerData(data);
  console.log("[LocalStorage] ✓ Initialized new player:", username);
  return data;
}

// Update username
export function updateUsername(newUsername: string): void {
  const data = loadPlayerData();
  if (!data) {
    console.warn("[LocalStorage] Cannot update username: No player data found");
    return;
  }

  data.username = newUsername;
  savePlayerData(data);
  console.log("[LocalStorage] ✓ Updated username to:", newUsername);
}

// Update theme
export function updateTheme(theme: string): void {
  const data = loadPlayerData();
  if (!data) {
    console.warn("[LocalStorage] Cannot update theme: No player data found");
    return;
  }

  data.theme = theme;
  savePlayerData(data);
  console.log("[LocalStorage] ✓ Updated theme to:", theme);
}

// Update language
export function updateLanguage(language: string): void {
  const data = loadPlayerData();
  if (!data) {
    console.warn("[LocalStorage] Cannot update language: No player data found");
    return;
  }

  data.language = language;
  savePlayerData(data);
  console.log("[LocalStorage] ✓ Updated language to:", language);
}

// Update level progress (saves immediately to localStorage)
export function updateLevelProgress(
  worldId: number,
  levelId: number,
  stars: number,
): void {
  const data = loadPlayerData();
  if (!data) {
    console.warn(
      "[LocalStorage] Cannot update level progress: No player data found",
    );
    return;
  }

  const world = data.worlds.find((w) => w.worldId === worldId);
  if (!world) {
    console.warn(`[LocalStorage] World ${worldId} not found`);
    return;
  }

  const level = world.levels[levelId - 1];
  if (!level) {
    console.warn(
      `[LocalStorage] Level ${levelId} not found in world ${worldId}`,
    );
    return;
  }

  // Update level data
  level.stars = Math.max(level.stars, stars);
  level.completed = true;
  level.lastUpdated = Date.now();

  // Recalculate total stars
  data.totalStars = data.worlds.reduce((total, w) => {
    return total + w.levels.reduce((sum, l) => sum + l.stars, 0);
  }, 0);

  // Check world unlocking logic
  checkAndUnlockWorlds(data);

  savePlayerData(data);
  console.log(
    `[LocalStorage] ✓ Updated level ${worldId}-${levelId} with ${stars} stars. Total stars: ${data.totalStars}`,
  );
}

// Check and unlock worlds based on progress (80% of stars required)
function checkAndUnlockWorlds(data: LocalPlayerData): void {
  for (let i = 1; i < data.worlds.length; i++) {
    const currentWorld = data.worlds[i];
    const previousWorld = data.worlds[i - 1];

    if (currentWorld.unlocked) continue;

    // Unlock if previous world has 80% of stars earned (72 out of 90 stars)
    const previousWorldStars = previousWorld.levels.reduce(
      (sum, l) => sum + l.stars,
      0,
    );
    const requiredStars = 72; // 80% of 90 possible stars (30 levels * 3 stars)

    if (previousWorldStars >= requiredStars) {
      currentWorld.unlocked = true;
      console.log(`[LocalStorage] ✓ Unlocked world ${currentWorld.worldId}`);
    }
  }
}

// Get power-up counts
export function getPowerUpCounts(): PowerUpCounts {
  const data = loadPlayerData();
  if (!data) {
    return { bomb: 0, clock: 0, shuffle: 0, magnifier: 0 };
  }
  return data.powerUpCounts;
}

// Consume a power-up (decrement count)
export function consumePowerUp(type: keyof PowerUpCounts): boolean {
  const data = loadPlayerData();
  if (!data) {
    console.warn(
      "[LocalStorage] Cannot consume power-up: No player data found",
    );
    return false;
  }

  if (data.powerUpCounts[type] <= 0) {
    console.warn(`[LocalStorage] No ${type} power-ups available`);
    return false;
  }

  data.powerUpCounts[type]--;
  savePlayerData(data);
  console.log(
    `[LocalStorage] ✓ Consumed ${type} power-up. Remaining: ${data.powerUpCounts[type]}`,
  );
  return true;
}

// Add power-ups (from rewards)
export function addPowerUps(powerUps: Partial<PowerUpCounts>): void {
  const data = loadPlayerData();
  if (!data) {
    console.warn("[LocalStorage] Cannot add power-ups: No player data found");
    return;
  }

  for (const [type, count] of Object.entries(powerUps)) {
    if (count && count > 0) {
      data.powerUpCounts[type as keyof PowerUpCounts] += count;
    }
  }

  savePlayerData(data);
  console.log("[LocalStorage] ✓ Added power-ups:", powerUps);
}

// Check if daily reward is available
export function isDailyRewardAvailable(): boolean {
  const data = loadPlayerData();
  if (!data) return false;

  const now = Date.now();
  const lastClaim = data.dailyRewardData.lastClaimDate;

  // If never claimed, reward is available
  if (lastClaim === 0) return true;

  // Check if 24 hours have passed since last claim
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
  return hoursSinceLastClaim >= 24;
}

// Get current daily reward streak info
export function getDailyRewardStreak(): {
  currentStreak: number;
  isAvailable: boolean;
  lastClaimDate: number;
} {
  const data = loadPlayerData();
  if (!data) {
    return { currentStreak: 0, isAvailable: false, lastClaimDate: 0 };
  }

  const now = Date.now();
  const lastClaim = data.dailyRewardData.lastClaimDate;

  // If never claimed, start at day 1
  if (lastClaim === 0) {
    return { currentStreak: 0, isAvailable: true, lastClaimDate: 0 };
  }

  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);

  // Check if streak should reset (more than 48 hours = missed a day)
  if (hoursSinceLastClaim > 48) {
    return { currentStreak: 0, isAvailable: true, lastClaimDate: lastClaim };
  }

  // Check if reward is available (24+ hours)
  const isAvailable = hoursSinceLastClaim >= 24;

  return {
    currentStreak: data.dailyRewardData.currentStreak,
    isAvailable,
    lastClaimDate: lastClaim,
  };
}

// Calculate rewards based on streak day (power-ups only)
function calculateDailyRewards(day: number): PowerUpCounts {
  const rewardTable: Record<number, PowerUpCounts> = {
    1: { bomb: 2, clock: 0, shuffle: 0, magnifier: 0 },
    2: { bomb: 1, clock: 2, shuffle: 0, magnifier: 0 },
    3: { bomb: 0, clock: 1, shuffle: 2, magnifier: 0 },
    4: { bomb: 0, clock: 0, shuffle: 1, magnifier: 2 },
    5: { bomb: 3, clock: 0, shuffle: 0, magnifier: 1 },
    6: { bomb: 0, clock: 2, shuffle: 2, magnifier: 0 },
    7: { bomb: 3, clock: 2, shuffle: 2, magnifier: 2 },
  };

  return rewardTable[day] || rewardTable[1];
}

// Claim daily reward and update streak (ATOMIC: single load/save cycle)
export function claimDailyReward(): {
  newStreak: number;
  rewards: PowerUpCounts;
} {
  const data = loadPlayerData();
  if (!data) {
    throw new Error("No player data found");
  }

  const now = Date.now();
  const lastClaim = data.dailyRewardData.lastClaimDate;
  const hoursSinceLastClaim =
    lastClaim === 0 ? 999 : (now - lastClaim) / (1000 * 60 * 60);

  // Reset streak if more than 48 hours have passed
  let newStreak = data.dailyRewardData.currentStreak;
  if (hoursSinceLastClaim > 48 || lastClaim === 0) {
    newStreak = 1;
    data.dailyRewardData.streakHistory = [now];
  } else if (hoursSinceLastClaim >= 24) {
    // Continue streak
    newStreak = Math.min(data.dailyRewardData.currentStreak + 1, 7);
    data.dailyRewardData.streakHistory.push(now);

    // Keep only last 7 entries
    if (data.dailyRewardData.streakHistory.length > 7) {
      data.dailyRewardData.streakHistory =
        data.dailyRewardData.streakHistory.slice(-7);
    }
  } else {
    throw new Error("Daily reward not yet available");
  }

  // Update claim data
  data.dailyRewardData.lastClaimDate = now;
  data.dailyRewardData.currentStreak = newStreak;

  // Calculate rewards based on streak day (power-ups only)
  const rewards = calculateDailyRewards(newStreak);

  // Apply power-up rewards DIRECTLY to the same in-memory data object
  for (const [type, count] of Object.entries(rewards)) {
    if (count && count > 0) {
      data.powerUpCounts[type as keyof PowerUpCounts] += count;
    }
  }

  // Add to legacy dailyRewards array for compatibility
  data.dailyRewards.push({
    rewardId: now,
    claimed: true,
    dateClaimed: now,
  });

  // Single atomic save with all changes (streak + power-ups)
  savePlayerData(data);
  console.log(
    `[LocalStorage] ✓ Claimed daily reward for day ${newStreak}, power-ups applied atomically`,
  );

  return { newStreak, rewards };
}

// Claim level chest
export function claimLevelChest(chestId: number): void {
  const data = loadPlayerData();
  if (!data) {
    console.warn(
      "[LocalStorage] Cannot claim level chest: No player data found",
    );
    return;
  }

  data.chestRewards.push({
    chestId,
    claimed: true,
    dateClaimed: Date.now(),
  });

  savePlayerData(data);
  console.log("[LocalStorage] ✓ Claimed level chest:", chestId);
}

// Reset all player data (ONLY called from profile reset button - user action only)
export function resetPlayerData(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log(
    "[LocalStorage] ⚠️ Player data has been reset by explicit user action",
  );
}

// Check if player exists
export function playerExists(): boolean {
  const exists = loadPlayerData() !== null;
  console.log("[LocalStorage] Player exists check:", exists);
  return exists;
}
