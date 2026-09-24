import { NextRequest, NextResponse } from "next/server";
import {
  THEME_KEYS,
  THEME_LABELS,
  matchTheme,
  wordsFromFreeText,
  isThemeKey,
  FALLBACK_PRACTICE,
  GENERIC_PRACTICE,
} from "@/lib/engine";

type HistoryTurn = { role: "user" | "assistant"; text: string };

type ConverseResult =
  | { action: "ask"; question: string }
  | {
      action: "conclude";
      themeKey: string | null;
      keywords: string[];
      summary: string;
      closing: string;
    };

// Au-delà de ce nombre de messages utilisateur, on conclut quoi qu'il arrive
// pour éviter une discussion sans fin.
const MAX_USER_TURNS = 5;

function combinedText(history: HistoryTurn[]): string {
  return history
    .filter((h) => h.role === "user")
    .map((h) => h.text)
    .join(" ");
}

function fallbackConclude(history: HistoryTurn[]): ConverseResult {
  const combined = combinedText(history);
  const themeKey = matchTheme(combined);
  return {
    action: "conclude",
    themeKey,
    keywords: wordsFromFreeText(combined),
    summary: combined,
    closing:
      "Merci de m'avoir partagé tout ça. Voici un verset qui pourrait t'accompagner. " +
      (themeKey ? FALLBACK_PRACTICE[themeKey] : GENERIC_PRACTICE),
  };
}

export async function POST(req: NextRequest) {
  const { history, forceConclude } = (await req.json()) as {
    history: HistoryTurn[];
    forceConclude?: boolean;
  };

  const userTurns = history.filter((h) => h.role === "user").length;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(fallbackConclude(history));
  }

  const themeList = THEME_KEYS.map((k) => `${k} (${THEME_LABELS[k]})`).join(", ");
  const mustConclude = forceConclude || userTurns >= MAX_USER_TURNS;

  const sys =
    "Tu es un compagnon spirituel bienveillant, à l'écoute, façon accompagnement pastoral chaleureux (jamais " +
    "clinique, jamais moralisateur). Tu discutes avec une personne de son état émotionnel du moment, comme une " +
    "vraie conversation, avant de lui proposer un verset biblique pertinent. Tu ne donnes JAMAIS de verset ni de " +
    "texte biblique toi-même : uniquement une analyse et des questions. " +
    `Thèmes possibles : ${themeList}. ` +
    "Réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown, sous une des deux formes " +
    "suivantes :\n" +
    '1) {"action":"ask","question":"..."} — une question ouverte, courte, chaleureuse, en français, pour ' +
    "continuer la conversation et mieux comprendre ce qu'elle vit (son émotion, son contexte, ce qui s'est passé, " +
    "ce dont elle a besoin). Choisis cette option tant que tu sens qu'un échange de plus l'aiderait à se sentir " +
    "vraiment écoutée et te permettrait de mieux cerner sa situation.\n" +
    '2) {"action":"conclude","themeKey":"<une des clés ci-dessus en minuscules, ou null si aucune ne correspond ' +
    'bien>","keywords":["mot1","mot2","mot3"],"summary":"une phrase en français qui résume toute sa situation",' +
    '"closing":"un court message chaleureux (2 à 3 phrases), en français, façon conseil spirituel : tu reconnais ' +
    "ce qu'elle vient de partager, tu annonces que tu vas lui proposer un verset, et tu suggères une pratique " +
    "concrète et adaptée (par exemple méditer et prier sur ce verset avant de dormir, le relire au réveil, le " +
    'garder avec elle aujourd\'hui). Ne mentionne jamais le contenu du verset, tu ne le connais pas encore."}\n' +
    "Choisis \"conclude\" dès que tu sens avoir assez compris sa situation pour l'accompagner sincèrement " +
    "(généralement après 2 à 4 échanges, jamais besoin d'aller beaucoup plus loin). " +
    (mustConclude
      ? "Ici, tu DOIS répondre avec action \"conclude\", quoi qu'il arrive : la conversation doit se conclure " +
        "maintenant, avec toute la bienveillance possible même si tu n'as pas toutes les informations."
      : "Ne conclus pas après un seul message trop bref ou vague (par exemple juste \"bonjour\" ou \"ça va pas\") " +
        "sans avoir au moins essayé de mieux comprendre.");

  const conversationText = history
    .map((h) => `${h.role === "user" ? "Personne" : "Toi"}: ${h.text}`)
    .join("\n");

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
        max_tokens: 400,
        system: sys,
        messages: [
          {
            role: "user",
            content: `Voici la conversation jusqu'ici :\n${conversationText}\n\nRéponds selon les instructions.`,
          },
        ],
      }),
    });

    if (!resp.ok) return NextResponse.json(fallbackConclude(history));

    const data = await resp.json();
    const raw = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean) as ConverseResult;

    // Filet de sécurité : on force la conclusion si le cap est atteint,
    // même si le modèle a renvoyé "ask".
    if (parsed.action === "ask") {
      if (!mustConclude) return NextResponse.json(parsed);
      return NextResponse.json(fallbackConclude(history));
    }

    const themeKey = isThemeKey(parsed.themeKey) ? parsed.themeKey : null;
    return NextResponse.json({
      action: "conclude",
      themeKey,
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
      summary: parsed.summary || combinedText(history),
      closing:
        parsed.closing ||
        "Merci de m'avoir partagé tout ça. Voici un verset qui pourrait t'accompagner. " +
          (themeKey ? FALLBACK_PRACTICE[themeKey] : GENERIC_PRACTICE),
    });
  } catch {
    return NextResponse.json(fallbackConclude(history));
  }
}
