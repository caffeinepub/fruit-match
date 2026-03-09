import DailyQuestsModal, {
  hasUnfinishedQuests,
} from "@/components/DailyQuests";
import DailyRewardDialog from "@/components/DailyRewardDialog";
import WorldCard from "@/components/WorldCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, ClipboardList, Gift, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { Theme } from "../backend";
import * as LocalStorage from "../lib/localStorageManager";
import { getSoundManager } from "../lib/soundManager";

interface WorldMapProps {
  onSelectLevel: (worldId: number, levelId: number) => void;
  onBackToTitle: () => void;
  currentTheme: Theme;
}

const THEME_GRADIENTS: Record<Theme, string> = {
  [Theme.garden]:
    "from-fruit-garden-light/80 via-fruit-garden/60 to-fruit-garden-dark/80",
  [Theme.ocean]:
    "from-fruit-ocean-light/80 via-fruit-ocean/60 to-fruit-ocean-dark/80",
  [Theme.candyland]:
    "from-fruit-candyland-light/80 via-fruit-candyland/60 to-fruit-candyland-dark/80",
  [Theme.forest]:
    "from-fruit-forest-light/80 via-fruit-forest/60 to-fruit-forest-dark/80",
  [Theme.volcano]:
    "from-fruit-volcano-light/80 via-fruit-volcano/60 to-fruit-volcano-dark/80",
  [Theme.space]:
    "from-fruit-space-light/80 via-fruit-space/60 to-fruit-space-dark/80",
};

const WORLDS = [
  { id: 1, name: "garden", emoji: "🌸", theme: "garden", requiredStars: 0 },
  { id: 2, name: "ocean", emoji: "🌊", theme: "ocean", requiredStars: 72 },
  {
    id: 3,
    name: "candyland",
    emoji: "🍭",
    theme: "candyland",
    requiredStars: 144,
  },
  { id: 4, name: "forest", emoji: "🌲", theme: "forest", requiredStars: 216 },
  { id: 5, name: "volcano", emoji: "🌋", theme: "volcano", requiredStars: 288 },
  { id: 6, name: "space", emoji: "🚀", theme: "space", requiredStars: 360 },
  { id: 7, name: "desert", emoji: "🏙️", theme: "desert", requiredStars: 432 },
  { id: 8, name: "arctic", emoji: "❄️", theme: "arctic", requiredStars: 504 },
  { id: 9, name: "jungle", emoji: "🌴", theme: "jungle", requiredStars: 576 },
  {
    id: 10,
    name: "crystal",
    emoji: "💎",
    theme: "crystal",
    requiredStars: 648,
  },
  { id: 11, name: "shadow", emoji: "🌑", theme: "shadow", requiredStars: 720 },
  {
    id: 12,
    name: "rainbow",
    emoji: "🌈",
    theme: "rainbow",
    requiredStars: 792,
  },
];

export default function WorldMap({
  onSelectLevel,
  onBackToTitle,
  currentTheme,
}: WorldMapProps) {
  const { t } = useLanguage();
  const [playerData, setPlayerData] =
    useState<LocalStorage.LocalPlayerData | null>(null);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showDailyQuests, setShowDailyQuests] = useState(false);
  const [hasQuests, setHasQuests] = useState(false);
  // World transition state
  const [transitionWorldId, setTransitionWorldId] = useState<number | null>(
    null,
  );
  const [transitionPhase, setTransitionPhase] = useState<
    "idle" | "expand" | "done"
  >("idle");
  const [pendingLevel, setPendingLevel] = useState<{
    worldId: number;
    levelId: number;
  } | null>(null);

  const soundManager = getSoundManager();
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(
    soundManager.getSoundEnabled(),
  );
  const themeGradient = THEME_GRADIENTS[currentTheme];

  useEffect(() => {
    const data = LocalStorage.loadPlayerData();
    setPlayerData(data);
    if (LocalStorage.isDailyRewardAvailable()) setShowDailyReward(true);
    setHasQuests(hasUnfinishedQuests());
  }, []);

  const toggleSound = async () => {
    await soundManager.resumeContext();
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundManager.setSoundEnabled(newState);
  };

  const handleClaimDailyReward = () => {
    try {
      const result = LocalStorage.claimDailyReward();
      console.log("[WorldMap] ✓ Daily reward claimed:", result);
      const data = LocalStorage.loadPlayerData();
      setPlayerData(data);
      setShowDailyReward(false);
    } catch (error) {
      console.error("[WorldMap] Failed to claim daily reward:", error);
    }
  };

  // Trigger world transition animation then navigate
  const handleSelectLevel = (worldId: number, levelId: number) => {
    setTransitionWorldId(worldId);
    setPendingLevel({ worldId, levelId });
    setTransitionPhase("expand");
    setTimeout(() => {
      setTransitionPhase("done");
      setTimeout(() => {
        setTransitionPhase("idle");
        setTransitionWorldId(null);
        if (pendingLevel || { worldId, levelId }) {
          onSelectLevel(worldId, levelId);
        }
      }, 200);
    }, 600);
  };

  if (!playerData) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <div
          className={`fixed inset-0 bg-gradient-to-br ${themeGradient} pointer-events-none`}
        />
        <div className="relative z-10 text-white text-2xl font-bold">
          {t("loading")}
        </div>
      </div>
    );
  }

  const totalPlayerStars = playerData.totalStars || 0;

  const transitionWorld = transitionWorldId
    ? WORLDS.find((w) => w.id === transitionWorldId)
    : null;

  return (
    <div className="relative min-h-screen w-full p-4 md:p-8">
      <div
        className={`fixed inset-0 bg-gradient-to-br ${themeGradient} pointer-events-none transition-all duration-1000`}
      />

      {/* World Transition Overlay */}
      {transitionPhase !== "idle" && transitionWorld && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{
            background:
              transitionPhase === "expand"
                ? "rgba(0,0,0,0.0)"
                : "rgba(0,0,0,0.0)",
          }}
        >
          <div
            style={{
              fontSize: "6rem",
              lineHeight: 1,
              transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)",
              transform: transitionPhase === "expand" ? "scale(8)" : "scale(0)",
              opacity: transitionPhase === "expand" ? 0.9 : 0,
            }}
          >
            {transitionWorld.emoji}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleSound}
        className="fixed top-6 right-6 z-20 p-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 hover:scale-110 shadow-lg"
        aria-label={t("sound_toggle")}
      >
        {isSoundEnabled ? (
          <Volume2 className="w-6 h-6 text-gray-800" />
        ) : (
          <VolumeX className="w-6 h-6 text-gray-800" />
        )}
      </button>

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <Button
            data-ocid="worldmap.back.button"
            variant="ghost"
            size="lg"
            onClick={onBackToTitle}
            className="text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t("main_menu")}
          </Button>

          <div className="flex items-center gap-3">
            {/* Daily Quests Button */}
            <div className="relative">
              <Button
                data-ocid="worldmap.daily_quests.button"
                variant="outline"
                size="lg"
                onClick={() => setShowDailyQuests(true)}
                className="bg-white/90 hover:bg-white text-gray-800 shadow-lg border-2 border-white/50"
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Günlük Görevler
              </Button>
              {hasQuests && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 border-2 border-white animate-pulse"
                  aria-label="Bitmemiş görev var"
                />
              )}
            </div>

            {/* Daily Reward Button */}
            <Button
              data-ocid="worldmap.daily_reward.button"
              variant="default"
              size="lg"
              onClick={() => setShowDailyReward(true)}
              className="bg-fruit-star hover:bg-fruit-star/90 text-white shadow-lg"
            >
              <Gift className="mr-2 h-5 w-5" />
              {t("daily_reward")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {WORLDS.map((world) => {
            const worldProgress = playerData.worlds[world.id - 1];
            const completedLevels = worldProgress.levels.filter(
              (l) => l.completed,
            ).length;
            const totalStars = worldProgress.levels.reduce(
              (sum, l) => sum + l.stars,
              0,
            );

            return (
              <WorldCard
                key={world.id}
                world={world}
                progress={{
                  unlocked: worldProgress.unlocked,
                  completedLevels,
                  totalStars,
                  levels: worldProgress.levels,
                }}
                isUnlocked={worldProgress.unlocked}
                onSelectLevel={(levelId) =>
                  handleSelectLevel(world.id, levelId)
                }
                totalPlayerStars={totalPlayerStars}
              />
            );
          })}
        </div>
      </div>

      <DailyRewardDialog
        open={showDailyReward}
        onClose={() => setShowDailyReward(false)}
        onClaim={handleClaimDailyReward}
      />

      <DailyQuestsModal
        open={showDailyQuests}
        onClose={() => {
          setShowDailyQuests(false);
          setHasQuests(hasUnfinishedQuests());
        }}
        onClaimReward={() => {
          // Give a random power-up
          const data = LocalStorage.loadPlayerData();
          if (data) {
            const types = ["bomb", "clock", "shuffle", "magnifier"] as const;
            const type = types[Math.floor(Math.random() * types.length)];
            data.powerUpCounts[type] = (data.powerUpCounts[type] || 0) + 3;
            LocalStorage.savePlayerData(data);
            setPlayerData({ ...data });
          }
        }}
      />
    </div>
  );
}
