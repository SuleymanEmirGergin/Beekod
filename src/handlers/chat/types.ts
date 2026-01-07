import { Locale } from "../../types.js";
import { ParsedMessage } from "../../services/nlp.js";
import { UserPreferences } from "../../services/userPreferenceService.js";

export interface ChatContext {
  message: string;
  locale: Locale;
  intent?: string; // Added for new intent handlers
  requestId?: string;
  userId?: string;
  history?: any[];
  userPreferences?: UserPreferences;
  body: {
    sessionId?: string;
    locale?: string;
    barcode?: string;
    file?: any; // Multer file
    [key: string]: any;
  };
}


export interface IntentHandlerResult {
  reply: string;
  data?: any;
  success: boolean;
  status?: number;
  logBarcode?: string;
  logResponse?: string;
}

export type IntentHandler = (parsed: ParsedMessage, context: ChatContext) => Promise<IntentHandlerResult>;
