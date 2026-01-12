import { ChatEntity, HandlerResult } from "../types.js";

/**
 * Base Handler Interface
 * Tüm handler'ların implement etmesi gereken interface
 */
export interface ChatHandler {
    /**
     * Handler'ın adı
     */
    name: string;

    /**
     * Desteklenen intent'ler
     */
    supportedIntents: string[];

    /**
     * Handler execute
     */
    handle(
        entities: ChatEntity,
        userId?: string,
        sessionId?: string,
        intent?: string
    ): Promise<HandlerResult>;
}
