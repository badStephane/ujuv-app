export type Verse = { ref: string; text: string; norm: string };
export type ThemeKey =
  | "tristesse" | "colere" | "anxiete" | "decision" | "pardon" | "fatigue"
  | "solitude" | "decouragement" | "deuil" | "doute" | "finances"
  | "gratitude" | "force";

export const THEME_LABELS: Record<ThemeKey, string> = {
  tristesse: "Tristesse",
  colere: "Colère",
  anxiete: "Anxiété, inquiétude",
  decision: "Choix, décision",
  pardon: "Culpabilité, pardon",
  fatigue: "Fatigue, épuisement",
  solitude: "Solitude",
  decouragement: "Découragement",
  deuil: "Deuil, perte",
  doute: "Doute",
  finances: "Souci matériel, travail",
  gratitude: "Reconnaissance",
  force: "Besoin de force, courage",
};

export const THEME_PHRASE: Record<ThemeKey, string> = {
  tristesse: "Je me sens triste, j'ai le cœur lourd.",
  colere: "Je ressens de la colère en ce moment.",
  anxiete: "Je suis anxieux, inquiet, stressé.",
  decision: "J'ai un choix ou une décision importante à prendre et je ne sais pas quoi faire.",
  pardon: "Je me sens coupable, j'ai besoin de pardon.",
  fatigue: "Je suis épuisé, fatigué, à bout de forces.",
  solitude: "Je me sens seul, isolé.",
  decouragement: "Je suis découragé, je n'ai plus vraiment envie de rien.",
  deuil: "Je vis un deuil, j'ai perdu quelqu'un.",
  doute: "Je doute de ma foi, j'ai du mal à croire.",
  finances: "J'ai des soucis d'argent ou de travail.",
  gratitude: "Je me sens reconnaissant, je veux dire merci.",
  force: "J'ai besoin de force et de courage, une épreuve est difficile en ce moment.",
};

export const SEARCH_TERMS: Record<ThemeKey, string[]> = {
  tristesse: ["triste","tristesse","pleur","pleure","pleurs","larme","larmes","chagrin","afflige","affliction","abattement","abattu","gemi","souffrance","douleur","coeur brise"],
  colere: ["colere","irrite","fureur","furieux","emportement","emporte","exasper","indignation","vengeance"],
  anxiete: ["inquiet","inquiete","crain","crainte","peur","angoisse","trouble","souci","soucie","epouvante","effraie","tourmente"],
  decision: ["sagesse","conseil","voie","chemin","sentier","discernement","direction","conduira","instruira","enseignera"],
  pardon: ["pardon","pardonne","coupable","peche","peches","iniquite","transgression","confesse","purifie","misericorde","grace"],
  fatigue: ["fatigue","fatigues","repos","charges","epuise","force nouvelle","renouvellent","lasse","lassez"],
  solitude: ["seul","abandonne","abandonnera","delaissera","recueillera","isole"],
  decouragement: ["decourage","desespoir","relachons","lassons","fortifie","courage","epouvante"],
  deuil: ["deuil","mort","morts","larme","larmes","console","consolation","resurrection","vie eternelle"],
  doute: ["doute","incredulite","incroyant","foi","crois","croire","assurance des choses"],
  finances: ["besoin","besoins","pain","pourvoira","richesse","pauvre","manque","abandonne son pain","lendemain"],
  gratitude: ["grace","graces","reconnaiss","allegresse","joie","louange","benediction"],
  force: ["force","forces","fortifie","puissance","faiblesse","vigueur","courage"],
};

export const FALLBACK_REFLECTION: Record<ThemeKey, string> = {
  tristesse: "Ta tristesse n'est pas ignorée. Elle est vue, et elle ne dure pas toujours.",
  colere: "La colère demande à être posée quelque part avant qu'elle ne te consume.",
  anxiete: "Ce que tu portes seul peut être déposé. Tu n'es pas obligé de tout tenir.",
  decision: "Tu n'as pas besoin de voir tout le chemin pour faire le prochain pas.",
  pardon: "Ce que tu regrettes ne définit pas ce qui vient après.",
  fatigue: "Le repos n'est pas une faiblesse. C'est une permission.",
  solitude: "Ce que tu vis en silence n'est pas vécu sans témoin.",
  decouragement: "Un jour difficile ne raconte pas toute l'histoire.",
  deuil: "Ce qui a été aimé profondément laisse un vide réel. Il est permis de le nommer.",
  doute: "Douter n'est pas le contraire de croire. C'est souvent un passage.",
  finances: "Le manque que tu vis aujourd'hui n'a pas le dernier mot sur demain.",
  gratitude: "Nommer ce qui va bien, c'est déjà une forme de prière.",
  force: "Ce qui te dépasse aujourd'hui ne te dépasse pas seul.",
};

export const GENERAL_SEARCH = ["refuge", "paix", "secours", "confie", "esperance", "force", "bonte", "fidelite"];

const STOPWORDS = new Set([
  "je","tu","il","elle","on","nous","vous","ils","elles","suis","es","est","sommes","etes","sont",
  "de","des","du","le","la","les","un","une","et","a","au","aux","avec","pour","que","qui","ne","pas",
  "plus","tres","bien","fais","fait","faire","sens","sent","sentir","ce","cette","ces","mon","ma","mes",
  "ton","ta","tes","son","sa","ses","dans","sur","par","en","comme","donc","alors","car","mais","si","ou",
  "cela","ca","ai","as","avoir","etre","aujourd","hui","depuis","vers","tout","toute","tous","toutes",
]);

export function normalizeText(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function wordsFromFreeText(text: string): string[] {
  return normalizeText(text)
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
}

const THEME_QUICK_KEYWORDS: Record<ThemeKey, string[]> = {
  tristesse: ["triste","tristesse","pleure","pleurer","chagrin","larmes","deprime","deprim"],
  colere: ["colere","enerve","furieux","rage","exaspere","agace"],
  anxiete: ["anxieux","anxiete","stress","inquiet","inquiete","peur","angoisse","angoisse"],
  decision: ["choix","decision","decider","que faire","perdu","direction"],
  pardon: ["pardon","coupable","culpabilite","honte","faute","peche"],
  fatigue: ["fatigue","fatigue","epuise","epuisement","a bout"],
  solitude: ["seul","seule","solitude","abandonne","isole"],
  decouragement: ["decourage","desespoir","abandonner"],
  deuil: ["deuil","mort","decede","disparu"],
  doute: ["doute","dieu existe","crois pas"],
  finances: ["argent","travail","boulot","job","finances","salaire","dettes","chomage"],
  gratitude: ["merci","reconnaissant","reconnaissance","content","heureux","joie"],
  force: ["courage","force","faible","difficile","epreuve"],
};

export function matchTheme(text: string): ThemeKey | null {
  const t = normalizeText(text);
  let best: ThemeKey | null = null;
  let bestScore = 0;
  (Object.keys(THEME_QUICK_KEYWORDS) as ThemeKey[]).forEach((key) => {
    let score = 0;
    THEME_QUICK_KEYWORDS[key].forEach((k) => {
      if (t.includes(normalizeText(k))) score++;
    });
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  });
  return bestScore > 0 ? best : null;
}

export function searchCorpus(
  verses: Verse[],
  keywords: string[],
  usedRefs: Set<string>,
  limit = 25
): Verse | null {
  const kws = keywords.map(normalizeText).filter((k) => k.length >= 3);
  let scored: [number, Verse][] = [];
  for (const v of verses) {
    if (usedRefs.has(v.ref)) continue;
    let score = 0;
    for (const k of kws) if (v.norm.includes(k)) score++;
    if (score > 0) scored.push([score, v]);
  }
  if (scored.length === 0) {
    for (const v of verses) {
      let score = 0;
      for (const k of kws) if (v.norm.includes(k)) score++;
      if (score > 0) scored.push([score, v]);
    }
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b[0] - a[0]);
  const top = scored.slice(0, limit);
  const pick = top[Math.floor(Math.random() * top.length)][1];
  usedRefs.add(pick.ref);
  return pick;
}

export function pickRandomVerse(verses: Verse[]): Verse | null {
  if (verses.length === 0) return null;
  return verses[Math.floor(Math.random() * verses.length)];
}
