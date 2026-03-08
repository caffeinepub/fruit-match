import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PowerUp } from "@/lib/gameLogic";

interface PowerUpPanelProps {
  powerUps: PowerUp[];
  onActivate: (type: string) => void;
  themeColor: string;
}

const POWER_UP_CONFIG = {
  bomb: {
    icon: "/assets/generated/bomb-powerup-transparent.dim_64x64.png",
    emoji: "💣",
    label: "Bomba",
    description: "Bir meyve türünün tüm karolarını temizler",
  },
  time: {
    icon: "/assets/generated/hourglass-powerup-transparent.dim_64x64.png",
    emoji: "⏰",
    label: "Zaman",
    description: "+10 saniye ekler",
  },
  hint: {
    icon: "/assets/generated/magnifier-powerup-transparent.dim_64x64.png",
    emoji: "🔍",
    label: "İpucu",
    description: "Gizli bir karoyu kısaca gösterir",
  },
  shuffle: {
    icon: "/assets/generated/shuffle-powerup-transparent.dim_64x64.png",
    emoji: "🔄",
    label: "Karıştır",
    description: "Tüm karoları yeniden karıştırır",
  },
  magnifier: {
    icon: "/assets/generated/magnifier-powerup-transparent.dim_64x64.png",
    emoji: "🔍",
    label: "Büyüteç",
    description: "Gizli bir karoyu kısaca gösterir",
  },
  clock: {
    icon: "/assets/generated/hourglass-powerup-transparent.dim_64x64.png",
    emoji: "⏰",
    label: "Saat",
    description: "+10 saniye ekler",
  },
};

// Default fallback power-ups for error recovery
const DEFAULT_POWER_UPS: PowerUp[] = [
  { type: "bomb", count: 0 },
  { type: "clock", count: 0 },
  { type: "magnifier", count: 0 },
  { type: "shuffle", count: 0 },
];

export default function PowerUpPanel({
  powerUps,
  onActivate,
  themeColor,
}: PowerUpPanelProps) {
  // CRITICAL: Safe filtering to prevent undefined references
  // Filter out any null/undefined items and ensure they have valid type and icon config
  const safePowerUps = (powerUps ?? []).filter((p): p is PowerUp => {
    if (!p || typeof p !== "object") return false;
    if (!p.type || typeof p.type !== "string") return false;
    if (typeof p.count !== "number") return false;
    // Verify that the power-up type has a valid config entry
    return p.type in POWER_UP_CONFIG;
  });

  // Fallback: If no valid power-ups, use defaults to maintain UI structure
  const displayPowerUps =
    safePowerUps.length > 0 ? safePowerUps : DEFAULT_POWER_UPS;

  // Additional safety check: ensure we have at least some power-ups to display
  if (!displayPowerUps || displayPowerUps.length === 0) {
    console.warn(
      "[PowerUpPanel] No valid power-ups to display, using fallback",
    );
    return (
      <div className="powerup-panel-compact">
        <div className="flex items-center justify-center gap-2">
          {DEFAULT_POWER_UPS.map((powerUp) => {
            const config =
              POWER_UP_CONFIG[powerUp.type as keyof typeof POWER_UP_CONFIG];
            return (
              <div
                key={powerUp.type}
                className="relative flex flex-col items-center gap-1 p-2 h-auto min-w-[70px] opacity-40 bg-gray-100 border-2 border-gray-300 rounded-lg"
              >
                <img
                  src={config.icon}
                  alt={config.label}
                  className="w-8 h-8 object-contain grayscale"
                />
                <span className="text-xs font-bold text-gray-400">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="powerup-panel-compact">
      <TooltipProvider>
        <div className="flex items-center justify-center gap-2">
          {displayPowerUps.map((powerUp) => {
            // Additional safety: verify config exists for this power-up type
            const config =
              POWER_UP_CONFIG[powerUp.type as keyof typeof POWER_UP_CONFIG];

            if (!config) {
              console.warn(
                `[PowerUpPanel] No config found for power-up type: ${powerUp.type}`,
              );
              return null;
            }

            const isDisabled = powerUp.count === 0;

            return (
              <Tooltip key={powerUp.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onActivate(powerUp.type)}
                    disabled={isDisabled}
                    className={`
                      relative flex flex-col items-center gap-1 p-2 h-auto min-w-[70px]
                      transition-all duration-300 border-2 rounded-lg
                      ${
                        isDisabled
                          ? "opacity-40 cursor-not-allowed bg-gray-100"
                          : "hover:scale-110 hover:shadow-xl bg-white/95 active:scale-95"
                      }
                    `}
                    style={{
                      borderColor: isDisabled ? "#e5e7eb" : themeColor,
                    }}
                  >
                    <div className="relative">
                      <img
                        src={config.icon}
                        alt={config.label}
                        className={`w-8 h-8 object-contain transition-all ${
                          isDisabled
                            ? "grayscale"
                            : "hover:scale-110 drop-shadow-md"
                        }`}
                        onError={(e) => {
                          console.error(
                            `[PowerUpPanel] Failed to load icon: ${config.icon}`,
                          );
                          // Fallback to emoji if image fails
                          e.currentTarget.style.display = "none";
                        }}
                      />

                      {/* Count badge */}
                      <div
                        className={`
                          absolute -top-2 -right-2 w-5 h-5 rounded-full 
                          flex items-center justify-center text-white text-xs font-bold
                          shadow-lg border-2 border-white transition-all
                          ${isDisabled ? "bg-gray-400" : "animate-pulse"}
                        `}
                        style={{
                          backgroundColor: isDisabled ? undefined : themeColor,
                        }}
                      >
                        {powerUp.count}
                      </div>
                    </div>

                    <span
                      className="text-xs font-bold leading-tight"
                      style={{ color: isDisabled ? "#9ca3af" : themeColor }}
                    >
                      {config.label}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-white/98 backdrop-blur-md border-2 shadow-xl p-3"
                  style={{ borderColor: themeColor }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{config.emoji}</span>
                    <p className="font-bold text-sm">{config.label}</p>
                  </div>
                  <p className="text-xs text-gray-700">{config.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Kalan: {powerUp.count}
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
