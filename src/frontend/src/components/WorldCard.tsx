import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { Lock, Star } from "lucide-react";
import type { LevelProgress } from "../lib/localStorageManager";

interface World {
  id: number;
  name: string;
  emoji: string;
  theme: string;
  requiredStars: number;
}

interface WorldProgress {
  unlocked: boolean;
  completedLevels: number;
  totalStars: number;
  levels: LevelProgress[];
}

interface WorldCardProps {
  world: World;
  progress: WorldProgress;
  isUnlocked: boolean;
  onSelectLevel: (levelId: number) => void;
}

const WORLD_BACKGROUNDS: Record<string, string> = {
  garden: "/assets/generated/garden-background-pastel.dim_1024x768.jpg",
  ocean: "/assets/generated/ocean-background.dim_1024x768.jpg",
  candyland: "/assets/generated/candyland-background.dim_1024x768.jpg",
  forest: "/assets/generated/forest-background-lush.dim_1024x768.jpg",
  volcano: "/assets/generated/volcano-background-glow.dim_1024x768.jpg",
  space: "/assets/generated/space-background-neon.dim_1024x768.jpg",
  desert: "/assets/generated/desert-background.dim_1024x768.jpg",
  arctic: "/assets/generated/arctic-background.dim_1024x768.jpg",
  jungle: "/assets/generated/jungle-background.dim_1024x768.jpg",
  crystal: "/assets/generated/crystal-background.dim_1024x768.jpg",
  shadow: "/assets/generated/shadow-background.dim_1024x768.jpg",
  rainbow: "/assets/generated/rainbow-background.dim_1024x768.jpg",
};

const WORLD_ICONS: Record<string, string> = {
  garden: "/assets/generated/garden-world-icon-transparent.dim_64x64.png",
  ocean: "/assets/generated/ocean-world-icon-transparent.dim_64x64.png",
  candyland: "/assets/generated/candyland-world-icon-transparent.dim_64x64.png",
  forest: "/assets/generated/forest-world-icon-transparent.dim_64x64.png",
  volcano: "/assets/generated/volcano-world-icon-transparent.dim_64x64.png",
  space: "/assets/generated/space-world-icon-transparent.dim_64x64.png",
  desert: "/assets/generated/desert-world-icon-transparent.dim_64x64.png",
  arctic: "/assets/generated/arctic-world-icon-transparent.dim_64x64.png",
  jungle: "/assets/generated/jungle-world-icon-transparent.dim_64x64.png",
  crystal: "/assets/generated/crystal-world-icon-transparent.dim_64x64.png",
  shadow: "/assets/generated/shadow-world-icon-transparent.dim_64x64.png",
  rainbow: "/assets/generated/rainbow-world-icon-transparent.dim_64x64.png",
};

const WORLD_THEME_COLORS: Record<
  string,
  { primary: string; light: string; dark: string }
> = {
  garden: {
    primary: "oklch(0.75 0.12 145)",
    light: "oklch(0.88 0.10 145)",
    dark: "oklch(0.55 0.15 145)",
  },
  ocean: {
    primary: "oklch(0.65 0.15 220)",
    light: "oklch(0.82 0.12 220)",
    dark: "oklch(0.45 0.18 220)",
  },
  candyland: {
    primary: "oklch(0.72 0.18 330)",
    light: "oklch(0.85 0.15 330)",
    dark: "oklch(0.55 0.20 330)",
  },
  forest: {
    primary: "oklch(0.55 0.18 155)",
    light: "oklch(0.72 0.15 155)",
    dark: "oklch(0.38 0.20 155)",
  },
  volcano: {
    primary: "oklch(0.60 0.28 25)",
    light: "oklch(0.78 0.22 25)",
    dark: "oklch(0.42 0.30 25)",
  },
  space: {
    primary: "oklch(0.45 0.20 270)",
    light: "oklch(0.62 0.18 270)",
    dark: "oklch(0.28 0.22 270)",
  },
  desert: {
    primary: "oklch(0.70 0.15 60)",
    light: "oklch(0.85 0.12 60)",
    dark: "oklch(0.50 0.18 60)",
  },
  arctic: {
    primary: "oklch(0.80 0.08 240)",
    light: "oklch(0.92 0.05 240)",
    dark: "oklch(0.60 0.12 240)",
  },
  jungle: {
    primary: "oklch(0.50 0.20 150)",
    light: "oklch(0.68 0.16 150)",
    dark: "oklch(0.35 0.24 150)",
  },
  crystal: {
    primary: "oklch(0.75 0.18 300)",
    light: "oklch(0.88 0.14 300)",
    dark: "oklch(0.55 0.22 300)",
  },
  shadow: {
    primary: "oklch(0.35 0.12 280)",
    light: "oklch(0.55 0.10 280)",
    dark: "oklch(0.20 0.15 280)",
  },
  rainbow: {
    primary: "oklch(0.70 0.25 0)",
    light: "oklch(0.85 0.20 0)",
    dark: "oklch(0.50 0.30 0)",
  },
};

export default function WorldCard({
  world,
  progress,
  isUnlocked,
  onSelectLevel,
}: WorldCardProps) {
  const { t } = useLanguage();
  const backgroundImage = WORLD_BACKGROUNDS[world.theme];
  const worldIcon = WORLD_ICONS[world.theme];
  const themeColors = WORLD_THEME_COLORS[world.theme];

  return (
    <Card
      className={`
        relative overflow-hidden transition-all duration-500 group
        ${
          isUnlocked
            ? "hover:shadow-2xl hover:scale-105 cursor-pointer"
            : "opacity-75"
        }
      `}
      style={{
        borderWidth: "3px",
        borderColor: isUnlocked ? themeColors.primary : "#d1d5db",
      }}
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          filter: isUnlocked
            ? "brightness(0.4)"
            : "brightness(0.2) grayscale(1)",
        }}
      />

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isUnlocked
            ? `linear-gradient(135deg, ${themeColors.dark}90 0%, ${themeColors.primary}70 50%, ${themeColors.light}50 100%)`
            : "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Animated Border Glow */}
      {isUnlocked && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: `inset 0 0 30px ${themeColors.primary}`,
          }}
        />
      )}

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* World Icon */}
            <div
              className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12"
              style={{
                backgroundColor: isUnlocked ? themeColors.light : "#6b7280",
                boxShadow: isUnlocked
                  ? `0 0 20px ${themeColors.primary}`
                  : "none",
              }}
            >
              <img
                src={worldIcon}
                alt={world.name}
                className="w-10 h-10 object-contain drop-shadow-lg"
              />
            </div>

            <div>
              <div className="text-2xl font-bold text-white drop-shadow-lg">
                {t(world.name as any)}
              </div>
            </div>
          </div>
          {!isUnlocked && (
            <div className="p-3 rounded-full bg-gray-700/80 backdrop-blur-sm">
              <Lock className="h-6 w-6 text-white" />
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="relative z-10">
        {isUnlocked ? (
          <>
            {/* World Progress Summary */}
            <div className="flex items-center justify-between mb-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-fruit-star text-fruit-star" />
                <span className="font-bold text-lg">
                  {progress.totalStars} / 90
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {progress.completedLevels} / 30 {t("level")}
              </span>
            </div>

            <div className="mb-4">
              <Progress
                value={(progress.completedLevels / 30) * 100}
                className="h-3 bg-white/30 backdrop-blur-sm"
                style={{
                  ["--progress-background" as string]: themeColors.primary,
                }}
              />
            </div>

            {/* Level Grid with Star Display - 6 columns for 30 levels */}
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((levelId) => {
                const levelData = progress.levels[levelId - 1];
                const levelStars = levelData ? levelData.stars : 0;
                const levelCompleted = levelData?.completed || false;

                return (
                  <div
                    key={levelId}
                    className="flex flex-col items-center gap-1"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectLevel(levelId)}
                      className={`
                        h-9 w-full p-0 font-bold text-xs transition-all duration-300
                        ${
                          levelCompleted
                            ? "bg-white hover:bg-white/90 border-2 hover:scale-110"
                            : "bg-white/80 hover:bg-white/90 hover:scale-105"
                        }
                      `}
                      style={{
                        borderColor: levelCompleted
                          ? themeColors.primary
                          : "#d1d5db",
                        color: levelCompleted ? themeColors.primary : "#6b7280",
                      }}
                    >
                      {levelId}
                    </Button>

                    {/* Star Display Below Level */}
                    <div className="flex items-center gap-0.5 h-3">
                      {[1, 2, 3].map((starNum) => (
                        <Star
                          key={starNum}
                          className={`h-2.5 w-2.5 transition-all ${
                            starNum <= levelStars
                              ? "fill-fruit-star text-fruit-star"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-black/40 backdrop-blur-sm rounded-lg">
            <Lock className="h-16 w-16 mx-auto mb-4 text-white drop-shadow-lg" />
            <p className="text-white font-bold text-lg drop-shadow-md">
              {world.requiredStars} {t("stars")} {t("locked").toLowerCase()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
