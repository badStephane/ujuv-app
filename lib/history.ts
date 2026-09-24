"use client";

export type HistoryEntry = {
  date: string;
  ref: string;
  text: string;
  reflection: string;
  phrase: string;
};

const KEY = "ujuv-history";

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  try {
    const list = loadHistory();
    list.unshift(entry);
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, 500)));
  } catch {
    // stockage indisponible : on continue sans historique
  }
}
