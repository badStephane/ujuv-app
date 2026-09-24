import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { phrase, ref, text } = await req.json();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reflection: null });
  }

  const sys =
    "Tu écris une réflexion très courte (1 à 2 phrases), chaleureuse, sans ton moralisateur, en français, " +
    "qui relie un verset biblique donné à la situation décrite par la personne. Réponds UNIQUEMENT en JSON " +
    'valide, sans texte autour, sans balises markdown, sous la forme exacte: {"reflection":"..."}. Ne cite pas ' +
    "et ne reformule pas le verset, contente-toi d'un mot d'accompagnement.";

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
        max_tokens: 150,
        system: sys,
        messages: [
          { role: "user", content: `Situation: ${phrase}\nVerset retenu (${ref}): ${text}` },
        ],
      }),
    });

    if (!resp.ok) return NextResponse.json({ reflection: null });

    const data = await resp.json();
    const raw = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json({ reflection: parsed.reflection || null });
  } catch {
    return NextResponse.json({ reflection: null });
  }
}
