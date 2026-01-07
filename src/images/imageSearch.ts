function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeOcrLine(line: string) {
  return stripDiacritics(line)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bwww\.\S+/gi, " ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreOcrLine(line: string) {
  if (!line) {
    return 0;
  }
  const letters = (line.match(/[a-z]/gi) ?? []).length;
  const digits = (line.match(/[0-9]/g) ?? []).length;
  const tokens = line.split(/\s+/).filter(Boolean);
  return letters * 2 + tokens.length - digits * 0.5;
}

function normalizeOcrToken(token: string) {
  const cleaned = token.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  if (!cleaned) {
    return "";
  }
  const hasAlpha = /[a-z]/.test(cleaned);
  if (!hasAlpha) {
    return cleaned.length >= 4 ? cleaned : "";
  }
  return cleaned.length >= 2 ? cleaned : "";
}

export function buildSearchQueryFromOcr(text: string) {
  const normalizedLines = text
    .split(/\r?\n/)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean)
    .slice(0, 20);

  if (!normalizedLines.length) {
    return "";
  }

  const sorted = normalizedLines
    .map((line) => ({ line, score: scoreOcrLine(line) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.line);

  const tokens: string[] = [];
  const seen = new Set<string>();
  for (const line of sorted) {
    const parts = line.split(" ").map(normalizeOcrToken).filter(Boolean);
    for (const token of parts) {
      if (seen.has(token)) {
        continue;
      }
      seen.add(token);
      tokens.push(token);
      if (tokens.length >= 8) {
        break;
      }
    }
    if (tokens.length >= 8) {
      break;
    }
  }

  return tokens.join(" ");
}
