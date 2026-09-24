"use client";

import { useEffect, useRef, useState } from "react";
import type { Verse } from "@/lib/engine";
import { normalizeText } from "@/lib/engine";

type BibleState = {
  verses: Verse[];
  loaded: boolean;
  loading: boolean;
};

export function useBible() {
  const [state, setState] = useState<BibleState>({ verses: [], loaded: false, loading: true });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;

    fetch("/bible-lsg.json")
      .then((r) => r.json())
      .then((raw: [string, string][]) => {
        if (cancelled) return;
        const verses: Verse[] = raw.map(([ref, text]) => ({
          ref,
          text,
          norm: normalizeText(text),
        }));
        setState({ verses, loaded: true, loading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ verses: [], loaded: false, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
