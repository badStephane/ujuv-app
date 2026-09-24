"use client";

import { useEffect, useRef, useState } from "react";
import { useBible } from "@/lib/useBible";
import { saveToHistory } from "@/lib/history";
import {
  FALLBACK_REFLECTION,
  GENERAL_SEARCH,
  SEARCH_TERMS,
  THEME_LABELS,
  THEME_PHRASE,
  matchTheme,
  pickRandomVerse,
  searchCorpus,
  wordsFromFreeText,
  type ThemeKey,
  type Verse,
} from "@/lib/engine";
import Link from "next/link";

type Message =
  | { kind: "bot-text"; id: string; text: string }
  | { kind: "user"; id: string; text: string }
  | { kind: "choices"; id: string }
  | { kind: "verse"; id: string; verse: Verse; reflection: string; themeKey: ThemeKey | null; phrase: string }
  | { kind: "typing"; id: string };

let uid = 0;
const nextId = () => String(uid++);

export default function Home() {
  const bible = useBible();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const usedRefs = useRef<Set<string>>(new Set());
  const threadRef = useRef<HTMLDivElement>(null);
  const introDone = useRef(false);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!bible.loaded || introDone.current) return;
    introDone.current = true;
    const verse = pickRandomVerse(bible.verses);
    const initial: Message[] = [];
    if (verse) {
      initial.push({ kind: "verse", id: nextId(), verse, reflection: "", themeKey: null, phrase: "" });
    }
    initial.push({ kind: "bot-text", id: nextId(), text: "Comment te sens-tu aujourd'hui, ou qu'est-ce qui t'amène ?" });
    initial.push({ kind: "choices", id: nextId() });
    setMessages(initial);
  }, [bible.loaded, bible.verses]);

  async function handleRequest(themeKey: ThemeKey | null, phrase: string) {
    const typingId = nextId();
    setMessages((m) => [...m, { kind: "typing", id: typingId }]);

    let terms: string[] = themeKey ? SEARCH_TERMS[themeKey].slice() : [];
    if (terms.length === 0) terms = wordsFromFreeText(phrase);
    if (terms.length === 0) terms = GENERAL_SEARCH;

    const hit = bible.loaded ? searchCorpus(bible.verses, terms, usedRefs.current) : null;
    const verse = hit || pickRandomVerse(bible.verses) || { ref: "", text: "", norm: "" };

    let reflection: string | null = null;
    try {
      const resp = await fetch("/api/reflection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phrase, ref: verse.ref, text: verse.text }),
      });
      const data = await resp.json();
      reflection = data.reflection || null;
    } catch {
      reflection = null;
    }

    const finalReflection = reflection || (themeKey ? FALLBACK_REFLECTION[themeKey] : "Un mot pour toi aujourd'hui.");

    saveToHistory({
      date: new Date().toISOString(),
      ref: verse.ref,
      text: verse.text,
      reflection: finalReflection,
      phrase,
    });

    setMessages((m) => [
      ...m.filter((msg) => msg.id !== typingId),
      { kind: "verse", id: nextId(), verse, reflection: finalReflection, themeKey, phrase },
    ]);
  }

  function handleChoice(key: ThemeKey) {
    setMessages((m) => [
      ...m.filter((msg) => msg.kind !== "choices"),
      { kind: "user", id: nextId(), text: THEME_LABELS[key] },
    ]);
    handleRequest(key, THEME_PHRASE[key]);
  }

  function askAgain() {
    setMessages((m) => [
      ...m,
      { kind: "bot-text", id: nextId(), text: "Comment te sens-tu maintenant, ou qu'est-ce qui t'amène ?" },
      { kind: "choices", id: nextId() },
    ]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { kind: "user", id: nextId(), text }]);
    const key = matchTheme(text);
    handleRequest(key, text);
  }

  return (
    <div className="flex justify-center h-dvh overflow-hidden">
      <div className="w-full max-w-[560px] h-full flex flex-col px-4 pt-6 pb-4">
        <header className="flex-none text-center pb-4 mb-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="font-serif-app text-3xl tracking-wide">
            Uj<em className="not-italic italic" style={{ color: "var(--gold-soft)" }}>u</em>v
          </div>
          <div className="text-[13px] mt-1.5 tracking-wide" style={{ color: "#b8ac93" }}>
            un jour, un verset
          </div>
          <Link
            href="/historique"
            className="inline-block text-[12px] mt-3 underline underline-offset-4"
            style={{ color: "var(--gold-soft)", textDecorationColor: "rgba(201,154,91,0.35)" }}
          >
            Voir l&apos;historique
          </Link>
        </header>

        <div ref={threadRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pb-2">
          {messages.map((msg) => (
            <MessageView key={msg.id} msg={msg} onChoice={handleChoice} onAgain={handleRequest} onRestart={askAgain} />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-none flex gap-2 mt-3 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ou écris ce que tu ressens..."
            autoComplete="off"
            className="flex-1 rounded-full px-3.5 py-3 text-sm outline-none border"
            style={{ background: "var(--ink-soft)", borderColor: "var(--line)", color: "var(--paper)" }}
          />
          <button
            type="submit"
            className="rounded-full px-5 text-[13.5px] font-semibold"
            style={{ background: "var(--gold)", color: "var(--ink)" }}
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

function MessageView({
  msg,
  onChoice,
  onAgain,
  onRestart,
}: {
  msg: Message;
  onChoice: (key: ThemeKey) => void;
  onAgain: (themeKey: ThemeKey | null, phrase: string) => void;
  onRestart: () => void;
}) {
  if (msg.kind === "bot-text") {
    return (
      <div
        className="self-start max-w-[86%] px-4 py-3.5 text-[15px] leading-relaxed rounded-tl-[3px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border"
        style={{ background: "var(--ink-soft)", borderColor: "var(--line)" }}
      >
        {msg.text}
      </div>
    );
  }

  if (msg.kind === "user") {
    return (
      <div
        className="self-end max-w-[86%] px-4 py-3.5 text-[15px] font-medium rounded-tl-2xl rounded-tr-[3px] rounded-br-2xl rounded-bl-2xl"
        style={{ background: "var(--gold)", color: "var(--ink)" }}
      >
        {msg.text}
      </div>
    );
  }

  if (msg.kind === "typing") {
    return (
      <div
        className="self-start px-4 py-3.5 rounded-tl-[3px] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border flex gap-1.5 items-center"
        style={{ background: "var(--ink-soft)", borderColor: "var(--line)" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: "#8f846c", animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );
  }

  if (msg.kind === "choices") {
    return (
      <div className="self-start flex flex-wrap gap-2 max-w-[92%]">
        {(Object.keys(THEME_LABELS) as ThemeKey[]).map((key) => (
          <button
            key={key}
            onClick={() => onChoice(key)}
            className="rounded-full px-3.5 py-2 text-[13.5px] border transition-colors"
            style={{ borderColor: "var(--paper-dim)", color: "var(--paper)" }}
          >
            {THEME_LABELS[key]}
          </button>
        ))}
      </div>
    );
  }

  // verse
  return (
    <div>
      <div
        className="rounded px-6 pt-6 pb-5 border-l-[3px]"
        style={{ background: "var(--paper)", color: "var(--ink)", borderColor: "var(--gold)" }}
      >
        <span className="font-serif-app block text-4xl mb-2 leading-none" style={{ color: "var(--gold)" }}>
          &ldquo;
        </span>
        <div className="font-serif-app italic text-[19px] leading-relaxed" style={{ color: "#23201b" }}>
          {msg.verse.text}
        </div>
        <div className="mt-3.5 text-[13px] font-semibold tracking-wide" style={{ color: "var(--gold)" }}>
          {msg.verse.ref}{" "}
          <span className="font-normal opacity-70">(Louis Segond)</span>
        </div>
        {msg.reflection && (
          <div className="mt-3.5 pt-3.5 text-sm leading-relaxed border-t" style={{ borderColor: "rgba(28,26,23,0.12)", color: "#4a453c" }}>
            {msg.reflection}
          </div>
        )}
      </div>
      {msg.themeKey !== undefined && (
        <div className="flex gap-3 flex-wrap mt-2">
          <button
            onClick={() => onAgain(msg.themeKey, msg.phrase)}
            className="text-[13.5px] underline underline-offset-4"
            style={{ color: "var(--gold-soft)" }}
          >
            Un autre verset
          </button>
          <button
            onClick={onRestart}
            className="text-[13.5px] underline underline-offset-4"
            style={{ color: "var(--gold-soft)" }}
          >
            Nouvelle discussion
          </button>
        </div>
      )}
    </div>
  );
}
