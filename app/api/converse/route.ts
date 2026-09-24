import { NextRequest, NextResponse } from "next/server";
import { THEME_KEYS, THEME_LABELS, matchTheme, wordsFromFreeText, isThemeKey } from "@/lib/engine";

type ConverseResult =
  | { action: "ask"; question: string }
  | { action: "deliver"; themeKey: string | null; keywords: string[]; summary: string };

function fallbackDeliver(combined: string): ConverseResult {
  return {
    action: "deliver",
    themeKey: matchTheme(combined),
    keywords: wordsFromFreeText(combined),
    summary: combined,
  };
}

export async function POST(req: NextRequest) {
  const { text, previous, turn } = (await req.json()) as {
    text: string;
    previous?: string;
    turn: number;
  };

  const combined = previous ? `${previous} ${text}` : text;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallbackDeliver(combined));
  }

  const themeList = THEME_KEYS.map((k) => `${k} (${THEME_LABELS[k]})`).join(", ");

  const sys =
    "Tu aides à comprendre la situation d'une personne avant de lui proposer un verset biblique. " +
    "Tu ne donnes jamais de verset toi-même, seulement une analyse. " +
    `Thèmes possibles: ${themeList}. ` +
    "Réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown. " +
    "Si son message est déjà assez clair pour comprendre ce qu'elle vit (même une phrase courte mais explicite, comme " +
    "'je suis triste' ou 'j'ai perdu mon travail'), ou si turn vaut 1 (une clarification a déjà eu lieu), réponds: " +
    '{"action":"deliver","themeKey":"<une des clés ci-dessus, en minuscules, ou null si aucune ne correspond bien>",' +
    '"keywords":["mot1","mot2","mot3"],"summary":"une phrase en français qui résume sa situation"}. ' +
    "Les keywords sont 3 à 6 mots simples en français utiles pour chercher un verset en lien avec la situation. " +
    "Si le message est vague, très court, ou ne dit pas assez pour choisir un verset pertinent (par exemple juste " +
    "'bonjour', 'ça va pas', 'aide moi') ET que turn vaut 0, réponds: " +
    '{"action":"ask","question":"une question courte, chaleureuse, en français, pour mieux comprendre ce qu\'elle vit"}. ' +
    "Ne pose jamais plus d'une question. Ton chaleureux, jamais clinique ni moralisateur.";

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 250,
        system: sys,
        messages: [{ role: "user", content: `Message: "${text}"\nturn: ${turn}` }],
      }),
    });

    if (!resp.ok) return NextResponse.json(fallbackDeliver(combined));

    const data = await resp.json();
    const raw = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as ConverseResult;

    // Filet de sécurité : jamais plus d'une question de clarification.
    if (parsed.action === "ask" && turn >= 1) {
      return NextResponse.json(fallbackDeliver(combined));
    }

    if (parsed.action === "ask") {
      return NextResponse.json(parsed);
    }

    return NextResponse.json({
      action: "deliver",
      themeKey: isThemeKey(parsed.themeKey) ? parsed.themeKey : null,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
      summary: parsed.summary || combined,
    });
  } catch {
    return NextResponse.json(fallbackDeliver(combined));
  }
}
