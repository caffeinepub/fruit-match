import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '@/hooks/useActor';
import { AudioFile } from '@/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Music, Trash2, Play, Download } from 'lucide-react';
import { toast } from 'sonner';
import AudioUploader from '@/components/AudioUploader';
import BulkAudioUploader from '@/components/BulkAudioUploader';

export default function AudioManagement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [selectedAudio, setSelectedAudio] = useState<AudioFile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: audioFiles, isLoading } = useQuery<AudioFile[]>({
    queryKey: ['audioFiles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return await actor.getAllAudioFiles();
    },
    enabled: !!actor,
  });

  const deleteAudioMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteAudioFile(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      toast.success('Ses dosyası silindi');
      setShowDeleteDialog(false);
      setSelectedAudio(null);
    },
    onError: (error: any) => {
      toast.error('Hata: ' + error.message);
    },
  });

  const handleDeleteClick = (audio: AudioFile) => {
    setSelectedAudio(audio);
    setShowDeleteDialog(true);
  };

  const handleDelete = () => {
    if (!selectedAudio) return;
    deleteAudioMutation.mutate(selectedAudio.id);
  };

  const handlePlayAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(err => {
      toast.error('Ses çalınamadı: ' + err.message);
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-6 h-6" />
            Ses Dosyası Yönetimi
          </CardTitle>
          <CardDescription>
            Oyun ses dosyalarını yükleyin, silin ve yönetin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">
                Yüklü Sesler ({audioFiles?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="bulk">
                <Download className="w-4 h-4 mr-2" />
                Toplu Yükleme
              </TabsTrigger>
              <TabsTrigger value="single">
                <Music className="w-4 h-4 mr-2" />
                Tekli Yükleme
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Yükleniyor...</p>
                </div>
              ) : audioFiles && audioFiles.length > 0 ? (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {audioFiles.map((file) => (
                      <Card key={file.id} className="border-2 hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <h4 className="font-semibold text-lg">{file.description}</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">ID:</span> {file.id}</p>
                                <p><span className="font-medium">Context:</span> {file.context}</p>
                                {file.world && (
                                  <p><span className="font-medium">Dünya:</span> {file.world}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePlayAudio(file.blob.getDirectURL())}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteClick(file)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">Henüz ses dosyası yüklenmemiş</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="bulk" className="mt-6">
              <BulkAudioUploader />
            </TabsContent>

            <TabsContent value="single" className="mt-6">
              <AudioUploader />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Audio Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ses Dosyasını Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{selectedAudio?.description}</strong> adlı ses dosyası silinecek.
              Bu işlem geri alınamaz. Devam etmek istediğinizden emin misiniz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
