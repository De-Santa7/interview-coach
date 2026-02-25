import { HistoryEntry } from "./types";
import { createClient } from "@/lib/supabase/client";

const HISTORY_KEY = "interview-coach-history";

/* ── LocalStorage helpers (always available) ──────── */

function saveLocalHistory(entry: HistoryEntry): void {
  try {
    const existing = loadLocalHistory();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
}

function loadLocalHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as HistoryEntry[]).sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

function deleteLocalHistory(id: string): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(loadLocalHistory().filter((e) => e.id !== id)));
  } catch { /* ignore */ }
}

function clearLocalHistory(): void {
  try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ }
}

/* ── Supabase helpers (authenticated users only) ──── */

function toRow(entry: HistoryEntry, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    timestamp: entry.timestamp,
    config: entry.config,
    report: entry.report,
    questions: entry.questions,
    answers: entry.answers,
    challenge: entry.challenge ?? null,
    challenge_submission: entry.challengeSubmission ?? "",
  };
}

function fromRow(row: Record<string, unknown>): HistoryEntry {
  return {
    id: row.id as string,
    timestamp: row.timestamp as number,
    config: row.config as HistoryEntry["config"],
    report: row.report as HistoryEntry["report"],
    questions: row.questions as HistoryEntry["questions"],
    answers: row.answers as HistoryEntry["answers"],
    challenge: (row.challenge as HistoryEntry["challenge"]) ?? null,
    challengeSubmission: (row.challenge_submission as string) ?? "",
  };
}

async function getAuthenticatedClient() {
  const supabase = createClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, userId: user.id };
}

async function saveToSupabase(entry: HistoryEntry): Promise<void> {
  const auth = await getAuthenticatedClient();
  if (!auth) return;
  await auth.supabase.from("sessions").upsert(toRow(entry, auth.userId));
}

async function loadFromSupabase(): Promise<HistoryEntry[] | null> {
  const auth = await getAuthenticatedClient();
  if (!auth) return null;
  const { data, error } = await auth.supabase
    .from("sessions")
    .select("*")
    .eq("user_id", auth.userId)
    .order("timestamp", { ascending: false });
  if (error || !data) return null;
  return data.map(fromRow);
}

async function getFromSupabase(id: string): Promise<HistoryEntry | null> {
  const auth = await getAuthenticatedClient();
  if (!auth) return null;
  const { data, error } = await auth.supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .single();
  if (error || !data) return null;
  return fromRow(data);
}

async function deleteFromSupabase(id: string): Promise<void> {
  const auth = await getAuthenticatedClient();
  if (!auth) return;
  await auth.supabase.from("sessions").delete().eq("id", id).eq("user_id", auth.userId);
}

async function clearSupabaseHistory(): Promise<void> {
  const auth = await getAuthenticatedClient();
  if (!auth) return;
  await auth.supabase.from("sessions").delete().eq("user_id", auth.userId);
}

/* ── Public API ───────────────────────────────────── */

/**
 * Save a session. Writes to localStorage immediately, then syncs to
 * Supabase in the background if the user is authenticated.
 */
export function saveToHistory(entry: HistoryEntry): void {
  saveLocalHistory(entry);
  saveToSupabase(entry).catch(() => {});
}

/**
 * Load all sessions. Returns Supabase data for authenticated users
 * (cross-device sync), falls back to localStorage for guests.
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  const cloud = await loadFromSupabase();
  if (cloud !== null) return cloud;
  return loadLocalHistory();
}

/**
 * Load a single session by id. Supabase-first, localStorage fallback.
 */
export async function getHistoryEntry(id: string): Promise<HistoryEntry | null> {
  const cloud = await getFromSupabase(id);
  if (cloud !== null) return cloud;
  return loadLocalHistory().find((e) => e.id === id) ?? null;
}

/**
 * Delete a session from localStorage and Supabase.
 */
export function deleteHistoryEntry(id: string): void {
  deleteLocalHistory(id);
  deleteFromSupabase(id).catch(() => {});
}

/**
 * Clear all sessions from localStorage and Supabase.
 */
export function clearHistory(): void {
  clearLocalHistory();
  clearSupabaseHistory().catch(() => {});
}
