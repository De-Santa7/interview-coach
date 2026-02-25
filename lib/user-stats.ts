import { createClient } from "@/lib/supabase/client";

export interface UserStats {
  user_id: string;
  total_sessions: number;
  total_questions: number;
  cumulative_score: number;
  best_score: number;
  current_streak: number;
  last_session_date: string | null;
}

export interface RankInfo {
  emoji: string;
  title: string;
  color: string;
  minScore: number;
  nextMinScore: number | null;
}

export const RANKS: RankInfo[] = [
  { emoji: "🔰", title: "Newcomer",     color: "#9c9a94", minScore: 0,  nextMinScore: 20  },
  { emoji: "📘", title: "Novice",        color: "#4a7dd4", minScore: 20, nextMinScore: 35  },
  { emoji: "⚡", title: "Beginner",     color: "#3d9970", minScore: 35, nextMinScore: 50  },
  { emoji: "🎯", title: "Competent",    color: "#0d9488", minScore: 50, nextMinScore: 65  },
  { emoji: "🏆", title: "Advanced",     color: "#c49a2a", minScore: 65, nextMinScore: 75  },
  { emoji: "💎", title: "Professional", color: "#7c3aed", minScore: 75, nextMinScore: 85  },
  { emoji: "🚀", title: "Expert",       color: "#ea7316", minScore: 85, nextMinScore: 93  },
  { emoji: "👑", title: "Elite",        color: "#dc2626", minScore: 93, nextMinScore: null },
];

export function getRank(avgScore: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (avgScore >= RANKS[i].minScore) return RANKS[i];
  }
  return RANKS[0];
}

export function getProgressToNextRank(avgScore: number): number {
  const rank = getRank(avgScore);
  if (rank.nextMinScore === null) return 100;
  const range = rank.nextMinScore - rank.minScore;
  const progress = avgScore - rank.minScore;
  return Math.min(100, Math.round((progress / range) * 100));
}

export async function loadUserStats(): Promise<UserStats | null> {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) return null;
  return data as UserStats;
}

export async function updateUserStats(overallScore: number, questionCount: number): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    // Create new row
    await supabase.from("user_stats").insert({
      user_id: user.id,
      total_sessions: 1,
      total_questions: questionCount,
      cumulative_score: overallScore,
      best_score: overallScore,
      current_streak: 1,
      last_session_date: today,
    });
    return;
  }

  // Calculate streak
  const lastDate = existing.last_session_date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const newStreak = lastDate === yesterdayStr
    ? existing.current_streak + 1
    : lastDate === today
    ? existing.current_streak
    : 1;

  await supabase.from("user_stats").update({
    total_sessions: existing.total_sessions + 1,
    total_questions: existing.total_questions + questionCount,
    cumulative_score: existing.cumulative_score + overallScore,
    best_score: Math.max(existing.best_score, overallScore),
    current_streak: newStreak,
    last_session_date: today,
  }).eq("user_id", user.id);
}
