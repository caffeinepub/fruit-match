# Fruit Match

## Current State
Web tabanlı meyve eşleştirme oyunu. 12 dünya, 30 seviye. Power-up sistemi, boss seviyeleri (30. seviyeler), can sistemi, kombo sistemi, özel karo tipleri (bomb/rainbow/freeze), Web Audio API fallback, localStorage bazlı ilerleme kaydı mevcut. Pause modal ve game-over modal zaten var ama bazı görsel detaylar eksik.

## Requested Changes (Diff)

### Add
- **Tile Drop Animation**: Eşleşme sonrası yeni karoların yukarıdan animasyonlu düşmesi (CSS keyframe + staggered delay per column)
- **World Transition Animation**: WorldMap'ten bir dünyaya girerken full-screen geçiş animasyonu (dünya ikonu büyür, ekran solar, level grid açılır)
- **Achievement/Rozet Sistemi**: `src/frontend/src/components/AchievementSystem.tsx` — localStorage'da tutulan rozet verileri, rozet kazanınca toast bildirimi, profil ekranında rozet galerisi. Rozetler: İlk Seviye, İlk Boss, 10/50/100 Seviye, Tüm Yıldızlar, Kombo Ustası, vb.
- **Daily Quest Sistemi**: `src/frontend/src/components/DailyQuests.tsx` — Her gün yenilenen 3 görev (örn. "3 seviye tamamla", "10 kombo yap", "Power-up kullan"). Tamamlanınca power-up ödülü. WorldMap'te görev butonu.
- **Star Condition Display**: GamePlay HUD'da "3 yıldız için X saniye içinde bitir" bilgisinin gösterilmesi. Seviye başında star objective overlay'inde koşullar.
- **Improved Locked World Visual**: WorldCard'da kilitli dünyalar için daha belirgin "X yıldız gerekli" göstergesi, progress bar ve unlock threshold

### Modify
- **GameBoard.tsx**: Her tile'a `data-col` attribute ekle, CSS animation class'ı (`tile-drop-in`) ekle, eşleşme sonrası yeni gelen karolara column bazlı delay uygula
- **WorldCard.tsx**: Kilitli dünya için progress bar (mevcut yıldız / gerekli yıldız), daha belirgin lock overlay
- **GamePlay.tsx**: Star koşullarını HUD'da göster (progress bar üstünde küçük bilgi), pause modal ve game-over modal görsel kalitesini artır
- **WorldMap.tsx**: Daily Quest butonunu ekle, dünya geçiş animasyonunu tetikle
- **PlayerProfile.tsx**: Rozet galerisi bölümü ekle

### Remove
- Gereksiz console.log statements (varsa)

## Implementation Plan
1. `AchievementSystem.tsx` oluştur — rozet tanımları, kazanma mantığı, toast bildirimi, localStorage persist
2. `DailyQuests.tsx` oluştur — görev tanımları, günlük sıfırlama, ilerleme takibi, ödül dağıtımı
3. `GameBoard.tsx` güncelle — tile drop animasyonu CSS + stagger
4. `WorldMap.tsx` güncelle — world transition overlay, daily quests butonu
5. `WorldCard.tsx` güncelle — lock progress bar, görsel iyileştirme
6. `GamePlay.tsx` güncelle — star koşulları HUD'da, achievement trigger entegrasyonu, daily quest progress
7. `PlayerProfile.tsx` güncelle — rozet galerisi
