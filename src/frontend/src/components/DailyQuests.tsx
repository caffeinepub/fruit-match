import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Gift, X } from "lucide-react";
import { useEffect, useState } from "react";

export interface Quest {
  id: string;
  label: string;
  target: number;
  progress: number;
  completed: boolean;
}

const QUEST_POOL = [
  { id: "complete_3", label: "3 seviye tamamla", target: 3 },
  { id: "combo_5", label: "5 kombo yap", target: 5 },
  { id: "use_bomb", label: "Bomb power-up kullan", target: 1 },
  { id: "beat_boss", label: "Boss seviyesini tamamla", target: 1 },
  { id: "matches_10", label: "10 eşleşme yap", target: 10 },
  { id: "two_worlds", label: "2 farklı dünyada oyna", target: 2 },
  { id: "complete_5", label: "5 seviye tamamla", target: 5 },
  { id: "collect_stars", label: "9 yıldız topla", target: 9 },
];

const LS_KEY = "fm_daily_quests";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function loadDailyQuests(): Quest[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return generateQuests();
    const data = JSON.parse(raw);
    if (data.date !== todayStr()) return generateQuests();
    return data.quests as Quest[];
  } catch {
    return generateQuests();
  }
}

function generateQuests(): Quest[] {
  const seed = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const n = Number.parseInt(seed) % QUEST_POOL.length;
  const indices = [
    n % QUEST_POOL.length,
    (n + 2) % QUEST_POOL.length,
    (n + 4) % QUEST_POOL.length,
  ];
  const quests: Quest[] = indices.map((i) => ({
    ...QUEST_POOL[i],
    progress: 0,
    completed: false,
  }));
  saveDailyQuests(quests);
  return quests;
}

export function saveDailyQuests(quests: Quest[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ date: todayStr(), quests }));
  } catch {}
}

export function updateQuestProgress(eventType: string, amount = 1): boolean {
  const quests = loadDailyQuests();
  let changed = false;
  let anyCompleted = false;

  for (const q of quests) {
    if (q.completed) continue;
    const matches =
      (eventType === "level_complete" &&
        (q.id === "complete_3" || q.id === "complete_5")) ||
      (eventType === "combo" && q.id === "combo_5") ||
      (eventType === "use_bomb" && q.id === "use_bomb") ||
      (eventType === "beat_boss" && q.id === "beat_boss") ||
      (eventType === "match" && q.id === "matches_10") ||
      (eventType === "world_play" && q.id === "two_worlds") ||
      (eventType === "stars" && q.id === "collect_stars");

    if (matches) {
      q.progress = Math.min(q.target, q.progress + amount);
      if (q.progress >= q.target) {
        q.completed = true;
        anyCompleted = true;
      }
      changed = true;
    }
  }

  if (changed) saveDailyQuests(quests);
  return anyCompleted;
}

export function hasUnfinishedQuests(): boolean {
  const quests = loadDailyQuests();
  return quests.some((q) => !q.completed);
}

interface DailyQuestsModalProps {
  open: boolean;
  onClose: () => void;
  onClaimReward?: () => void;
}

export default function DailyQuestsModal({
  open,
  onClose,
  onClaimReward,
}: DailyQuestsModalProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) setQuests(loadDailyQuests());
  }, [open]);

  if (!open) return null;

  const allDone = quests.every((q) => q.completed);

  const handleClaim = (questId: string) => {
    if (claimedIds.has(questId)) return;
    setClaimedIds((prev) => new Set([...prev, questId]));
    onClaimReward?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 w-full h-full cursor-default"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <div
        className="relative bg-white rounded-3xl shadow-2xl border-4 border-yellow-400 p-6 w-full max-w-sm mx-4 z-10"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          data-ocid="daily_quests.close_button"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="text-center mb-5">
          <div className="text-4xl mb-2">📋</div>
          <h2 className="text-2xl font-black text-gray-800">Günlük Görevler</h2>
          <p className="text-sm text-gray-500 mt-1">
            Her gece 00:00'da yenilenir
          </p>
        </div>

        <div className="space-y-3 mb-5">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`rounded-2xl p-4 border-2 transition-all ${
                q.completed
                  ? "border-green-400 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {q.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold text-sm ${
                      q.completed
                        ? "text-green-700 line-through"
                        : "text-gray-800"
                    }`}
                  >
                    {q.label}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Progress
                      value={Math.min(100, (q.progress / q.target) * 100)}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500">
                      {q.progress} / {q.target}
                    </p>
                  </div>
                </div>
                {q.completed && !claimedIds.has(q.id) && (
                  <Button
                    size="sm"
                    className="shrink-0 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-bold"
                    onClick={() => handleClaim(q.id)}
                  >
                    <Gift className="w-3 h-3 mr-1" />
                    Al!
                  </Button>
                )}
                {claimedIds.has(q.id) && (
                  <span className="shrink-0 text-xs text-green-600 font-bold">
                    ✅
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {allDone && (
          <div className="text-center p-3 rounded-2xl bg-gradient-to-r from-yellow-100 to-green-100 border-2 border-green-300">
            <p className="text-sm font-bold text-green-700">
              🎉 Tüm görevler tamamlandı! Ödüller alındı.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
