import { Locale } from "../../types.js";

const EN_HINTS = [
  /\bprice\b/i,
  /\bstock\b/i,
  /\bincrease\b/i,
  /\bdecrease\b/i,
  /\bproduct\b/i,
  /\bsearch\b/i,
  /\bhelp\b/i,
  /\bmarketplace\b/i,
  /\b(hello|hi|what|is|the|how|please|thank|thanks|advice|suggest|suggestion|strategy)\b/i,
];

const TR_HINTS = [
  /\b(merhaba|selam|gunaydin|iyi\s+gunler|nasil|nasilsin|lutfen|yardim|urun|fiyat|stok|barkod|pazaryeri|satis|rapor)\b/i,
];

const DE_HINTS = [
  /\b(hallo|guten|morgen|tag|hilfe|produkt|preis|bestand|lager|markt|suche|bericht|erhoehen|verringern)\b/i,
  /\bpreis\b/i,
  /\bbestand\b/i,
];

const FR_HINTS = [
  /\b(bonjour|salut|aide|produit|prix|stock|marche|recherche|rapport|augmenter|diminuer)\b/i,
  /\bprix\b/i,
];

const ES_HINTS = [
  /\b(hola|buenos|dias|ayuda|producto|precio|stock|mercado|buscar|busqueda|informe|aumentar|disminuir)\b/i,
  /\bprecio\b/i,
  /\bexistencias\b/i,
];

const AR_HINTS = [
  /[\u0600-\u06FF]/, // Arabic script broad range
  /\b(مرحبا|سلام|مساعدة|منتج|سعر|مخزون|سوق|بحث|تقرير|زيادة|نقص)\b/i,
];


// Reduced to characters unique to Turkish
const LOCALE_TURKISH_CHAR_PATTERN = /[ğış]/i;

function normalizeLocaleInput(message: string) {
  return message
    .normalize("NFD")
    .replace(/\u0131/g, "i")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function detectLocale(message: string): Locale {
  const trimmed = message.trim();
  if (!trimmed) return "tr";

  if (LOCALE_TURKISH_CHAR_PATTERN.test(trimmed)) return "tr";

  const normalized = normalizeLocaleInput(message);

  const scores = { tr: 0, en: 0, de: 0, fr: 0, es: 0, ar: 0 };


  const countMatches = (text: string, hints: RegExp[]) =>
    hints.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);

  scores.en = countMatches(normalized, EN_HINTS);
  scores.tr = countMatches(normalized, TR_HINTS);
  scores.de = countMatches(normalized, DE_HINTS);
  scores.fr = countMatches(normalized, FR_HINTS);
  scores.es = countMatches(normalized, ES_HINTS);
  scores.ar = countMatches(normalized, AR_HINTS);


  let maxScore = 0;
  let bestLocale: Locale = "tr";

  (Object.keys(scores) as Locale[]).forEach((loc) => {
    if (scores[loc] > maxScore) {
      maxScore = scores[loc];
      bestLocale = loc;
    }
  });

  if (maxScore === 0) return "tr";
  return bestLocale;
}
