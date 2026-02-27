import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useActor } from '../hooks/useActor';
import { ExternalBlob, SoundContext, Theme } from '../backend';
import { toast } from 'sonner';
import { Download, Music, CheckCircle, XCircle, Loader2, ClipboardPaste } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface AudioFileMapping {
  filename: string;
  id: string;
  context: SoundContext;
  world?: Theme;
  description: string;
}

const AUDIO_FILE_MAPPINGS: AudioFileMapping[] = [
  // Background Music - mapped according to user specification
  {
    filename: 'Garden.mp3',
    id: 'bg-garden',
    context: SoundContext.backgroundMusic,
    world: Theme.garden,
    description: 'Garden Background Music',
  },
  {
    filename: 'Forest.mp3',
    id: 'bg-forest',
    context: SoundContext.backgroundMusic,
    world: Theme.forest,
    description: 'Forest Background Music',
  },
  {
    filename: 'Tropic.mp3',
    id: 'bg-candyland',
    context: SoundContext.backgroundMusic,
    world: Theme.candyland,
    description: 'Tropic (Candyland) Background Music',
  },
  {
    filename: 'Ice.mp3',
    id: 'bg-ocean',
    context: SoundContext.backgroundMusic,
    world: Theme.ocean,
    description: 'Ice (Ocean) Background Music',
  },
  {
    filename: 'Volcano.mp3',
    id: 'bg-volcano',
    context: SoundContext.backgroundMusic,
    world: Theme.volcano,
    description: 'Volcano Background Music',
  },
  {
    filename: 'Space.mp3',
    id: 'bg-space',
    context: SoundContext.backgroundMusic,
    world: Theme.space,
    description: 'Space Background Music',
  },
  // Interaction Sounds
  {
    filename: 'Tile Click.mp3',
    id: 'tile-click',
    context: SoundContext.tileClick,
    description: 'Tile Click Sound',
  },
  {
    filename: 'Tile Match.mp3',
    id: 'tile-match',
    context: SoundContext.tileMatch,
    description: 'Tile Match Sound',
  },
  {
    filename: 'Tile Clear.mp3',
    id: 'tile-clear',
    context: SoundContext.tileClear,
    description: 'Tile Clear Sound',
  },
  {
    filename: 'Layer Open.mp3',
    id: 'layer-open',
    context: SoundContext.layerOpen,
    description: 'Layer Open Sound',
  },
  // Power-Up Sounds
  {
    filename: 'Bomb Power-Up.mp3',
    id: 'bomb',
    context: SoundContext.bomb,
    description: 'Bomb Power-up Sound',
  },
  {
    filename: 'Clock Power-Up.mp3',
    id: 'clock',
    context: SoundContext.clock,
    description: 'Clock Power-up Sound',
  },
  {
    filename: 'Magnifier Power-Up.mp3',
    id: 'magnifier',
    context: SoundContext.magnifier,
    description: 'Magnifier Power-up Sound',
  },
  {
    filename: 'Shuffle Power-Up.mp3',
    id: 'shuffle',
    context: SoundContext.shuffle,
    description: 'Shuffle Power-up Sound',
  },
  // Achievement & Menu Sounds
  {
    filename: 'Level Complete.mp3',
    id: 'level-complete',
    context: SoundContext.levelComplete,
    description: 'Level Complete Sound',
  },
  {
    filename: 'Star Earned.mp3',
    id: 'star-earned',
    context: SoundContext.starEarned,
    description: 'Star Earned Sound',
  },
  {
    filename: 'New World Unlock.mp3',
    id: 'world-unlock',
    context: SoundContext.worldUnlock,
    description: 'World Unlock Sound',
  },
  {
    filename: 'Button Click.mp3',
    id: 'button-click',
    context: SoundContext.buttonClick,
    description: 'Button Click Sound',
  },
  {
    filename: 'Reward Claim.mp3',
    id: 'reward-claim',
    context: SoundContext.rewardClaim,
    description: 'Reward Claim Sound',
  },
];

interface UploadStatus {
  filename: string;
  status: 'pending' | 'downloading' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

export default function BulkAudioUploader() {
  const { actor } = useActor();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [bulkUrlText, setBulkUrlText] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(true);

  const updateStatus = (filename: string, updates: Partial<UploadStatus>) => {
    setUploadStatuses((prev) => {
      const existing = prev.find((s) => s.filename === filename);
      if (existing) {
        return prev.map((s) =>
          s.filename === filename ? { ...s, ...updates } : s
        );
      }
      return [...prev, { filename, status: 'pending', ...updates }];
    });
  };

  const handleBulkPaste = () => {
    const lines = bulkUrlText.trim().split('\n').filter(line => line.trim());
    
    if (lines.length !== 19) {
      toast.error(`19 URL bekleniyor, ${lines.length} URL bulundu. Her satıra bir URL girin.`);
      return;
    }

    const newUrlInputs: Record<string, string> = {};
    AUDIO_FILE_MAPPINGS.forEach((mapping, index) => {
      if (lines[index]) {
        newUrlInputs[mapping.filename] = lines[index].trim();
      }
    });

    setUrlInputs(newUrlInputs);
    setShowBulkInput(false);
    toast.success('19 URL başarıyla yüklendi! Şimdi "Tümünü İndir ve Yükle" butonuna tıklayın.');
  };

  const handleBulkUpload = async () => {
    if (!actor) {
      toast.error('Backend bağlantısı hazır değil');
      return;
    }

    // Validate that all URLs are provided
    const missingUrls = AUDIO_FILE_MAPPINGS.filter(
      (mapping) => !urlInputs[mapping.filename]
    );

    if (missingUrls.length > 0) {
      toast.error(
        `Lütfen tüm dosyalar için URL girin. Eksik: ${missingUrls.length} dosya`
      );
      return;
    }

    setIsProcessing(true);
    setUploadStatuses([]);
    setOverallProgress(0);

    const totalFiles = AUDIO_FILE_MAPPINGS.length;
    let completedFiles = 0;

    for (const mapping of AUDIO_FILE_MAPPINGS) {
      const url = urlInputs[mapping.filename];
      if (!url) continue;

      try {
        updateStatus(mapping.filename, { status: 'downloading' });

        // Download from URL
        console.log(`[BulkUploader] Downloading: ${mapping.filename} from ${url}`);
        const response = await fetch(url, {
          method: 'GET',
          mode: 'cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        console.log(
          `[BulkUploader] Downloaded ${uint8Array.length} bytes for ${mapping.filename}`
        );

        updateStatus(mapping.filename, { status: 'uploading' });

        // Create ExternalBlob with upload progress
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
          (percentage) => {
            updateStatus(mapping.filename, { progress: percentage });
          }
        );

        // Upload to backend
        await actor.addAudioFile(
          mapping.id,
          mapping.context,
          mapping.world || null,
          blob,
          mapping.description
        );

        updateStatus(mapping.filename, { status: 'success', progress: 100 });
        console.log(`[BulkUploader] ✓ Successfully uploaded: ${mapping.filename}`);

        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      } catch (error: any) {
        console.error(`[BulkUploader] ✗ Failed to process ${mapping.filename}:`, error);
        updateStatus(mapping.filename, {
          status: 'error',
          error: error.message || String(error),
        });
        completedFiles++;
        setOverallProgress((completedFiles / totalFiles) * 100);
      }
    }

    setIsProcessing(false);

    const successCount = uploadStatuses.filter((s) => s.status === 'success').length;
    const errorCount = uploadStatuses.filter((s) => s.status === 'error').length;

    if (errorCount === 0) {
      toast.success(`Tüm ${totalFiles} ses dosyası başarıyla yüklendi! 🎉`);
    } else {
      toast.warning(
        `${successCount} dosya başarılı, ${errorCount} dosya başarısız oldu.`
      );
    }
  };

  const handleUrlChange = (filename: string, url: string) => {
    setUrlInputs((prev) => ({ ...prev, [filename]: url }));
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'downloading':
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Music className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status.status) {
      case 'downloading':
        return 'İndiriliyor...';
      case 'uploading':
        return `Yükleniyor... ${status.progress || 0}%`;
      case 'success':
        return 'Başarılı ✓';
      case 'error':
        return `Hata: ${status.error}`;
      default:
        return 'Bekliyor';
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-3xl">
          <Download className="w-8 h-8" />
          Toplu Ses Dosyası Yükleyici
        </CardTitle>
        <CardDescription className="text-lg">
          Tüm oyun ses dosyalarını tek seferde indirin ve yükleyin. 19 MP3 dosyası için URL'leri girin.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bulk URL Input Section */}
        {showBulkInput && (
          <div className="space-y-4 border-2 border-dashed border-blue-300 rounded-lg p-6 bg-blue-50">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-blue-900">
                <ClipboardPaste className="w-6 h-6 inline mr-2" />
                Toplu URL Girişi
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkInput(false)}
              >
                Tek Tek Gir
              </Button>
            </div>
            <p className="text-sm text-blue-800">
              19 MP3 dosyası için URL'leri aşağıya yapıştırın. Her satıra bir URL girin (toplam 19 satır).
              Sıralama: Garden, Forest, Tropic, Ice, Volcano, Space, Tile Click, Tile Match, Tile Clear, Layer Open, Bomb, Clock, Magnifier, Shuffle, Level Complete, Star Earned, New World Unlock, Button Click, Reward Claim
            </p>
            <Textarea
              placeholder={`https://example.com/audio/Garden.mp3
https://example.com/audio/Forest.mp3
https://example.com/audio/Tropic.mp3
https://example.com/audio/Ice.mp3
... (19 URL toplam)`}
              value={bulkUrlText}
              onChange={(e) => setBulkUrlText(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              disabled={isProcessing}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {bulkUrlText.trim().split('\n').filter(line => line.trim()).length} / 19 URL
              </span>
              <Button
                onClick={handleBulkPaste}
                disabled={isProcessing}
                size="lg"
              >
                <ClipboardPaste className="w-5 h-5 mr-2" />
                URL'leri Yükle
              </Button>
            </div>
          </div>
        )}

        {/* Individual URL Input Section */}
        {!showBulkInput && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Ses Dosyası URL'leri</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkInput(true)}
              >
                Toplu Giriş
              </Button>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {AUDIO_FILE_MAPPINGS.map((mapping) => {
                  const status = uploadStatuses.find(
                    (s) => s.filename === mapping.filename
                  );
                  return (
                    <div
                      key={mapping.filename}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status?.status || 'pending')}
                          <span className="font-semibold">{mapping.description}</span>
                        </div>
                        {status && (
                          <span className="text-sm text-gray-600">
                            {getStatusText(status)}
                          </span>
                        )}
                      </div>
                      <input
                        type="url"
                        placeholder={`${mapping.filename} için URL girin`}
                        value={urlInputs[mapping.filename] || ''}
                        onChange={(e) =>
                          handleUrlChange(mapping.filename, e.target.value)
                        }
                        disabled={isProcessing}
                        className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="text-xs text-gray-500">
                        Dosya: {mapping.filename} | ID: {mapping.id} | Context: {mapping.context}
                        {mapping.world && ` | World: ${mapping.world}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Overall Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Genel İlerleme</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="w-full" />
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleBulkUpload}
          disabled={isProcessing || Object.keys(urlInputs).length === 0}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              İşleniyor... ({uploadStatuses.filter((s) => s.status === 'success').length}/
              {AUDIO_FILE_MAPPINGS.length})
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Tümünü İndir ve Yükle ({AUDIO_FILE_MAPPINGS.length} Dosya)
            </>
          )}
        </Button>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900">📋 Kullanım Talimatları</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>19 MP3 dosyası için geçerli URL'leri hazırlayın</li>
            <li>Toplu giriş için: Tüm URL'leri kopyalayıp yapıştırın (her satıra bir URL, doğru sırada)</li>
            <li>Tek tek giriş için: Her dosya için URL'yi ayrı ayrı girin</li>
            <li>Tüm URL'ler girildikten sonra "Tümünü İndir ve Yükle" butonuna tıklayın</li>
            <li>Sistem her dosyayı sırayla indirecek ve backend blob storage'a yükleyecek</li>
            <li>İşlem tamamlandığında ses dosyaları otomatik olarak oyunda kullanılır</li>
            <li>Başarısız yüklemeler için hata mesajları gösterilir</li>
            <li>Sayfa yenilendikten sonra sesler otomatik olarak yüklenecektir</li>
          </ul>
        </div>

        {/* File List Reference */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold mb-2">📝 Gerekli Dosyalar (19 adet) - Doğru Sıralama</h4>
          <div className="text-xs text-gray-700 space-y-1">
            <p className="font-semibold">Arka Plan Müzikleri (6):</p>
            <ul className="list-disc list-inside ml-4 space-y-0.5">
              <li>Garden.mp3 → Garden World</li>
              <li>Forest.mp3 → Forest World</li>
              <li>Tropic.mp3 → Candyland World</li>
              <li>Ice.mp3 → Ocean World</li>
              <li>Volcano.mp3 → Volcano World</li>
              <li>Space.mp3 → Space World</li>
            </ul>
            <p className="font-semibold mt-2">Etkileşim Sesleri (4):</p>
            <ul className="list-disc list-inside ml-4 space-y-0.5">
              <li>Tile Click.mp3</li>
              <li>Tile Match.mp3</li>
              <li>Tile Clear.mp3</li>
              <li>Layer Open.mp3</li>
            </ul>
            <p className="font-semibold mt-2">Güç Sesleri (4):</p>
            <ul className="list-disc list-inside ml-4 space-y-0.5">
              <li>Bomb Power-Up.mp3</li>
              <li>Clock Power-Up.mp3</li>
              <li>Magnifier Power-Up.mp3</li>
              <li>Shuffle Power-Up.mp3</li>
            </ul>
            <p className="font-semibold mt-2">Başarı & Menü Sesleri (5):</p>
            <ul className="list-disc list-inside ml-4 space-y-0.5">
              <li>Level Complete.mp3</li>
              <li>Star Earned.mp3</li>
              <li>New World Unlock.mp3</li>
              <li>Button Click.mp3</li>
              <li>Reward Claim.mp3</li>
            </ul>
          </div>
        </div>

        {/* Summary */}
        {uploadStatuses.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Özet</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">
                  {uploadStatuses.filter((s) => s.status === 'success').length}
                </div>
                <div className="text-sm text-green-600">Başarılı</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-700">
                  {uploadStatuses.filter((s) => s.status === 'error').length}
                </div>
                <div className="text-sm text-red-600">Başarısız</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-700">
                  {AUDIO_FILE_MAPPINGS.length}
                </div>
                <div className="text-sm text-gray-600">Toplam</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
