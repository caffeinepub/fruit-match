import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Bomb, Clock, Lightbulb, Shuffle } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { getDailyRewardStreak } from '@/lib/localStorageManager';
import { useEffect, useState } from 'react';

interface DailyRewardDialogProps {
  open: boolean;
  onClose: () => void;
  onClaim: () => void;
}

const POWER_UP_TYPES = {
  bomb: { icon: Bomb, key: 'powerup_bomb' as const },
  clock: { icon: Clock, key: 'powerup_clock' as const },
  shuffle: { icon: Shuffle, key: 'powerup_shuffle' as const },
  magnifier: { icon: Lightbulb, key: 'powerup_magnifier' as const },
};

const REWARD_CONFIG = [
  { day: 1, powerUps: [{ type: 'bomb', count: 2 }], emoji: '🎁' },
  { day: 2, powerUps: [{ type: 'bomb', count: 1 }, { type: 'clock', count: 2 }], emoji: '🎁' },
  { day: 3, powerUps: [{ type: 'clock', count: 1 }, { type: 'shuffle', count: 2 }], emoji: '🎁' },
  { day: 4, powerUps: [{ type: 'shuffle', count: 1 }, { type: 'magnifier', count: 2 }], emoji: '🎁' },
  { day: 5, powerUps: [{ type: 'bomb', count: 3 }, { type: 'magnifier', count: 1 }], emoji: '🎉' },
  { day: 6, powerUps: [{ type: 'clock', count: 2 }, { type: 'shuffle', count: 2 }], emoji: '🎉' },
  { day: 7, powerUps: [{ type: 'bomb', count: 3 }, { type: 'clock', count: 2 }, { type: 'shuffle', count: 2 }, { type: 'magnifier', count: 2 }], emoji: '🏆' },
];

export default function DailyRewardDialog({ open, onClose, onClaim }: DailyRewardDialogProps) {
  const { t } = useLanguage();
  const [streakInfo, setStreakInfo] = useState({ currentStreak: 0, isAvailable: false, lastClaimDate: 0 });

  useEffect(() => {
    if (open) {
      const info = getDailyRewardStreak();
      setStreakInfo(info);
    }
  }, [open]);

  // Determine which day reward to show
  const nextDay = streakInfo.isAvailable ? (streakInfo.currentStreak === 0 ? 1 : Math.min(streakInfo.currentStreak + 1, 7)) : streakInfo.currentStreak;
  const currentReward = REWARD_CONFIG[nextDay - 1] || REWARD_CONFIG[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="fixed inset-0 m-auto max-w-[90vw] max-h-[85vh] overflow-y-auto sm:max-w-2xl"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Gift className="h-6 w-6 sm:h-7 sm:w-7 text-fruit-star" />
            {t('daily_reward_title')}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {t('daily_reward_description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 sm:gap-6 py-3 sm:py-4">
          {/* Streak Progress */}
          <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
            {REWARD_CONFIG.map((reward, index) => {
              const dayNumber = index + 1;
              const isClaimed = dayNumber < nextDay;
              const isCurrent = dayNumber === nextDay;
              const isLocked = dayNumber > nextDay;

              return (
                <div
                  key={dayNumber}
                  className={`flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    isClaimed
                      ? 'bg-green-100 border-2 border-green-500'
                      : isCurrent
                      ? 'bg-fruit-star/20 border-2 border-fruit-star scale-105 sm:scale-110'
                      : 'bg-gray-100 border-2 border-gray-300 opacity-50'
                  }`}
                >
                  <div className="text-xl sm:text-2xl">{reward.emoji}</div>
                  <div className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                    {t('day')} {dayNumber}
                  </div>
                  {isClaimed && <div className="text-green-600 text-xs">✓</div>}
                </div>
              );
            })}
          </div>

          {/* Current Reward Display */}
          {streakInfo.isAvailable ? (
            <div className="flex flex-col items-center gap-3 sm:gap-4 py-4 sm:py-6 bg-gradient-to-br from-fruit-star/10 to-fruit-star/5 rounded-xl sm:rounded-2xl border-2 border-fruit-star/30">
              <div className="text-4xl sm:text-6xl animate-bounce">{currentReward.emoji}</div>
              <div className="text-center px-2">
                <p className="text-2xl sm:text-3xl font-bold mb-2 text-fruit-star">
                  {t('day')} {nextDay} {t('reward')}
                </p>
                <div className="flex flex-col gap-2 items-center">
                  {currentReward.powerUps.length > 0 && (
                    <div className="flex gap-2 sm:gap-3 mt-2 flex-wrap justify-center">
                      {currentReward.powerUps.map((powerUp, idx) => {
                        const powerUpConfig = POWER_UP_TYPES[powerUp.type as keyof typeof POWER_UP_TYPES];
                        if (!powerUpConfig) return null;
                        const IconComponent = powerUpConfig.icon;
                        return (
                          <div key={idx} className="flex items-center gap-1 bg-white/80 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg">
                            <IconComponent className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="font-semibold text-sm sm:text-base">×{powerUp.count}</span>
                            <span className="text-xs text-gray-600">{t(powerUpConfig.key)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 sm:gap-4 py-4 sm:py-6 bg-gray-100 rounded-xl sm:rounded-2xl">
              <div className="text-3xl sm:text-4xl">⏰</div>
              <div className="text-center px-2">
                <p className="text-lg sm:text-xl font-bold mb-2">{t('daily_reward_claimed')}</p>
                <p className="text-sm sm:text-base text-muted-foreground">{t('come_back_tomorrow')}</p>
              </div>
            </div>
          )}

          {/* Streak Info */}
          <div className="text-center text-xs sm:text-sm text-muted-foreground px-2">
            {streakInfo.currentStreak > 0 && (
              <p>
                {t('current_streak')}: <span className="font-bold text-fruit-star">{streakInfo.currentStreak}</span> {t('days')}
              </p>
            )}
            {nextDay === 7 && streakInfo.isAvailable && (
              <p className="text-fruit-star font-semibold mt-2">{t('grand_reward_available')}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          {streakInfo.isAvailable ? (
            <Button onClick={onClaim} className="w-full" size="lg">
              {t('claim_reward')}
            </Button>
          ) : (
            <Button onClick={onClose} variant="outline" className="w-full" size="lg">
              {t('close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
