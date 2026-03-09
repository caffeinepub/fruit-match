import { useCallback, useEffect, useRef, useState } from "react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  unlockedAt?: number;
}

const ACHIEVEMENT_DEFS: Omit<Achievement, "unlocked" | "unlockedAt">[] = [
  {
    id: "first_level",
    title: "İlk Adım",
    description: "İlk seviyeni tamamladın!",
    emoji: "🌟",
  },
  {
    id: "first_boss",
    title: "Boss Avcısı",
    description: "İlk boss seviyesini yendin!",
    emoji: "👑",
  },
  {
    id: "levels_10",
    title: "Deneyimli",
    description: "10 seviye tamamladın!",
    emoji: "🎯",
  },
  {
    id: "levels_50",
    title: "Usta",
    description: "50 seviye tamamladın!",
    emoji: "🏅",
  },
  {
    id: "levels_100",
    title: "Efsane",
    description: "100 seviye tamamladın!",
    emoji: "🏆",
  },
  {
    id: "combo_master",
    title: "Kombo Ustası",
    description: "5 kombo yaptın!",
    emoji: "🔥",
  },
  {
    id: "powerup_user",
    title: "Güç Kullanıcısı",
    description: "Power-up kullandın!",
    emoji: "⚡",
  },
  {
    id: "star_collector",
    title: "Yıldız Toplayıcı",
    description: "50 yıldız topladın!",
    emoji: "⭐",
  },
];

const LS_KEY = "fm_achievements";

export function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const saved: Record<string, { unlocked: boolean; unlockedAt?: number }> =
      raw ? JSON.parse(raw) : {};
    return ACHIEVEMENT_DEFS.map((def) => ({
      ...def,
      unlocked: saved[def.id]?.unlocked ?? false,
      unlockedAt: saved[def.id]?.unlockedAt,
    }));
  } catch {
    return ACHIEVEMENT_DEFS.map((def) => ({ ...def, unlocked: false }));
  }
}

export function unlockAchievement(id: string): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const saved: Record<string, { unlocked: boolean; unlockedAt?: number }> =
      raw ? JSON.parse(raw) : {};
    if (saved[id]?.unlocked) return false;
    saved[id] = { unlocked: true, unlockedAt: Date.now() };
    localStorage.setItem(LS_KEY, JSON.stringify(saved));
    return true;
  } catch {
    return false;
  }
}

export function checkAndUnlockAchievements(params: {
  totalLevelsCompleted: number;
  totalStars: number;
  maxCombo: number;
  usedPowerUp: boolean;
  completedBoss: boolean;
}): string[] {
  const newly: string[] = [];
  const unlock = (id: string) => {
    if (unlockAchievement(id)) newly.push(id);
  };

  if (params.totalLevelsCompleted >= 1) unlock("first_level");
  if (params.totalLevelsCompleted >= 10) unlock("levels_10");
  if (params.totalLevelsCompleted >= 50) unlock("levels_50");
  if (params.totalLevelsCompleted >= 100) unlock("levels_100");
  if (params.totalStars >= 50) unlock("star_collector");
  if (params.maxCombo >= 5) unlock("combo_master");
  if (params.usedPowerUp) unlock("powerup_user");
  if (params.completedBoss) unlock("first_boss");

  return newly;
}

interface AchievementToastProps {
  achievementId: string;
  onDone: () => void;
}

function AchievementToast({ achievementId, onDone }: AchievementToastProps) {
  const def = ACHIEVEMENT_DEFS.find((d) => d.id === achievementId);
  if (!def) return null;

  return (
    <button
      type="button"
      aria-label="Rozeti kapat"
      className="achievement-toast"
      style={{
        position: "fixed",
        top: "80px",
        right: "16px",
        zIndex: 9999,
        background: "linear-gradient(135deg, #1a1a2e, #16213e)",
        border: "2px solid rgba(255,215,0,0.6)",
        borderRadius: "16px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(255,215,0,0.3)",
        minWidth: "220px",
        maxWidth: "280px",
        animation: "achievementSlideIn 0.4s ease-out forwards",
        cursor: "pointer",
        textAlign: "left",
      }}
      onClick={onDone}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ fontSize: "2rem", lineHeight: 1 }}>{def.emoji}</div>
        <div>
          <div
            style={{
              color: "#ffd700",
              fontWeight: 800,
              fontSize: "0.75rem",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            🏅 Rozet Kazandın!
          </div>
          <div style={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}>
            {def.title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem" }}>
            {def.description}
          </div>
        </div>
      </div>
    </button>
  );
}

interface AchievementManagerProps {
  pendingIds: string[];
  onClear: () => void;
}

export function AchievementManager({
  pendingIds,
  onClear,
}: AchievementManagerProps) {
  const [current, setCurrent] = useState<string | null>(null);
  const queueRef = useRef<string[]>([]);
  const timerRef = useRef<number | null>(null);

  const processQueue = useCallback(() => {
    if (queueRef.current.length === 0) {
      setCurrent(null);
      return;
    }
    const next = queueRef.current.shift()!;
    setCurrent(next);
    timerRef.current = window.setTimeout(() => {
      setCurrent(null);
      setTimeout(processQueue, 200);
    }, 2500);
  }, []);

  useEffect(() => {
    if (pendingIds.length > 0) {
      queueRef.current = [...queueRef.current, ...pendingIds];
      onClear();
      processQueue();
    }
  }, [pendingIds, onClear, processQueue]);

  if (!current) return null;

  return (
    <AchievementToast
      achievementId={current}
      onDone={() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setCurrent(null);
        setTimeout(processQueue, 200);
      }}
    />
  );
}

export function AchievementGallery() {
  const achievements = loadAchievements();
  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div>
      {unlocked.length === 0 && (
        <p className="text-gray-500 text-sm mb-4">
          Henüz rozet kazanmadın. Seviye tamamla ve oyna!
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {unlocked.map((a) => (
          <div
            key={a.id}
            className="flex flex-col items-center gap-2 p-3 rounded-xl text-center"
            style={{
              background: "linear-gradient(135deg, #1a1a2e, #16213e)",
              border: "2px solid rgba(255,215,0,0.5)",
              boxShadow: "0 0 12px rgba(255,215,0,0.2)",
            }}
          >
            <div className="text-3xl">{a.emoji}</div>
            <div className="font-bold text-yellow-400 text-xs">{a.title}</div>
            <div className="text-white/60 text-xs leading-tight">
              {a.description}
            </div>
          </div>
        ))}
      </div>
      {locked.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-500 mb-2">
            Kilitli Rozetler ({locked.length})
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {locked.map((a) => (
              <div
                key={a.id}
                className="flex flex-col items-center gap-1 p-2 rounded-xl text-center opacity-40"
                style={{ background: "#e5e7eb", border: "2px solid #d1d5db" }}
              >
                <div className="text-2xl grayscale">{a.emoji}</div>
                <div className="text-gray-600 text-xs font-semibold leading-tight">
                  {a.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
