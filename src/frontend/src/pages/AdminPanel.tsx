import AudioManagement from "@/components/admin/AudioManagement";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { ArrowLeft, Lock, Music } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AdminPanelProps {
  onBack: () => void;
}

const ADMIN_PASSWORD = "adminking+154";

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { actor } = useActor();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showError, setShowError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordInput !== ADMIN_PASSWORD) {
      setShowError(true);
      setPasswordInput("");
      return;
    }

    // Password is correct, now authenticate with backend
    setIsLoggingIn(true);
    setShowError(false);

    try {
      if (!actor) {
        throw new Error("Backend bağlantısı başlatılamadı");
      }

      // Call backend adminLogin to grant admin privileges
      await actor.adminLogin(passwordInput);

      setIsAuthenticated(true);
      setPasswordInput("");
      toast.success("Yönetici girişi başarılı");
    } catch (error: any) {
      console.error("Admin login error:", error);
      setShowError(true);
      toast.error(`Giriş hatası: ${error.message || "Bilinmeyen hata"}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Show password modal if not authenticated
  if (!isAuthenticated) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Lock className="w-6 h-6" />
              Yönetici Girişi
            </DialogTitle>
            <DialogDescription>
              Yönetim paneline erişmek için parolanızı girin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Parola</Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setShowError(false);
                }}
                placeholder="Parolanızı girin"
                autoFocus
                disabled={isLoggingIn}
                className="w-full"
              />
              {showError && (
                <p className="text-sm text-red-600 font-medium">
                  Yanlış parola, tekrar deneyin.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={isLoggingIn}>
                {isLoggingIn ? "Giriş yapılıyor..." : "Giriş"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isLoggingIn}
              >
                İptal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Show admin panel content after authentication
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <Button onClick={onBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Ana Menüye Dön
          </Button>
        </div>

        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="text-4xl flex items-center gap-3">
              <Music className="w-10 h-10" />
              Fruit Match Yönetim Paneli
            </CardTitle>
            <CardDescription className="text-lg">
              Oyun ses dosyalarını yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Oyuncu verileri artık tarayıcıda
                localStorage ile saklanmaktadır. Bu panel sadece sistem
                genelindeki ses dosyalarını yönetmek içindir.
              </p>
            </div>
            <AudioManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
