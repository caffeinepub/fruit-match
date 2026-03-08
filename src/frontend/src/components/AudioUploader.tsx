import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Music, Upload, Volume2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ExternalBlob, SoundContext, Theme } from "../backend";
import { useActor } from "../hooks/useActor";

interface AudioFileConfig {
  id: string;
  context: SoundContext;
  world?: Theme;
  description: string;
  url?: string;
}

const AUDIO_FILE_CONFIGS: AudioFileConfig[] = [
  // Background music for each world
  {
    id: "bg-garden",
    context: SoundContext.backgroundMusic,
    world: Theme.garden,
    description: "Garden Background Music",
  },
  {
    id: "bg-ocean",
    context: SoundContext.backgroundMusic,
    world: Theme.ocean,
    description: "Ocean Background Music",
  },
  {
    id: "bg-candyland",
    context: SoundContext.backgroundMusic,
    world: Theme.candyland,
    description: "Candyland Background Music",
  },
  {
    id: "bg-forest",
    context: SoundContext.backgroundMusic,
    world: Theme.forest,
    description: "Forest Background Music",
  },
  {
    id: "bg-volcano",
    context: SoundContext.backgroundMusic,
    world: Theme.volcano,
    description: "Volcano Background Music",
  },
  {
    id: "bg-space",
    context: SoundContext.backgroundMusic,
    world: Theme.space,
    description: "Space Background Music",
  },

  // Interaction sounds
  {
    id: "tile-click",
    context: SoundContext.tileClick,
    description: "Tile Click Sound",
  },
  {
    id: "tile-match",
    context: SoundContext.tileMatch,
    description: "Tile Match Sound",
  },
  {
    id: "tile-clear",
    context: SoundContext.tileClear,
    description: "Tile Clear Sound",
  },
  {
    id: "layer-open",
    context: SoundContext.layerOpen,
    description: "Layer Open Sound",
  },

  // Power-up sounds
  {
    id: "bomb",
    context: SoundContext.bomb,
    description: "Bomb Power-up Sound",
  },
  {
    id: "clock",
    context: SoundContext.clock,
    description: "Clock Power-up Sound",
  },
  {
    id: "magnifier",
    context: SoundContext.magnifier,
    description: "Magnifier Power-up Sound",
  },
  {
    id: "shuffle",
    context: SoundContext.shuffle,
    description: "Shuffle Power-up Sound",
  },

  // Achievement sounds
  {
    id: "level-complete",
    context: SoundContext.levelComplete,
    description: "Level Complete Sound",
  },
  {
    id: "star-earned",
    context: SoundContext.starEarned,
    description: "Star Earned Sound",
  },
  {
    id: "world-unlock",
    context: SoundContext.worldUnlock,
    description: "World Unlock Sound",
  },
  {
    id: "button-click",
    context: SoundContext.buttonClick,
    description: "Button Click Sound",
  },
  {
    id: "reward-claim",
    context: SoundContext.rewardClaim,
    description: "Reward Claim Sound",
  },
];

export default function AudioUploader() {
  const { actor } = useActor();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("audio") && !file.name.endsWith(".mp3")) {
        toast.error("Lütfen bir MP3 dosyası seçin");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadFromFile = async () => {
    if (!selectedFile || !selectedConfig || !actor) {
      toast.error("Lütfen dosya ve ses türü seçin");
      return;
    }

    setIsUploading(true);
    try {
      const config = AUDIO_FILE_CONFIGS.find((c) => c.id === selectedConfig);
      if (!config) {
        throw new Error("Geçersiz yapılandırma");
      }

      // Read file as array buffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Create ExternalBlob with upload progress
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          console.log(`Upload progress: ${percentage}%`);
        },
      );

      // Upload to backend
      await actor.addAudioFile(
        config.id,
        config.context,
        config.world || null,
        blob,
        config.description,
      );

      toast.success(`${config.description} başarıyla yüklendi!`);
      setSelectedFile(null);
      setSelectedConfig("");

      // Reset file input
      const fileInput = document.getElementById(
        "file-input",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Yükleme hatası: ${error.message || error}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAndUpload = async () => {
    if (!downloadUrl || !selectedConfig || !actor) {
      toast.error("Lütfen URL ve ses türü girin");
      return;
    }

    setIsDownloading(true);
    try {
      const config = AUDIO_FILE_CONFIGS.find((c) => c.id === selectedConfig);
      if (!config) {
        throw new Error("Geçersiz yapılandırma");
      }

      // Download from URL
      toast.info("MP3 dosyası indiriliyor...");
      const response = await fetch(downloadUrl, {
        method: "GET",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      toast.info("Dosya backend'e yükleniyor...");

      // Create ExternalBlob with upload progress
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          console.log(`Upload progress: ${percentage}%`);
        },
      );

      // Upload to backend
      await actor.addAudioFile(
        config.id,
        config.context,
        config.world || null,
        blob,
        config.description,
      );

      toast.success(`${config.description} başarıyla indirildi ve yüklendi!`);
      setDownloadUrl("");
      setSelectedConfig("");
    } catch (error: any) {
      console.error("Download/Upload error:", error);
      toast.error(`İndirme/Yükleme hatası: ${error.message || error}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-3xl">
            <Music className="w-8 h-8" />
            Ses Dosyası Yükleyici
          </CardTitle>
          <CardDescription>
            Oyun için MP3 ses dosyalarını yükleyin. Her ses türü için bir dosya
            yükleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Config selector */}
          <div className="space-y-2">
            <Label htmlFor="config-select" className="text-lg font-semibold">
              Ses Türü Seçin
            </Label>
            <Select value={selectedConfig} onValueChange={setSelectedConfig}>
              <SelectTrigger id="config-select" className="w-full">
                <SelectValue placeholder="Ses türü seçin..." />
              </SelectTrigger>
              <SelectContent>
                <div className="font-semibold px-2 py-1 text-sm text-gray-500">
                  Arka Plan Müzikleri
                </div>
                {AUDIO_FILE_CONFIGS.filter(
                  (c) => c.context === SoundContext.backgroundMusic,
                ).map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    🎵 {config.description}
                  </SelectItem>
                ))}
                <div className="font-semibold px-2 py-1 text-sm text-gray-500 mt-2">
                  Etkileşim Sesleri
                </div>
                {AUDIO_FILE_CONFIGS.filter(
                  (c) =>
                    c.context === SoundContext.tileClick ||
                    c.context === SoundContext.tileMatch ||
                    c.context === SoundContext.tileClear ||
                    c.context === SoundContext.layerOpen,
                ).map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    🔊 {config.description}
                  </SelectItem>
                ))}
                <div className="font-semibold px-2 py-1 text-sm text-gray-500 mt-2">
                  Güç Sesleri
                </div>
                {AUDIO_FILE_CONFIGS.filter(
                  (c) =>
                    c.context === SoundContext.bomb ||
                    c.context === SoundContext.clock ||
                    c.context === SoundContext.magnifier ||
                    c.context === SoundContext.shuffle,
                ).map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    💥 {config.description}
                  </SelectItem>
                ))}
                <div className="font-semibold px-2 py-1 text-sm text-gray-500 mt-2">
                  Başarı Sesleri
                </div>
                {AUDIO_FILE_CONFIGS.filter(
                  (c) =>
                    c.context === SoundContext.levelComplete ||
                    c.context === SoundContext.starEarned ||
                    c.context === SoundContext.worldUnlock ||
                    c.context === SoundContext.buttonClick ||
                    c.context === SoundContext.rewardClaim,
                ).map((config) => (
                  <SelectItem key={config.id} value={config.id}>
                    ⭐ {config.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload from file */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              <h3 className="text-xl font-semibold">Dosyadan Yükle</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file-input">MP3 Dosyası Seçin</Label>
              <Input
                id="file-input"
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Seçili: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button
              onClick={handleUploadFromFile}
              disabled={!selectedFile || !selectedConfig || isUploading}
              className="w-full"
              size="lg"
            >
              {isUploading ? "Yükleniyor..." : "Dosyayı Yükle"}
            </Button>
          </div>

          {/* Download from URL */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              <h3 className="text-xl font-semibold">URL\'den İndir ve Yükle</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url-input">MP3 Dosyası URL\'si</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com/audio.mp3"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                disabled={isDownloading}
              />
            </div>
            <Button
              onClick={handleDownloadAndUpload}
              disabled={!downloadUrl || !selectedConfig || isDownloading}
              className="w-full"
              size="lg"
              variant="secondary"
            >
              {isDownloading
                ? "İndiriliyor ve Yükleniyor..."
                : "İndir ve Yükle"}
            </Button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Kullanım Talimatları
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Her ses türü için bir MP3 dosyası yükleyin</li>
              <li>
                Dosyaları bilgisayarınızdan seçebilir veya URL\'den
                indirebilirsiniz
              </li>
              <li>Arka plan müzikleri her dünya için ayrı ayrı yüklenir</li>
              <li>Yüklenen dosyalar otomatik olarak oyunda kullanılır</li>
              <li>Dosyalar blob storage\'da güvenli şekilde saklanır</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
