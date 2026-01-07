export function normalizeText(input: string): string {
    if (!input) return "";
    let text = input.trim().toLowerCase();

    // Turkish character map
    const charMap: Record<string, string> = {
        'ı': 'i', 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c'
    };

    // Apply charMap
    for (const [key, value] of Object.entries(charMap)) {
        text = text.split(key).join(value);
    }

    // Standardize storage: "512 gb" -> "512gb", "1 tb" -> "1tb"
    text = text.replace(/(\d+)\s?(gb|tb)/gi, "$1$2");

    // Normalize spaces and punctuation
    text = text.replace(/[.,;!?]/g, " ");
    text = dedupeSpaces(text);

    return text;
}

export function tokenize(input: string): string[] {
    return normalizeText(input).split(" ").filter(Boolean);
}

export function dedupeSpaces(input: string): string {
    return input.replace(/\s+/g, " ").trim();
}

export function titleCaseBrandModel(input: string): string {
    if (!input) return "";
    // Special cases
    if (input.toLowerCase() === "iphone") return "iPhone";
    if (input.toLowerCase() === "ios") return "iOS";

    return input.split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}
