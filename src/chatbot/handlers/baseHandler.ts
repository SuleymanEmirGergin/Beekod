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
<<<<<<< HEAD
        intent?: string
=======
        intent?: string,
        message?: string
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e
    ): Promise<HandlerResult>;
}
