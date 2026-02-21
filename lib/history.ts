import { HistoryEntry } from "./types";

const HISTORY_KEY = "interview-coach-history";

export function saveToHistory(entry: HistoryEntry): void {
  try {
    const existing = loadHistory();
    const updated = [entry, ...existing.filter((e) => e.id !== entry.id)];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable
  }
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch {
    return [];
  }
}

export function getHistoryEntry(id: string): HistoryEntry | null {
  try {
    const all = loadHistory();
    return all.find((e) => e.id === id) ?? null;
  } catch {
    return null;
  }
}

export function deleteHistoryEntry(id: string): void {
  try {
    const updated = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // localStorage may be unavailable
  }
}
