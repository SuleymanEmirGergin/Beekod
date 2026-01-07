import { IntentHandler } from "./types.js";
import { updateUserPreferences, UserPreferences, Tone, DetailLevel } from "../../services/userPreferenceService.js";
import { t } from "../../i18n.js";

export const preferenceHandler: IntentHandler = async (parsed, context) => {
  const { userId, message, locale, userPreferences } = context;

  if (!userId) {
    return {
      reply: t(locale, "server_error"),
      success: false,
    };
  }

  let tone: Tone | undefined;
  let detailLevel: DetailLevel | undefined;

  // Simple regex matching for MVP
  if (/\btone:(professional|friendly|concise|pirate)\b/i.test(message)) {
    tone = message.match(/\btone:(professional|friendly|concise|pirate)\b/i)![1].toLowerCase() as Tone;
  }

  if (/\bdetail:(summary|detailed)\b/i.test(message)) {
    detailLevel = message.match(/\bdetail:(summary|detailed)\b/i)![1].toLowerCase() as DetailLevel;
  }

  if (!tone && !detailLevel) {
    // Just show current prefs
    const currentTone = userPreferences?.tone || "friendly";
    const currentDetail = userPreferences?.detailLevel || "summary";

    return {
      reply:
        locale === "tr"
          ? `Mevcut Ayarların:\n- Ton: ${currentTone}\n- Detay: ${currentDetail}\n\nDeğiştirmek için komut gir: \`/myprefs tone:pirate detail:detailed\``
          : `Current Settings:\n- Tone: ${currentTone}\n- Detail: ${currentDetail}\n\nTo change: \`/myprefs tone:pirate detail:detailed\``,
      success: true,
    };
  }

  const updates: Partial<UserPreferences> = {};
  if (tone) updates.tone = tone;
  if (detailLevel) updates.detailLevel = detailLevel;

  updateUserPreferences(userId, updates);

  return {
    reply:
      locale === "tr"
        ? `Ayarlar güncellendi! 🎉\nTon: ${tone || userPreferences?.tone}\nDetay: ${detailLevel || userPreferences?.detailLevel}`
        : `Preferences updated! 🎉\nTone: ${tone || userPreferences?.tone}\nDetail: ${detailLevel || userPreferences?.detailLevel}`,
    success: true,
  };
};
