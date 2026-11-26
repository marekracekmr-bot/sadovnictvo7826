const BANNED_WORDS = [
  "kokot",
  "kkt",
  "kokotina",
  "kokoti",
  "pica",
  "pico",
  "pici",
  "picus",
  "picovina",
  "pizda",
  "kurva",
  "kurvy",
  "kurev",
  "skurvy",
  "skurveny",
  "jebat",
  "jebem",
  "jebnuty",
  "jeblina",
  "ojeb",
  "zjeb",
  "vyjeb",
  "najeb",
  "dojeb",
  "pojeb",
  "jeba",
  "chuj",
  "chujovina",
  "chuji",
  "zmrd",
  "zmrdi",
  "debil",
  "debili",
  "debilko",
  "kretén",
  "kreten",
  "kretini",
  "idiot",
  "idioti",
  "sprostak",
  "hovno",
  "hovna",
  "srat",
  "seriem",
  "posrat",
  "zasran",
  "zasrany",
  "rit",
  "riti",
  "ritolez",
  "prdel",
  "buzerant",
  "buzik",
  "teplos",
  "cigan",
  "cigani",
  "neger",
  "negri",
  "nazi",
  "hitler",
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "bitch",
  "asshole",
  "dick",
  "pussy",
  "cunt",
  "bastard",
  "whore",
  "slut",
  "nigger",
  "faggot",
  "retard"
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/!/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/@/g, "a")
    .replace(/5/g, "s")
    .replace(/\$/g, "s")
    .replace(/7/g, "t")
    .replace(/8/g, "b")
    .replace(/[^a-z0-9]/g, "")
    .replace(/(.)\1{2,}/g, "$1$1");
}

export function containsProfanity(text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;

  const collapsed = normalized.replace(/(.)\1+/g, "$1");

  return BANNED_WORDS.some((word) => {
    const cleanWord = normalizeText(word);
    const collapsedWord = cleanWord.replace(/(.)\1+/g, "$1");
    return (
      normalized.includes(cleanWord) || collapsed.includes(collapsedWord)
    );
  });
}

export function validateCleanText(text, label = "Text") {
  const trimmed = String(text || "").trim();

  if (trimmed.length < 2) {
    return `${label} musí mať aspoň 2 znaky.`;
  }

  if (containsProfanity(trimmed)) {
    return `${label} obsahuje nevhodné alebo vulgárne slovo.`;
  }

  return "";
}