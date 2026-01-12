import api from "@/services/api";

// ============================================================
// TYPES
// ============================================================

export interface ProductCard {
    barcode: string;
    name: string;
    price?: number;
    stock?: number;
    image?: string;
    marketplace?: string;
    url?: string;
    canImport?: boolean;
}

export interface WholesalerStockHolder {
    wholesalerId: number;
    displayName?: string;
    city?: string;
    availability: "VAR" | "YOK";
    stockQty?: number;
    canMessage: boolean;
}

export interface MarketplaceComparisonCard {
    marketplace: string;
    price: number;
    stock?: number;
    currency?: string;
    available: boolean;
    url?: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: "user" | "assistant" | "system";
    content: string;
    intent?: string;
    entities?: Record<string, any>;
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface ChatResponse {
    sessionId: string;
    message: string;
    intent?: string;
    data?: any;
    productCards?: ProductCard[];
    wholesalerList?: WholesalerStockHolder[];
    marketplaceComparison?: MarketplaceComparisonCard[];
    requiresConfirmation?: boolean;
    confirmationCode?: string;
    confirmationType?: "destructive" | "privacy";
}

export interface SendMessageParams {
    sessionId?: string;
    userId?: string;
    message: string;
}

export interface GetHistoryParams {
    sessionId: string;
    limit?: number;
}

// ============================================================
// API CLIENT
// ============================================================

class ChatApi {
    private baseUrl = "/chat";

    /**
     * Send a message to the chatbot
     */
    async sendMessage(params: SendMessageParams): Promise<ChatResponse> {
        try {
            const response = await api.post<any>(`${this.baseUrl}/message`, {
                sessionId: params.sessionId,
                userId: params.userId,
                message: params.message,
            });
            // Unlock standard ApiResponse wrapper if present
            const data = response.data;
            return data.success ? data.data : data;
        } catch (error: any) {
            console.error("ChatApi.sendMessage error:", error);
            throw new Error(error.response?.data?.error || "Mesaj gönderilemedi");
        }
    }

    /**
     * Get chat history for a session
     */
    async getHistory(params: GetHistoryParams): Promise<ChatMessage[]> {
        try {
            const response = await api.get<any>(
                `${this.baseUrl}/sessions/${params.sessionId}`,
                {
                    params: { limit: params.limit },
                }
            );
            const data = response.data;
            const historyData = data.success ? data.data : data;
            return historyData.messages || [];
        } catch (error: any) {
            console.error("ChatApi.getHistory error:", error);
            return [];
        }
    }

    /**
     * Get all sessions for a user
     */
    async getUserSessions(userId: string): Promise<any[]> {
        try {
            const response = await api.get<any>(
                `${this.baseUrl}/sessions`,
                {
                    params: { userId },
                }
            );
            const data = response.data;
            const sessionData = data.success ? data.data : data;
            return sessionData.sessions || [];
        } catch (error: any) {
            console.error("ChatApi.getUserSessions error:", error);
            return [];
        }
    }

    /**
     * Import a product from a URL to local inventory and connected store
     */
    async importProduct(url: string): Promise<any> {
        try {
            const response = await api.post<any>("/products/import-url", { url });
            const data = response.data;
            if (data && data.status === "ok") {
                return data;
            }
            throw new Error(data?.error || "İçe aktarma başarısız");
        } catch (error: any) {
            console.error("ChatApi.importProduct error:", error);
            throw new Error(error.response?.data?.error || "Ürün içe aktarılamadı");
        }
    }

    /**
     * Send a message to the AI Orchestrator (new Gemini-powered endpoint)
     */
    async sendAIRequest(message: string): Promise<AIResponse> {
        try {
            const response = await api.post<any>("/ai/chat", { message });
            const data = response.data;
            // Handle both direct response and wrapped response
            if (data.success !== undefined) {
                return data.success ? data.data : data;
            }
            return data;
        } catch (error: any) {
            console.error("ChatApi.sendAIRequest error:", error);
            throw new Error(error.response?.data?.error || "AI isteği başarısız");
        }
    }
}

// AI Orchestrator Response Type
export interface AIResponse {
    requestId: string;
    intent: string;
    answer: string;
    toolResults?: Array<{
        tool: string;
        success: boolean;
        data?: unknown;
        error?: string;
    }>;
    meta?: {
        planLatencyMs?: number;
        toolsLatencyMs?: number;
        respondLatencyMs?: number;
        totalLatencyMs?: number;
    };
}

// ============================================================
// WHOLESALER API
// ============================================================

class WholesalerApi {
    private baseUrl = "/wholesaler";

    /**
     * Get stock holders for a barcode
     */
    async getStockHolders(barcode: string, viewerWholesalerId?: number): Promise<WholesalerStockHolder[]> {
        try {
            const response = await api.get<{ stockHolders: WholesalerStockHolder[] }>(
                `${this.baseUrl}/stock-holders/${barcode}`,
                {
                    params: { viewerWholesalerId },
                }
            );
            return response.data.stockHolders;
        } catch (error: any) {
            console.error("WholesalerApi.getStockHolders error:", error);
            return [];
        }
    }

    /**
     * Send a message to a wholesaler
     */
    async sendMessage(params: {
        fromWholesalerId: number;
        toWholesalerId: number;
        barcode?: string;
        productName?: string;
        requestedQty?: number;
        messageText?: string;
        includePhone?: boolean;
        senderPhone?: string;
    }): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.post<{ success: boolean; message: string }>(
                `${this.baseUrl}/message`,
                params
            );
            return response.data;
        } catch (error: any) {
            console.error("WholesalerApi.sendMessage error:", error);
            throw new Error(error.response?.data?.error || "Mesaj gönderilemedi");
        }
    }

    /**
     * Search products in wholesaler network
     */
    async searchProducts(query: string): Promise<ProductCard[]> {
        try {
            const response = await api.get<{ products: ProductCard[] }>(
                `${this.baseUrl}/search`,
                {
                    params: { q: query },
                }
            );
            return response.data.products;
        } catch (error: any) {
            console.error("WholesalerApi.searchProducts error:", error);
            return [];
        }
    }

    /**
     * Get messages (inbox or sent)
     */
    async getMessages(wholesalerId: number, type: "inbox" | "sent" = "inbox"): Promise<any[]> {
        try {
            const response = await api.get<{ messages: any[] }>(
                `${this.baseUrl}/messages`,
                {
                    params: { wholesalerId, type },
                }
            );
            return response.data.messages;
        } catch (error: any) {
            console.error("WholesalerApi.getMessages error:", error);
            return [];
        }
    }
}

// ============================================================
// EXPORTS
// ============================================================

export const chatApi = new ChatApi();
export const wholesalerApi = new WholesalerApi();
