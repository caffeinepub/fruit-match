import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import {
  ArrowLeft,
  Bomb,
  Check,
  Clock,
  Edit2,
  ExternalLink,
  Lightbulb,
  Palette,
  RotateCcw,
  Shuffle,
  Star,
  Trophy,
  User,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Theme } from "../backend";
import * as LocalStorage from "../lib/localStorageManager";
import { getSoundManager } from "../lib/soundManager";

interface PlayerProfileProps {
  onBackToTitle: () => void;
  currentTheme: Theme;
}

const THEME_NAMES: Record<Theme, string> = {
  [Theme.garden]: "Bahçe",
  [Theme.ocean]: "Okyanus",
  [Theme.candyland]: "Şekerler Diyarı",
  [Theme.forest]: "Orman",
  [Theme.volcano]: "Volkan",
  [Theme.space]: "Uzay",
};

const THEME_EMOJIS: Record<Theme, string> = {
  [Theme.garden]: "🌿",
  [Theme.ocean]: "🌊",
  [Theme.candyland]: "🍭",
  [Theme.forest]: "🌲",
  [Theme.volcano]: "🌋",
  [Theme.space]: "🚀",
};

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

export default function PlayerProfile({
  onBackToTitle,
  currentTheme,
}: PlayerProfileProps) {
  const [playerData, setPlayerData] =
    useState<LocalStorage.LocalPlayerData | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const { t } = useLanguage();
  const soundManager = getSoundManager();
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(
    soundManager.getSoundEnabled(),
  );

  const themeGradient = THEME_GRADIENTS[currentTheme];

  // Load player data from localStorage
  useEffect(() => {
    const data = LocalStorage.loadPlayerData();
    setPlayerData(data);
    if (data) {
      setNewUsername(data.username);
    }
  }, []);

  const totalStars = playerData?.totalStars || 0;

  const worldsCompleted = playerData
    ? playerData.worlds.filter((world) =>
        world.levels.every((level) => level.completed),
      ).length
    : 0;

  const totalLevelsCompleted = playerData
    ? playerData.worlds.reduce(
        (sum, world) =>
          sum + world.levels.filter((level) => level.completed).length,
        0,
      )
    : 0;

  const powerUpCounts = playerData?.powerUpCounts || {
    bomb: 0,
    clock: 0,
    shuffle: 0,
    magnifier: 0,
  };

  const toggleSound = async () => {
    await soundManager.resumeContext();

    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    soundManager.setSoundEnabled(newState);
  };

  const handleReset = () => {
    console.log(
      "[PlayerProfile] ⚠️ User confirmed data reset - clearing all localStorage data",
    );
    LocalStorage.resetPlayerData();
    console.log(
      "[PlayerProfile] ✓ Data reset complete - returning to title screen",
    );
    onBackToTitle();
  };

  const handleSaveUsername = () => {
    const trimmed = newUsername.trim();
    if (trimmed && trimmed.length >= 2 && trimmed.length <= 20) {
      LocalStorage.updateUsername(trimmed);
      const data = LocalStorage.loadPlayerData();
      setPlayerData(data);
      setIsEditingUsername(false);
      console.log("[PlayerProfile] ✓ Username updated successfully");
    }
  };

  const handleCancelEdit = () => {
    setNewUsername(playerData?.username || "");
    setIsEditingUsername(false);
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

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="lg"
            onClick={onBackToTitle}
            className="text-white hover:bg-white/20 backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {t("return_to_menu")}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="lg"
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Verileri Sıfırla
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white/95 backdrop-blur-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-2xl font-bold text-gray-800">
                  Verileri Sıfırla
                </AlertDialogTitle>
                <AlertDialogDescription className="text-lg text-gray-600">
                  Oyun verilerinizi sıfırlamak istediğinizden emin misiniz? Bu
                  işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-base">
                  İptal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-base"
                >
                  Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card className="mb-8 bg-white/95 backdrop-blur-md shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
            </div>
            {isEditingUsername ? (
              <div className="space-y-3">
                <Label
                  htmlFor="username"
                  className="text-lg font-semibold text-gray-800"
                >
                  {t("player_name")}
                </Label>
                <div className="flex items-center gap-2 max-w-md mx-auto">
                  <Input
                    id="username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="text-lg py-2"
                    maxLength={20}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveUsername}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <CardTitle className="text-4xl font-bold text-gray-800">
                  {playerData.username}
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingUsername(true)}
                  className="hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-lg text-gray-600 mt-2">{t("player_profile")}</p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Star className="w-6 h-6 fill-fruit-star text-fruit-star" />
                </div>
                {t("total_stars")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-gray-800">{totalStars}</p>
              <p className="text-sm text-gray-600 mt-2">
                1080 {t("stars").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-full bg-green-100">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
                {t("worlds_completed")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-gray-800">
                {worldsCompleted}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                12 {t("world").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-full bg-blue-100">
                  <Trophy className="w-6 h-6 text-blue-600" />
                </div>
                {t("levels_completed")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-5xl font-bold text-gray-800">
                {totalLevelsCompleted}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                360 {t("level").toLowerCase()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/95 backdrop-blur-md shadow-xl hover:shadow-2xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 rounded-full bg-purple-100">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                {t("selected_theme")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <span className="text-5xl">{THEME_EMOJIS[currentTheme]}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-800">
                    {THEME_NAMES[currentTheme]}
                  </p>
                  <p className="text-sm text-gray-600">{t("active_theme")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/95 backdrop-blur-md shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Güç Artırıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200">
                <Bomb className="w-8 h-8 text-red-600" />
                <span className="text-3xl font-bold text-red-700">
                  {powerUpCounts.bomb}
                </span>
                <span className="text-sm font-semibold text-red-600">
                  Bomba
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                <Clock className="w-8 h-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-700">
                  {powerUpCounts.clock}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  Zaman
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
                <Shuffle className="w-8 h-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-700">
                  {powerUpCounts.shuffle}
                </span>
                <span className="text-sm font-semibold text-purple-600">
                  Karıştır
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200">
                <Lightbulb className="w-8 h-8 text-yellow-600" />
                <span className="text-3xl font-bold text-yellow-700">
                  {powerUpCounts.magnifier}
                </span>
                <span className="text-sm font-semibold text-yellow-600">
                  İpucu
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{t("world_progress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {playerData.worlds.map((world, index) => {
                const worldNames = [
                  t("garden"),
                  t("ocean"),
                  t("candyland"),
                  t("forest"),
                  t("volcano"),
                  t("space"),
                  "Çöl",
                  "Arktik",
                  "Orman",
                  "Kristal",
                  "Gölge",
                  "Gökkuşağı",
                ];
                const worldEmojis = [
                  "🌸",
                  "🌊",
                  "🍭",
                  "🌲",
                  "🌋",
                  "🚀",
                  "🏜️",
                  "❄️",
                  "🌴",
                  "💎",
                  "🌑",
                  "🌈",
                ];
                const worldName = worldNames[index];
                const worldEmoji = worldEmojis[index];
                const completedLevels = world.levels.filter(
                  (l) => l.completed,
                ).length;
                const worldStars = world.levels.reduce(
                  (sum, l) => sum + l.stars,
                  0,
                );
                const progressPercent = (completedLevels / 30) * 100;

                return (
                  <div
                    key={world.worldId}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{worldEmoji}</span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {worldName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {completedLevels}/30 {t("level").toLowerCase()} •{" "}
                            {worldStars} {t("stars").toLowerCase()}
                          </p>
                        </div>
                      </div>
                      {!world.unlocked && (
                        <span className="px-3 py-1 rounded-full bg-gray-300 text-gray-700 text-sm font-semibold">
                          {t("locked")}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center mb-8">
          <a
            href="https://sites.google.com/view/fruitmatchapp/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all duration-200 text-gray-800 font-medium text-base shadow-lg hover:scale-105"
          >
            <span>{t("privacy_policy")}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
