"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadHistory, type HistoryEntry } from "@/lib/history";

export default function Historique() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  return (
    <div className="flex justify-center min-h-dvh">
      <div className="w-full max-w-[560px] px-4 py-6">
        <Link href="/" className="text-[13px] underline underline-offset-4" style={{ color: "var(--gold-soft)" }}>
          ← Retour
        </Link>
        <h1 className="font-serif-app text-2xl mt-4 mb-1">Historique</h1>
        <p className="text-[13px] mb-6" style={{ color: "#b8ac93" }}>
          {entries.length} verset{entries.length > 1 ? "s" : ""} reçu{entries.length > 1 ? "s" : ""} sur cet appareil.
        </p>

        {entries.length === 0 && (
          <p className="text-sm" style={{ color: "#8f8467" }}>
            Rien pour l&apos;instant.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {entries.map((e, i) => (
            <div key={i} className="border-b pb-4" style={{ borderColor: "var(--line)" }}>
              <div className="text-[12px]" style={{ color: "#b8ac93" }}>
                {new Date(e.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                {e.phrase ? ` · ${e.phrase}` : ""}
              </div>
              <div className="font-serif-app italic mt-1.5">« {e.text} »</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--gold-soft)" }}>
                {e.ref}
              </div>
              {e.reflection && (
                <div className="text-sm mt-2" style={{ color: "#b8ac93" }}>
                  {e.reflection}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
