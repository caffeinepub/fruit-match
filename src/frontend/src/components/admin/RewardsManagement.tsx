import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Gift, Info } from "lucide-react";

export default function RewardsManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-6 h-6" />
            Ödül Yönetimi
          </CardTitle>
          <CardDescription>
            Günlük ödüller, sandık ödülleri ve güç artırıcı yapılandırması
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Bilgi</AlertTitle>
            <AlertDescription>
              Ödül yapılandırma özellikleri şu anda oyun mantığında sabit
              kodlanmıştır. Gelecek güncellemelerde dinamik ödül yapılandırması
              eklenecektir.
            </AlertDescription>
          </Alert>

          <div className="mt-6 space-y-4">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Günlük Ödüller</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Oyuncular her gün giriş yaptığında ödül alabilirler. Ödüller
                  backend'de saklanır ve oyuncu profili ile ilişkilendirilir.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Seviye Sandıkları</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Her 10 seviyede bir oyuncular bonus sandık ödülü alabilirler.
                  Sandık durumu backend'de takip edilir.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Güç Artırıcılar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Güç artırıcılar (Bomba, Saat, Büyüteç, Karıştır) Candyland
                  dünyasından itibaren kullanılabilir. Kullanılabilirlik oyun
                  mantığında tanımlanmıştır.
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
