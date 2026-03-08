import DailyRewardDialog from "@/components/DailyRewardDialog";
import WorldCard from "@/components/WorldCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { ArrowLeft, Gift, Volume2, VolumeX } from "lucide-react";
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
  { id: 7, name: "desert", emoji: "🏜️", theme: "desert", requiredStars: 432 },
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
  const soundManager = getSoundManager();
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(
    soundManager.getSoundEnabled(),
  );

  const themeGradient = THEME_GRADIENTS[currentTheme];

  useEffect(() => {
    const data = LocalStorage.loadPlayerData();
    setPlayerData(data);

    // Check if daily reward is available
    const isAvailable = LocalStorage.isDailyRewardAvailable();
    if (isAvailable) {
      setShowDailyReward(true);
    }
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

      // Reload player data to reflect new power-up counts
      const data = LocalStorage.loadPlayerData();
      setPlayerData(data);

      setShowDailyReward(false);
    } catch (error) {
      console.error("[WorldMap] Failed to claim daily reward:", error);
    }
  };

  if (!playerData) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center">
        <div
          className={`fixed inset-0 bg-gradient-to-br ${themeGradient} pointer-events-none transition-all duration-1000`}
        />
        <div className="relative z-10 text-white text-2xl font-bold">
          {t("loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full p-4 md:p-8">
      <div
        className={`fixed inset-0 bg-gradient-to-br ${themeGradient} pointer-events-none transition-all duration-1000`}
      />

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
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={onBackToTitle}
            className="text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t("main_menu")}
          </Button>

          <Button
            variant="default"
            size="lg"
            onClick={() => setShowDailyReward(true)}
            className="bg-fruit-star hover:bg-fruit-star/90 text-white shadow-lg"
          >
            <Gift className="mr-2 h-5 w-5" />
            {t("daily_reward")}
          </Button>
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
                onSelectLevel={(levelId) => onSelectLevel(world.id, levelId)}
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
    </div>
  );
}
