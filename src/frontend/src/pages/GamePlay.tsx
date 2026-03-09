import GameBoard from "@/components/GameBoard";
import PowerUpPanel from "@/components/PowerUpPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { type Level, type Tile, generateLevel } from "@/lib/gameLogic";
import {
  AlertCircle,
  ArrowLeft,
  Clock,
  Heart,
  Info,
  MapPin,
  Pause,
  Play,
  Share2,
  Skull,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SoundContext, type Theme } from "../backend";
import {
  AchievementManager,
  checkAndUnlockAchievements,
} from "../components/AchievementSystem";
import { updateQuestProgress } from "../components/DailyQuests";
import * as LocalStorage from "../lib/localStorageManager";
import { getSoundManager } from "../lib/soundManager";

// Boss level visual effects
function triggerScreenShake(durationMs = 600) {
  const el = document.getElementById("gameplay-root");
  if (!el) return;
  el.style.transition = "none";
  let startTime: number | null = null;
  const shake = (ts: number) => {
    if (!startTime) startTime = ts;
    const elapsed = ts - startTime;
    if (elapsed < durationMs) {
      const intensity = Math.max(0, 8 * (1 - elapsed / durationMs));
      const dx = (Math.random() - 0.5) * intensity * 2;
      const dy = (Math.random() - 0.5) * intensity * 2;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      requestAnimationFrame(shake);
    } else {
      el.style.transform = "";
    }
  };
  requestAnimationFrame(shake);
}

function triggerLightFlash(color = "rgba(255,80,80,0.55)", durationMs = 350) {
  const flash = document.createElement("div");
  flash.style.cssText = `
    position:fixed;inset:0;pointer-events:none;z-index:9999;
    background:${color};opacity:0;
    transition:opacity 80ms ease-in;
  `;
  document.body.appendChild(flash);
  requestAnimationFrame(() => {
    flash.style.opacity = "1";
    setTimeout(() => {
      flash.style.transition = `opacity ${durationMs}ms ease-out`;
      flash.style.opacity = "0";
      setTimeout(() => flash.remove(), durationMs + 50);
    }, 80);
  });
}

interface GamePlayProps {
  worldId: number;
  levelId: number;
  onBack: () => void;
  currentTheme: Theme;
}

const WORLD_THEME_COLORS = {
  1: {
    primary: "oklch(var(--fruit-garden))",
    secondary: "oklch(var(--fruit-garden-light))",
  },
  2: {
    primary: "oklch(var(--fruit-ocean))",
    secondary: "oklch(var(--fruit-ocean-light))",
  },
  3: {
    primary: "oklch(var(--fruit-candyland))",
    secondary: "oklch(var(--fruit-candyland-light))",
  },
  4: {
    primary: "oklch(var(--fruit-forest))",
    secondary: "oklch(var(--fruit-forest-light))",
  },
  5: {
    primary: "oklch(var(--fruit-volcano))",
    secondary: "oklch(var(--fruit-volcano-light))",
  },
  6: {
    primary: "oklch(var(--fruit-space))",
    secondary: "oklch(var(--fruit-space-light))",
  },
  7: {
    primary: "oklch(var(--fruit-desert))",
    secondary: "oklch(var(--fruit-desert-light))",
  },
  8: {
    primary: "oklch(var(--fruit-arctic))",
    secondary: "oklch(var(--fruit-arctic-light))",
  },
  9: {
    primary: "oklch(var(--fruit-jungle))",
    secondary: "oklch(var(--fruit-jungle-light))",
  },
  10: {
    primary: "oklch(var(--fruit-crystal))",
    secondary: "oklch(var(--fruit-crystal-light))",
  },
  11: {
    primary: "oklch(var(--fruit-shadow))",
    secondary: "oklch(var(--fruit-shadow-light))",
  },
  12: {
    primary: "oklch(var(--fruit-rainbow))",
    secondary: "oklch(var(--fruit-rainbow-light))",
  },
};

const WORLD_ICONS = {
  1: "/assets/generated/garden-world-icon-transparent.dim_64x64.png",
  2: "/assets/generated/ocean-world-icon-transparent.dim_64x64.png",
  3: "/assets/generated/candyland-world-icon-transparent.dim_64x64.png",
  4: "/assets/generated/forest-world-icon-transparent.dim_64x64.png",
  5: "/assets/generated/volcano-world-icon-transparent.dim_64x64.png",
  6: "/assets/generated/space-world-icon-transparent.dim_64x64.png",
  7: "/assets/generated/desert-world-icon-transparent.dim_64x64.png",
  8: "/assets/generated/arctic-world-icon-transparent.dim_64x64.png",
  9: "/assets/generated/jungle-world-icon-transparent.dim_64x64.png",
  10: "/assets/generated/crystal-world-icon-transparent.dim_64x64.png",
  11: "/assets/generated/shadow-world-icon-transparent.dim_64x64.png",
  12: "/assets/generated/rainbow-world-icon-transparent.dim_64x64.png",
};

// Default fallback level for emergency rendering
function createFallbackLevel(_worldId: number, levelId: number): Level {
  const tiles: Tile[] = [];
  const fruitTypes = ["apple", "orange", "banana", "grape"];

  // Create 8 pairs (16 tiles) as basic fallback
  for (let i = 0; i < 8; i++) {
    const fruitType = fruitTypes[i % fruitTypes.length];
    tiles.push(
      { id: i * 2, fruitType, matched: false, covered: false },
      { id: i * 2 + 1, fruitType, matched: false, covered: false },
    );
  }

  return {
    tiles,
    timeLimit: 120,
    powerUps: [
      { type: "bomb", count: 2 },
      { type: "time", count: 2 },
      { type: "hint", count: 3 },
      { type: "shuffle", count: 1 },
    ],
    isBoss: levelId === 30,
  };
}

export default function GamePlay({
  worldId,
  levelId,
  onBack,
  currentTheme: _currentTheme,
}: GamePlayProps) {
  const { t } = useLanguage();

  // Initialize with fallback to guarantee valid state
  const [levelData, setLevelData] = useState<Level>(() =>
    createFallbackLevel(worldId, levelId),
  );
  const [tiles, setTiles] = useState<Tile[]>(
    () => createFallbackLevel(worldId, levelId).tiles,
  );

  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [initialTimeLimit, setInitialTimeLimit] = useState(120);
  const [matchCount, setMatchCount] = useState(0);
  const [powerUpCounts, setPowerUpCounts] =
    useState<LocalStorage.PowerUpCounts>({
      bomb: 0,
      clock: 0,
      shuffle: 0,
      magnifier: 0,
    });
  const [gameStartTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);
  const [starBreakdown, setStarBreakdown] = useState<string[]>([]);
  const [matchEffects, setMatchEffects] = useState<
    Array<{ id: string; x: number; y: number }>
  >([]);
  const [hintTileIds, setHintTileIds] = useState<number[]>([]);
  const [currentChainGroup, setCurrentChainGroup] = useState(0);

  // --- NEW STATE ---
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<"time" | "moves">(
    "time",
  );
  const [lives, setLives] = useState(() => {
    LocalStorage.regenerateLives();
    return LocalStorage.getLives();
  });
  const [comboCount, setComboCount] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [movesUsed, setMovesUsed] = useState(0);
  const [showObjectiveOverlay, setShowObjectiveOverlay] = useState(true);
  const [showStarInfo, setShowStarInfo] = useState(false);
  const [usedPowerUpThisLevel, setUsedPowerUpThisLevel] = useState(false);
  // -----------------

  const timerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const bossAudioPlayedRef = useRef(false);
  const handleLevelCompleteRef = useRef<() => void>(() => {});
  const comboTimeoutRef = useRef<number | null>(null);
  const [pendingAchievements, setPendingAchievements] = useState<string[]>([]);

  const themeColors =
    WORLD_THEME_COLORS[worldId as keyof typeof WORLD_THEME_COLORS] ||
    WORLD_THEME_COLORS[1];
  const worldIcon =
    WORLD_ICONS[worldId as keyof typeof WORLD_ICONS] || WORLD_ICONS[1];
  const soundManager = getSoundManager();
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(
    soundManager.getSoundEnabled(),
  );

  const isBossLevel = levelData.isBoss || levelId === 30;
  const isMoveBased = !!levelData.moveLimit;
  const moveLimit = levelData.moveLimit ?? 0;
  const movesLeft = Math.max(moveLimit - movesUsed, 0);

  useEffect(() => {
    const initAudio = async () => {
      await soundManager.resumeContext();
      // Start world-specific background music (supports all 12 worlds)
      await soundManager.playBackgroundMusicByWorldId(worldId);
    };
    initAudio();
  }, [soundManager, worldId]);

  // Play boss level start audio + visual effects
  useEffect(() => {
    if (isBossLevel && !bossAudioPlayedRef.current) {
      const playBossIntro = async () => {
        await soundManager.playSound(SoundContext.bossLevelStart);
        bossAudioPlayedRef.current = true;
        // Visual effects: flash then shake
        triggerLightFlash("rgba(220,38,38,0.5)", 400);
        setTimeout(() => triggerScreenShake(700), 120);
      };
      playBossIntro();
    }
  }, [isBossLevel, soundManager]);

  // Auto-hide objective overlay after 2 seconds
  useEffect(() => {
    if (showObjectiveOverlay) {
      const timer = window.setTimeout(() => {
        setShowObjectiveOverlay(false);
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [showObjectiveOverlay]);

  const toggleSound = async () => {
    await soundManager.resumeContext();
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundManager.setSoundEnabled(newState);
  };

  // Initialize level data with comprehensive error handling and fallback
  useEffect(() => {
    console.log(
      `[GamePlay] Initializing level - World ${worldId}, Level ${levelId}${levelId === 30 ? " (BOSS)" : ""}`,
    );

    if (worldId < 1 || worldId > 12) {
      setLoadError("Geçersiz dünya numarası");
      const fallback = createFallbackLevel(1, 1);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
      return;
    }

    if (levelId < 1 || levelId > 30) {
      setLoadError("Geçersiz seviye numarası");
      const fallback = createFallbackLevel(worldId, 1);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
      return;
    }

    try {
      const level = generateLevel(worldId, levelId);

      if (
        !level ||
        !level.tiles ||
        !Array.isArray(level.tiles) ||
        level.tiles.length === 0
      ) {
        setLoadError("Seviye verileri yüklenemedi");
        const fallback = createFallbackLevel(worldId, levelId);
        setLevelData(fallback);
        setTiles(fallback.tiles);
        setTimeLeft(fallback.timeLimit);
        setInitialTimeLimit(fallback.timeLimit);
        return;
      }

      if (typeof level.timeLimit !== "number" || level.timeLimit <= 0) {
        level.timeLimit = 120;
      }

      setLevelData(level);
      setTiles(level.tiles);
      setTimeLeft(level.timeLimit);
      setInitialTimeLimit(level.timeLimit);
      setLoadError(null);
      setMovesUsed(0);
      setComboCount(0);
      setShowObjectiveOverlay(true);

      const counts = LocalStorage.getPowerUpCounts();
      setPowerUpCounts(counts);
    } catch (error) {
      console.error("[GamePlay] ✗ Error generating level:", error);
      setLoadError("Oyun yüklenirken hata oluştu");
      const fallback = createFallbackLevel(worldId, levelId);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
    }
  }, [worldId, levelId]);

  // Timer — respects isPaused and isMoveBased
  useEffect(() => {
    if (isCompleted || isGameOver || isMoveBased) return;

    timerRef.current = window.setInterval(() => {
      if (isPaused) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOverInternal("time");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCompleted, isGameOver, isMoveBased, isPaused]);

  useEffect(() => {
    if (isCompleted) {
      autoCloseTimerRef.current = window.setTimeout(() => {
        onBack();
      }, 4000);
    }

    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isCompleted, onBack]);

  // Internal game-over handler (shows modal, consumes life)
  const handleGameOverInternal = (reason: "time" | "moves") => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOverReason(reason);

    const consumed = LocalStorage.consumeLife();
    if (consumed) {
      setLives((prev) => Math.max(prev - 1, 0));
    }

    if (isBossLevel) {
      soundManager.playSound(SoundContext.bossDefeat);
      triggerLightFlash("rgba(0,0,0,0.7)", 600);
      triggerScreenShake(900);
    }

    setIsGameOver(true);
  };

  // handleGameOver is used by the timer callback via setInterval closure

  // Trigger combo display
  const triggerComboDisplay = (count: number) => {
    if (count >= 2) {
      setShowCombo(true);
      if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
      comboTimeoutRef.current = window.setTimeout(() => {
        setShowCombo(false);
      }, 1500);
    }
  };

  // Check and unlock achievements
  const checkAchievements = useCallback(
    (params: {
      isFirstLevel?: boolean;
      isFirstBoss?: boolean;
      timeTaken: number;
      usedPowerUp: boolean;
      maxCombo: number;
    }) => {
      const toasts: string[] = [];

      if (params.isFirstLevel) {
        if (LocalStorage.unlockAchievement("first_level")) {
          toasts.push(
            `${t("achievement_unlocked")} ${t("achievement_first_level")}`,
          );
        }
      }
      if (params.isFirstBoss && isBossLevel) {
        if (LocalStorage.unlockAchievement("first_boss")) {
          toasts.push(
            `${t("achievement_unlocked")} ${t("achievement_first_boss")}`,
          );
        }
      }
      if (params.timeTaken < 30) {
        if (LocalStorage.unlockAchievement("speed_demon")) {
          toasts.push(
            `${t("achievement_unlocked")} ${t("achievement_speed_demon")}`,
          );
        }
      }
      if (!params.usedPowerUp) {
        if (LocalStorage.unlockAchievement("no_power")) {
          toasts.push(
            `${t("achievement_unlocked")} ${t("achievement_no_power")}`,
          );
        }
      }
      if (params.maxCombo >= 5) {
        if (LocalStorage.unlockAchievement("combo_master")) {
          toasts.push(
            `${t("achievement_unlocked")} ${t("achievement_combo_master")}`,
          );
        }
      }

      for (let i = 0; i < toasts.length; i++) {
        setTimeout(() => {
          toast.success(toasts[i], { duration: 4000 });
        }, i * 800);
      }
    },
    [t, isBossLevel],
  );

  const createMatchEffect = (tileId: number) => {
    const effectId = `effect-${Date.now()}-${Math.random()}`;
    const tileElement = document.querySelector(`[data-tile-id="${tileId}"]`);
    if (tileElement) {
      const rect = tileElement.getBoundingClientRect();
      setMatchEffects((prev) => [
        ...prev,
        {
          id: effectId,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        },
      ]);
      setTimeout(() => {
        setMatchEffects((prev) => prev.filter((e) => e.id !== effectId));
      }, 1000);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleLevelCompleteRef is a stable ref
  const handleTileClick = useCallback(
    async (tileId: number) => {
      if (isPaused || isGameOver || isCompleted) return;

      const tile = tiles.find((t) => t.id === tileId);
      if (!tile || tile.matched || tile.covered) return;

      // Block locked chain tiles
      if (tile.chained && (tile.chainGroup ?? 0) > currentChainGroup) {
        toast.error(t("chain_locked"));
        return;
      }

      await soundManager.playSound(SoundContext.tileClick);

      if (selectedTile === null) {
        setSelectedTile(tileId);
      } else if (selectedTile === tileId) {
        setSelectedTile(null);
      } else {
        const firstTile = tiles.find((t) => t.id === selectedTile);
        if (!firstTile) {
          setSelectedTile(tileId);
          return;
        }

        // Rainbow tiles match with anything; otherwise fruitType must match
        const isMatch =
          firstTile.fruitType === tile.fruitType ||
          firstTile.special === "rainbow" ||
          tile.special === "rainbow";

        if (isMatch) {
          await soundManager.playSound(SoundContext.tileMatch);
          createMatchEffect(selectedTile);
          createMatchEffect(tileId);

          if (isBossLevel) {
            triggerLightFlash("rgba(220,38,38,0.2)", 200);
          }

          // Check if this match completes a chain group
          const bothChained =
            firstTile.chained &&
            tile.chained &&
            firstTile.chainGroup !== undefined &&
            firstTile.chainGroup === tile.chainGroup &&
            firstTile.chainGroup === currentChainGroup;

          // Collect specials from both tiles
          const specials = [firstTile.special, tile.special].filter(Boolean);

          setTiles((prev) =>
            prev.map((t) => {
              if (t.id === selectedTile || t.id === tileId) {
                return { ...t, matched: true };
              }
              if (
                t.covered &&
                (t.coveredBy === selectedTile || t.coveredBy === tileId)
              ) {
                soundManager.playSound(SoundContext.layerOpen);
                return { ...t, covered: false, coveredBy: undefined };
              }
              return t;
            }),
          );

          if (bothChained) {
            setCurrentChainGroup((prev) => prev + 1);
          }

          await soundManager.playSound(SoundContext.tileClear);

          const newMatchCount = matchCount + 1;
          setMatchCount(newMatchCount);
          updateQuestProgress("match");
          setSelectedTile(null);

          // Move counter
          const newMovesUsed = movesUsed + 1;
          setMovesUsed(newMovesUsed);

          // Combo logic — successful match increments combo
          const newCombo = comboCount + 1;
          setComboCount(newCombo);
          updateQuestProgress("combo");
          triggerComboDisplay(newCombo);

          // Handle special tile effects
          for (const special of specials) {
            if (special === "bomb") {
              // Clear 2 additional random pairs
              setTiles((prev) => {
                const unmatched = prev.filter(
                  (t) => !t.matched && t.id !== selectedTile && t.id !== tileId,
                );
                const pairsCleared: string[] = [];
                const toMatch: number[] = [];
                for (const t of unmatched) {
                  if (!pairsCleared.includes(t.fruitType)) {
                    const partner = unmatched.find(
                      (p) =>
                        p.fruitType === t.fruitType &&
                        p.id !== t.id &&
                        !toMatch.includes(p.id),
                    );
                    if (partner) {
                      toMatch.push(t.id, partner.id);
                      pairsCleared.push(t.fruitType);
                      if (pairsCleared.length >= 2) break;
                    }
                  }
                }
                return prev.map((t) =>
                  toMatch.includes(t.id) ? { ...t, matched: true } : t,
                );
              });
              toast.success(t("special_bomb"));
            } else if (special === "freeze") {
              setTimeLeft((prev) => prev + 5);
              toast.success(t("special_freeze"));
            } else if (special === "rainbow") {
              toast.success(t("special_rainbow"));
            }
          }

          // Check for move-based game over
          if (isMoveBased && moveLimit > 0 && newMovesUsed >= moveLimit) {
            const remainingUnmatched = tiles.filter(
              (t) => !t.matched && t.id !== selectedTile && t.id !== tileId,
            );
            if (remainingUnmatched.length > 0) {
              handleGameOverInternal("moves");
              return;
            }
          }

          const remainingTiles = tiles.filter(
            (t) => !t.matched && t.id !== selectedTile && t.id !== tileId,
          );
          if (remainingTiles.length === 0) {
            handleLevelCompleteRef.current();
          }
        } else {
          // Wrong selection — reset combo
          setComboCount(0);
          setSelectedTile(tileId);
        }
      }
    },
    [
      tiles,
      selectedTile,
      soundManager,
      isBossLevel,
      currentChainGroup,
      t,
      isPaused,
      isGameOver,
      isCompleted,
      matchCount,
      movesUsed,
      comboCount,
      isMoveBased,
      moveLimit,
    ],
  );

  const handleLevelComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isBossLevel) {
      await soundManager.playSound(SoundContext.bossVictory);
      triggerLightFlash("rgba(255,215,0,0.6)", 500);
      setTimeout(() => triggerLightFlash("rgba(255,255,255,0.4)", 400), 300);
    } else {
      await soundManager.playSound(SoundContext.levelComplete);
    }

    const timeTaken = (Date.now() - gameStartTime) / 1000;
    const timeLimit = initialTimeLimit;
    let stars = 1;
    const breakdown: string[] = [];

    const timePercentage = timeTaken / timeLimit;

    if (timePercentage < 0.4) {
      stars = 3;
      breakdown.push(`⭐⭐⭐ ${t("very_fast")}`);
    } else if (timePercentage < 0.7) {
      stars = 2;
      breakdown.push(`⭐⭐ ${t("normal_time")}`);
    } else {
      stars = 1;
      breakdown.push(`⭐ ${t("slow_completion")}`);
    }

    for (let i = 0; i < stars; i++) {
      setTimeout(async () => {
        await soundManager.playSound(SoundContext.starEarned);
      }, i * 300);
    }

    breakdown.push(
      `⏱️ ${t("completion_time")}: ${Math.round(timeTaken)} ${t("seconds")}`,
    );
    breakdown.push(`🎯 ${t("total_matches")}: ${matchCount} ${t("pairs")}`);

    setEarnedStars(stars);
    setStarBreakdown(breakdown);

    LocalStorage.updateLevelProgress(worldId, levelId, stars);

    setIsCompleted(true);
    // Track daily quest progress
    updateQuestProgress("level_complete");
    if (isBossLevel) updateQuestProgress("beat_boss");
    updateQuestProgress("stars", stars);
    // Check new achievements via AchievementSystem
    const data = LocalStorage.loadPlayerData();
    const totalCompleted = data
      ? data.worlds.reduce(
          (s, w) => s + w.levels.filter((l) => l.completed).length,
          0,
        )
      : 0;
    const totalStarsAll = data ? data.totalStars : 0;
    const newly = checkAndUnlockAchievements({
      totalLevelsCompleted: totalCompleted,
      totalStars: totalStarsAll,
      maxCombo: comboCount,
      usedPowerUp: usedPowerUpThisLevel,
      completedBoss: isBossLevel,
    });
    if (newly.length > 0) setPendingAchievements((prev) => [...prev, ...newly]);

    // Check achievements
    const existingAchievements = LocalStorage.getAchievements();
    checkAchievements({
      isFirstLevel: !existingAchievements.includes("first_level"),
      isFirstBoss: isBossLevel && !existingAchievements.includes("first_boss"),
      timeTaken,
      usedPowerUp: usedPowerUpThisLevel,
      maxCombo: comboCount,
    });
  };

  // Keep ref in sync so useCallback can call it without dependency
  handleLevelCompleteRef.current = handleLevelComplete;

  const activatePowerUp = async (type: string) => {
    const powerUpType = type as keyof LocalStorage.PowerUpCounts;

    if (powerUpCounts[powerUpType] <= 0) {
      toast.error("Bu güç artırıcı kullanılamıyor!");
      return;
    }

    const success = LocalStorage.consumePowerUp(powerUpType);
    if (!success) {
      toast.error("Güç artırıcı kullanılamadı!");
      return;
    }

    setPowerUpCounts((prev) => ({
      ...prev,
      [powerUpType]: prev[powerUpType] - 1,
    }));
    setUsedPowerUpThisLevel(true);
    updateQuestProgress("use_bomb");
    updateQuestProgress("world_play");

    switch (type) {
      case "bomb": {
        await soundManager.playSound(SoundContext.bomb);
        const visibleTiles = tiles.filter((t) => !t.matched && !t.covered);
        if (visibleTiles.length > 0) {
          const targetType = visibleTiles[0].fruitType;
          setTiles((prev) =>
            prev.map((t) =>
              t.fruitType === targetType ? { ...t, matched: true } : t,
            ),
          );
          toast.success(t("bomb_used"));
        }
        break;
      }
      case "clock": {
        await soundManager.playSound(SoundContext.clock);
        setTimeLeft((prev) => prev + 10);
        toast.success(t("time_added"));
        break;
      }
      case "magnifier": {
        await soundManager.playSound(SoundContext.magnifier);
        const visibleTiles = tiles.filter(
          (t) => !t.matched && !t.covered && !t.hidden,
        );
        const fruitCounts = new Map<string, number[]>();
        for (const tile of visibleTiles) {
          if (!fruitCounts.has(tile.fruitType))
            fruitCounts.set(tile.fruitType, []);
          fruitCounts.get(tile.fruitType)!.push(tile.id);
        }
        let foundPair: number[] = [];
        for (const ids of fruitCounts.values()) {
          if (ids.length >= 2) {
            foundPair = ids.slice(0, 2);
            break;
          }
        }
        if (foundPair.length >= 2) {
          setHintTileIds(foundPair);
          toast.info(t("hint_showing"));
          setTimeout(() => setHintTileIds([]), 3000);
        } else {
          toast.info(t("hint_showing"));
        }
        break;
      }
      case "shuffle": {
        await soundManager.playSound(SoundContext.shuffle);
        setTiles((prev) => {
          const matched = prev.filter((tile) => tile.matched);
          const unmatched = prev.filter((tile) => !tile.matched);
          const shuffled = [...unmatched].sort(() => Math.random() - 0.5);
          return [...matched, ...shuffled];
        });
        toast.success(t("tiles_shuffled"));
        break;
      }
    }
  };

  const totalTiles = tiles.filter((t) => !t.matched).length;
  const progress =
    totalTiles > 0 ? ((tiles.length - totalTiles) / tiles.length) * 100 : 0;

  const getCurrentStarPrediction = () => {
    if (isCompleted) return earnedStars;
    const timeTaken = (Date.now() - gameStartTime) / 1000;
    const timePercentage = timeTaken / initialTimeLimit;
    if (timePercentage < 0.4) return 3;
    if (timePercentage < 0.7) return 2;
    return 1;
  };

  const currentStarPrediction = getCurrentStarPrediction();

  const handleCompletionPopupClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      onBack();
    }
  };

  const handleRetry = () => {
    try {
      const level = generateLevel(worldId, levelId);
      if (level?.tiles && level.tiles.length > 0) {
        setLevelData(level);
        setTiles(level.tiles);
        setTimeLeft(level.timeLimit);
        setInitialTimeLimit(level.timeLimit);
        setLoadError(null);
      } else {
        const fallback = createFallbackLevel(worldId, levelId);
        setLevelData(fallback);
        setTiles(fallback.tiles);
        setTimeLeft(fallback.timeLimit);
        setInitialTimeLimit(fallback.timeLimit);
      }
    } catch (error) {
      console.error("[GamePlay] Error on retry:", error);
      const fallback = createFallbackLevel(worldId, levelId);
      setLevelData(fallback);
      setTiles(fallback.tiles);
      setTimeLeft(fallback.timeLimit);
      setInitialTimeLimit(fallback.timeLimit);
    }

    setSelectedTile(null);
    setMatchCount(0);
    setIsCompleted(false);
    setIsGameOver(false);
    setEarnedStars(0);
    setStarBreakdown([]);
    setCurrentChainGroup(0);
    setHintTileIds([]);
    setMovesUsed(0);
    setComboCount(0);
    setShowObjectiveOverlay(true);
    setUsedPowerUpThisLevel(false);
    bossAudioPlayedRef.current = false;

    const counts = LocalStorage.getPowerUpCounts();
    setPowerUpCounts(counts);
    // Refresh lives
    LocalStorage.regenerateLives();
    setLives(LocalStorage.getLives());
  };

  // --- Objective text helper ---
  const getObjectiveText = () => {
    if (isBossLevel) return t("objective_boss");
    if (isMoveBased)
      return t("objective_moves").replace("{n}", String(moveLimit));
    return t("objective_time").replace("{n}", String(initialTimeLimit));
  };

  // CRITICAL: Always render the full gameplay layout
  return (
    <div
      id="gameplay-root"
      className="gameplay-fullscreen"
      style={{ opacity: 1, zIndex: 1 }}
    >
      <AchievementManager
        pendingIds={pendingAchievements}
        onClear={() => setPendingAchievements([])}
      />
      <div
        className="gameplay-background"
        style={{
          background: isBossLevel
            ? `radial-gradient(ellipse at center, ${themeColors.primary}60 0%, ${themeColors.primary}40 50%, rgba(0,0,0,0.8) 100%)`
            : `radial-gradient(ellipse at center, ${themeColors.secondary}40 0%, ${themeColors.primary}20 50%, transparent 100%)`,
          opacity: 1,
          zIndex: 0,
        }}
      />

      {isBossLevel && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ opacity: 0.1, zIndex: 1 }}
        >
          <img
            src="/assets/generated/boss-level-background.dim_1024x768.jpg"
            alt="Boss Background"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div
        className="gameplay-ambient-effects"
        style={{ opacity: 1, zIndex: 1 }}
      >
        {["a", "b", "c", "d", "e", "f", "g", "h"].map((id, i) => (
          <div
            key={id}
            className="absolute rounded-full opacity-20 animate-float"
            style={{
              width: `${Math.random() * 100 + 50}px`,
              height: `${Math.random() * 100 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: themeColors.primary,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${Math.random() * 3 + 4}s`,
            }}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={toggleSound}
        className="gameplay-sound-toggle"
        style={{ opacity: 1, zIndex: 50 }}
        aria-label={t("sound_toggle")}
      >
        {isSoundEnabled ? (
          <Volume2 className="w-5 h-5 text-gray-800" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-800" />
        )}
      </button>

      <div className="gameplay-content" style={{ opacity: 1, zIndex: 10 }}>
        {/* === TOP HUD === */}
        <div className="gameplay-top-hud" style={{ opacity: 1, zIndex: 20 }}>
          {/* Left: Back + Pause buttons */}
          <div className="flex items-center gap-2">
            <Button
              data-ocid="gameplay.back.button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                await soundManager.playSound(SoundContext.buttonClick);
                onBack();
              }}
              className="bg-white/95 hover:bg-white backdrop-blur-md shadow-lg border-2 border-white/50 transition-all hover:scale-105 text-sm px-3 py-2"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("back")}
            </Button>

            <Button
              data-ocid="gameplay.pause.toggle"
              variant="ghost"
              size="sm"
              onClick={() => setIsPaused((p) => !p)}
              className="bg-white/95 hover:bg-white backdrop-blur-md shadow-lg border-2 border-white/50 transition-all hover:scale-105 px-3 py-2"
              aria-label={isPaused ? t("resume") : t("pause")}
            >
              {isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Right: timer/moves, stars, lives, world info */}
          <div className="flex items-center gap-2">
            {/* Lives */}
            <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2 border-white/50">
              <CardContent className="flex items-center gap-1 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Heart
                    key={i}
                    className={`h-4 w-4 transition-all ${
                      i <= lives ? "fill-red-500 text-red-500" : "text-gray-300"
                    }`}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Timer or Move counter */}
            <Card
              className="bg-white/95 backdrop-blur-md shadow-xl border-2 transition-all hover:scale-105"
              style={{
                borderColor:
                  isMoveBased && movesLeft <= 5
                    ? "#dc2626"
                    : !isMoveBased && timeLeft <= 10
                      ? "#dc2626"
                      : themeColors.primary,
              }}
            >
              <CardContent className="flex items-center gap-2 p-2">
                {isMoveBased ? (
                  <>
                    <Zap
                      className="h-5 w-5"
                      style={{
                        color: movesLeft <= 5 ? "#dc2626" : themeColors.primary,
                      }}
                    />
                    <span
                      className="text-xl font-bold"
                      style={{
                        color: movesLeft <= 5 ? "#dc2626" : themeColors.primary,
                      }}
                    >
                      {movesLeft}
                    </span>
                    <span className="text-xs text-gray-500">
                      {t("moves_label")}
                    </span>
                  </>
                ) : (
                  <>
                    <Clock
                      className="h-5 w-5"
                      style={{
                        color: timeLeft <= 10 ? "#dc2626" : themeColors.primary,
                      }}
                    />
                    <span
                      className={`text-xl font-bold ${
                        timeLeft <= 10 ? "animate-pulse" : ""
                      }`}
                      style={{
                        color: timeLeft <= 10 ? "#dc2626" : themeColors.primary,
                      }}
                    >
                      {timeLeft}s
                    </span>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Star prediction */}
            <Card className="bg-white/95 backdrop-blur-md shadow-xl border-2 border-white/50">
              <CardContent className="flex items-center gap-1 p-2">
                <Zap className="h-4 w-4 text-fruit-star" />
                {[1, 2, 3].map((starNum) => (
                  <Star
                    key={starNum}
                    className={`h-4 w-4 transition-all ${
                      starNum <= currentStarPrediction
                        ? "fill-fruit-star text-fruit-star animate-pulse"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </CardContent>
            </Card>

            {/* World info card */}
            <Card
              className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md shadow-xl border-2 transition-all hover:scale-105 overflow-hidden ${
                isBossLevel ? "animate-pulse" : ""
              }`}
              style={{
                borderColor: isBossLevel ? "#dc2626" : themeColors.primary,
              }}
            >
              <CardContent className="flex items-center gap-2 p-2 relative">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
                  }}
                />
                <div className="relative flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                    style={{
                      backgroundColor: isBossLevel
                        ? "#dc2626"
                        : themeColors.primary,
                    }}
                  >
                    {isBossLevel ? (
                      <Skull className="w-5 h-5 text-white" />
                    ) : (
                      <img
                        src={worldIcon}
                        alt={`${t("world")} ${worldId}`}
                        className="w-5 h-5 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <MapPin
                        className="w-3 h-3"
                        style={{
                          color: isBossLevel ? "#dc2626" : themeColors.primary,
                        }}
                      />
                      <span
                        className="text-xs font-bold tracking-wide"
                        style={{
                          color: isBossLevel ? "#dc2626" : themeColors.primary,
                        }}
                      >
                        {isBossLevel
                          ? t("boss_level")
                          : `${t("world")} ${worldId}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-fruit-star text-fruit-star" />
                      <span className="text-xs font-semibold text-gray-700">
                        {t("level")} {levelId}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {isBossLevel && levelData.bossObjective && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30">
            <Card className="bg-red-600/95 backdrop-blur-md shadow-2xl border-2 border-red-800 animate-pulse">
              <CardContent className="p-3 flex items-center gap-2">
                <Skull className="w-5 h-5 text-white" />
                <div className="text-white">
                  <div className="text-xs font-bold">{t("boss_objective")}</div>
                  <div className="text-sm">
                    {levelData.bossObjective.description}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === PROGRESS BAR + STAR INFO === */}
        <div
          className="gameplay-progress-bar"
          style={{ opacity: 1, zIndex: 20 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white drop-shadow-lg">
              {t("progress")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white drop-shadow-lg">
                {Math.round(progress)}%
              </span>
              {/* Star info toggle */}
              <button
                data-ocid="gameplay.star_info.toggle"
                type="button"
                onClick={() => setShowStarInfo((s) => !s)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label={t("star_info")}
              >
                <Info className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="h-2 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm shadow-inner">
            <div
              className="h-full transition-all duration-500 rounded-full shadow-lg"
              style={{
                width: `${progress}%`,
                background: isBossLevel
                  ? "linear-gradient(90deg, #dc2626, #991b1b)"
                  : `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})`,
              }}
            />
          </div>
          {/* Star conditions tooltip */}
          {showStarInfo && (
            <div
              className="mt-2 rounded-xl px-3 py-2 text-xs text-white/90 bg-black/50 backdrop-blur-md border border-white/20 space-y-1"
              style={{ zIndex: 30 }}
            >
              <div className="font-bold mb-1">{t("star_info")}</div>
              <div>{t("star_cond_1")}</div>
              <div>{t("star_cond_2")}</div>
              <div>{t("star_cond_3")}</div>
            </div>
          )}
        </div>

        {/* === GAME BOARD === */}
        <div
          className="gameplay-board-container"
          style={{ opacity: 1, zIndex: 15 }}
        >
          {loadError ? (
            <Card className="bg-white/95 backdrop-blur-md shadow-2xl border-4 border-yellow-500 max-w-md mx-auto">
              <CardContent className="p-6 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
                <p className="text-lg font-semibold text-gray-800">
                  {loadError}
                </p>
                <p className="text-sm text-gray-600">
                  Oyun yedek verilerle devam ediyor
                </p>
                <Button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t("retry")}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {/* GameBoard ALWAYS renders regardless of error state */}
          <GameBoard
            tiles={tiles}
            selectedTile={selectedTile}
            onTileClick={handleTileClick}
            worldId={worldId}
            themeColor={themeColors.primary}
            hintTileIds={hintTileIds}
            currentChainGroup={currentChainGroup}
          />
        </div>

        {/* === POWER-UPS === */}
        <div
          className="gameplay-powerups-bottom"
          style={{ opacity: 1, zIndex: 20 }}
        >
          <PowerUpPanel
            powerUps={[
              { type: "bomb", count: powerUpCounts.bomb },
              { type: "clock", count: powerUpCounts.clock },
              { type: "magnifier", count: powerUpCounts.magnifier },
              { type: "shuffle", count: powerUpCounts.shuffle },
            ]}
            onActivate={activatePowerUp}
            themeColor={themeColors.primary}
          />
        </div>

        {/* === MATCH EFFECTS === */}
        {matchEffects.map((effect) => (
          <div
            key={effect.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: effect.x,
              top: effect.y,
              transform: "translate(-50%, -50%)",
              opacity: 1,
            }}
          >
            <img
              src="/assets/generated/sparkle-effect-transparent.dim_128x128.png"
              alt="sparkle"
              className="w-24 h-24 animate-ping"
            />
            <img
              src="/assets/generated/popup-star-effect-transparent.dim_64x64.png"
              alt="star"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 animate-bounce"
            />
          </div>
        ))}

        {/* === COMBO DISPLAY === */}
        {showCombo && comboCount >= 2 && (
          <div
            className="fixed left-1/2 -translate-x-1/2 z-40 combo-pop"
            style={{ top: "30%" }}
          >
            <div
              className="text-3xl font-black text-white drop-shadow-2xl px-6 py-3 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                boxShadow: "0 8px 32px rgba(245,158,11,0.6)",
              }}
            >
              🔥 x{comboCount} {t("combo_label")}
            </div>
          </div>
        )}

        {/* === OBJECTIVE INTRO OVERLAY === */}
        {showObjectiveOverlay && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="objective-intro">
              <div
                className="text-center px-8 py-6 rounded-3xl backdrop-blur-xl border-2 border-white/40 shadow-2xl"
                style={{
                  background: isBossLevel
                    ? "rgba(220,38,38,0.9)"
                    : "rgba(0,0,0,0.75)",
                }}
              >
                <div className="text-4xl mb-2">
                  {isBossLevel ? "💀" : isMoveBased ? "👆" : "⏱"}
                </div>
                <div className="text-xl font-bold text-white">
                  {t("objective_title")}
                </div>
                <div className="text-2xl font-black text-white mt-1">
                  {getObjectiveText()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === PAUSE OVERLAY === */}
        {isPaused && (
          <div
            data-ocid="gameplay.pause.modal"
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 pause-overlay"
          >
            <Card
              className="bg-white/95 shadow-2xl border-4 max-w-sm mx-4 w-full"
              style={{ borderColor: themeColors.primary }}
            >
              <CardContent className="p-8 text-center space-y-6">
                <div className="text-6xl">⏸</div>
                <h2
                  className="text-3xl font-black"
                  style={{ color: themeColors.primary }}
                >
                  {t("pause")}
                </h2>

                {/* Lives display */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Heart
                      key={i}
                      className={`h-6 w-6 ${
                        i <= lives
                          ? "fill-red-500 text-red-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {lives === 0 && (
                  <p className="text-red-500 text-sm font-semibold">
                    {t("no_lives")}
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    data-ocid="gameplay.pause.resume_button"
                    onClick={() => setIsPaused(false)}
                    className="w-full text-lg py-3 font-bold"
                    style={{ backgroundColor: themeColors.primary }}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {t("resume")}
                  </Button>
                  <Button
                    data-ocid="gameplay.pause.back_button"
                    variant="outline"
                    onClick={() => {
                      soundManager.playSound(SoundContext.buttonClick);
                      onBack();
                    }}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("back_to_map")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === GAME OVER MODAL === */}
        {isGameOver && (
          <div
            data-ocid="gameplay.gameover.modal"
            className="fixed inset-0 flex items-center justify-center z-50 bg-black/75 backdrop-blur-md"
          >
            <Card className="bg-white shadow-2xl border-4 border-red-500 max-w-sm mx-4 w-full animate-in zoom-in-95 duration-400">
              <CardContent className="p-8 text-center space-y-5">
                <div className="text-7xl animate-bounce">💀</div>
                <h2 className="text-4xl font-black text-red-600">
                  {t("game_over")}
                </h2>
                <p className="text-lg text-gray-600 font-semibold">
                  {gameOverReason === "moves"
                    ? t("moves_up")
                    : t("time_up_desc")}
                </p>

                {/* Lives remaining */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-500">
                    {t("lives_left")}
                  </p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Heart
                        key={i}
                        className={`h-7 w-7 ${
                          i <= lives
                            ? "fill-red-500 text-red-500"
                            : "text-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  {lives === 0 && (
                    <p className="text-red-500 text-xs">{t("no_lives")}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {lives > 0 ? (
                    <Button
                      data-ocid="gameplay.gameover.retry_button"
                      onClick={handleRetry}
                      className="w-full text-lg py-3 font-bold bg-red-500 hover:bg-red-600 text-white"
                    >
                      🔄 {t("retry")}
                    </Button>
                  ) : (
                    <Button
                      data-ocid="gameplay.gameover.retry_button"
                      disabled
                      className="w-full text-lg py-3 font-bold opacity-50 cursor-not-allowed"
                    >
                      🔄 {t("retry")}
                    </Button>
                  )}
                  <Button
                    data-ocid="gameplay.gameover.back_button"
                    variant="outline"
                    onClick={onBack}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("back_to_map")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* === LEVEL COMPLETE MODAL === */}
        {isCompleted && (
          <button
            type="button"
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 animate-in fade-in duration-300 cursor-pointer w-full h-full border-0 p-0"
            style={{ opacity: 1 }}
            onClick={handleCompletionPopupClick}
          >
            <Card
              className="bg-white p-8 text-center shadow-2xl border-4 max-w-lg mx-4 animate-in zoom-in-95 duration-500 cursor-default"
              style={{
                borderColor: isBossLevel ? "#dc2626" : themeColors.primary,
                opacity: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <CardContent className="space-y-6">
                <div className="text-7xl animate-bounce">
                  {isBossLevel ? "👑" : "🎉"}
                </div>
                <h2
                  className="text-4xl font-bold animate-in slide-in-from-top duration-700"
                  style={{
                    color: isBossLevel ? "#dc2626" : themeColors.primary,
                  }}
                >
                  {isBossLevel ? t("boss_victory") : t("congratulations")}
                </h2>
                <p className="text-xl font-semibold text-gray-700 animate-in slide-in-from-top duration-700 delay-100">
                  {t("level_complete")}
                </p>

                <div className="flex justify-center gap-3">
                  {([1, 2, 3] as const).map((starNum) => (
                    <Star
                      key={starNum}
                      className={`h-12 w-12 transition-all duration-500 ${
                        starNum <= earnedStars
                          ? "fill-fruit-star text-fruit-star scale-110 animate-bounce"
                          : "text-gray-300"
                      }`}
                      style={{ animationDelay: `${(starNum - 1) * 0.2}s` }}
                    />
                  ))}
                </div>

                <div
                  className="text-lg font-semibold animate-in slide-in-from-bottom duration-700"
                  style={{
                    color: isBossLevel ? "#dc2626" : themeColors.primary,
                  }}
                >
                  {earnedStars} {t("stars_earned")}
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 space-y-3 text-left border-2 border-gray-200 animate-in slide-in-from-bottom duration-700 delay-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy
                      className="h-6 w-6"
                      style={{
                        color: isBossLevel ? "#dc2626" : themeColors.primary,
                      }}
                    />
                    <h3 className="text-lg font-bold text-gray-800">
                      {t("star_details")}
                    </h3>
                  </div>
                  {starBreakdown.map((line) => (
                    <div
                      key={line}
                      className="text-sm font-medium text-gray-700 flex items-start gap-2 animate-in slide-in-from-left duration-500"
                      style={{
                        animationDelay: `${starBreakdown.indexOf(line) * 100}ms`,
                      }}
                    >
                      <span className="text-lg">{line.split(" ")[0]}</span>
                      <span className="flex-1">
                        {line.substring(line.indexOf(" ") + 1)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-600 italic animate-in fade-in duration-700 delay-300">
                  {earnedStars === 3 && `🏆 ${t("perfect_performance")}`}
                  {earnedStars === 2 && `👍 ${t("good_job")}`}
                  {earnedStars === 1 && `💪 ${t("can_do_better")}`}
                </div>

                {/* Share button */}
                <Button
                  data-ocid="gameplay.share_score.button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 mx-auto animate-in fade-in duration-700 delay-400"
                  style={{
                    borderColor: isBossLevel ? "#dc2626" : themeColors.primary,
                    color: isBossLevel ? "#dc2626" : themeColors.primary,
                  }}
                  onClick={() => {
                    const shareText = t("share_text")
                      .replace("{level}", String(levelId))
                      .replace("{world}", String(worldId))
                      .replace("{stars}", String(earnedStars));
                    navigator.clipboard
                      .writeText(shareText)
                      .then(() => toast.success(t("share_copied")))
                      .catch(() => toast.info(shareText));
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  {t("share_score")}
                </Button>

                <p className="text-xs text-gray-500 mt-4 animate-in fade-in duration-700 delay-500">
                  {t("auto_close")}
                </p>
              </CardContent>
            </Card>
          </button>
        )}
      </div>
    </div>
  );
}
