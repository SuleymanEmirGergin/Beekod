import api from './api';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'ai';
  message: string;
  reply?: string;
  image?: string;
  timestamp?: Date;
  success?: boolean;
  data?: any;
}

export type ChatAction = 'TOP_SELLERS' | 'CRITICAL_STOCK' | 'SALES_SUMMARY';

/**
 * Get or create session ID for chat state management
 */
function getSessionId(): string {
  const key = 'beekod_chat_session_id';
  let sessionId = localStorage.getItem(key);

  if (!sessionId) {
    sessionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    localStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Clear session (useful for "reset" or logout)
 */
export function clearSession(): void {
  localStorage.removeItem('beekod_chat_session_id');
}

/**
 * Clear chat history
 */
export function clearChatHistory(): void {
  try {
    localStorage.removeItem('beekod_chat_history');
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
}

/**
 * Optional: Clear everything (session + history)
 */
export function resetChat(): void {
  clearSession();
  clearChatHistory();
}

export type SendMessageOptions = { days?: number; limit?: number; threshold?: number };

/**
 * NEW: Deterministic action support + optional image/barcode + sessionId
 * Returns full payload: { reply, data, locale }
 */
// Standardized response interface
export interface ChatResponse {
  reply: string;
  data?: any;
  locale?: string;
  error?: string; // e.g. "NETWORK_ERROR", "SERVER_ERROR"
}

export const sendMessage = async (
  message?: string,
  image?: File,
  barcode?: string,
  action?: ChatAction,
  opts?: SendMessageOptions,
  history: ChatMessage[] = [],
): Promise<any> => {
  try {
    const sessionId = getSessionId();
    let response;

    // Keep only last 5 messages for context to keep payload small
    // Normalize role: backend expects 'user' | 'ai', not 'assistant'
    const historyContext = history.slice(-5).map((h) => ({
      role: h.role === 'assistant' ? 'ai' : h.role,
      message: h.message,
    }));

    if (image) {
      const formData = new FormData();

      // message optional (action varsa boş olabilir)
      if (message) formData.append('message', message);

      formData.append('sessionId', sessionId);
      formData.append('image', image);
      formData.append('history', JSON.stringify(historyContext));

      if (barcode) formData.append('barcode', barcode);
      if (action) formData.append('action', action);

      if (opts?.days != null) formData.append('days', String(opts.days));
      if (opts?.limit != null) formData.append('limit', String(opts.limit));
      if (opts?.threshold != null) formData.append('threshold', String(opts.threshold));

      // ❗ Content-Type header'ını elle verme (axios boundary ekliyor)
      response = await api.post('/chat', formData);
    } else {
      response = await api.post('/chat', {
        message, // action varsa boş olabilir
        barcode,
        sessionId,
        action,
        history: historyContext,
        ...opts,
      });
    }

    console.log('Chat API Response:', response);
    // Always return response.data which contains { success, reply, data }
    return response.data;
  } catch (error: any) {
    console.error('Chat API Error:', error);

    // Return error in the same format as backend
    return {
      success: false,
      reply: error.response?.data?.reply || "Bağlantı hatası. Lütfen tekrar deneyin.",
      data: null,
      error: error.response ? 'SERVER_ERROR' : error.request ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR'
    };
  }
};

export const sendFeedback = async (
  messageId: string,
  rating: 'positive' | 'negative',
  comment?: string,
  context?: string,
): Promise<boolean> => {
  try {
    await api.post('/feedback', {
      messageId,
      rating,
      comment,
      context,
    });
    return true;
  } catch (error) {
    console.error('Feedback error:', error);
    return false;
  }
};

/**
 * BACKWARD COMPAT: If your UI expects Promise<string>, use this wrapper.
 * (İstersen bunu sil.)
 */
export const sendMessageText = async (
  message: string,
  image?: File,
  barcode?: string,
): Promise<string> => {
  const res = await sendMessage(message, image, barcode);
  return res.reply ?? '';
};

/**
 * Get chat history from localStorage
 */
export function getChatHistory(): ChatMessage[] {
  try {
    const history = localStorage.getItem('beekod_chat_history');
    if (!history) return [];

    const parsed = JSON.parse(history);
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
    }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Save message to chat history
 */
export function saveToChatHistory(
  userMessage: string,
  reply: string,
  success: boolean = true,
  data?: any,
): void {
  try {
    const history = getChatHistory();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      message: userMessage,
      reply,
      timestamp: new Date(),
      success,
      data,
    };

    history.push(newMessage);

    // Keep only last 50 messages
    const trimmed = history.slice(-50);
    localStorage.setItem('beekod_chat_history', JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Simple text message:
 *    const { reply } = await sendMessage("selam");
 *
 * 2. Action button (TOP_SELLERS):
 *    const { reply, data } = await sendMessage(undefined, undefined, undefined, "TOP_SELLERS", { limit: 5, days: 30 });
 *
 * 3. Action button (CRITICAL_STOCK):
 *    const { reply, data } = await sendMessage(undefined, undefined, undefined, "CRITICAL_STOCK", { threshold: 10 });
 *
 * 4. Action button (SALES_SUMMARY):
 *    const { reply, data } = await sendMessage(undefined, undefined, undefined, "SALES_SUMMARY", { days: 7 });
 *
 * 5. With barcode:
 *    const { reply } = await sendMessage("Bu ürünün stok durumu?", undefined, "Bee12345");
 *
 * 6. With image:
 *    const { reply } = await sendMessage("Bu ne?", imageFile);
 *
 * 7. Backward compatible (old code):
 *    const reply = await sendMessageText("merhaba");
 */
