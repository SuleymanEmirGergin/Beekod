
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleChatMessage } from '../../../src/routes/chat/controllers/messageController';
import { Request, Response } from 'express';

// Mock all dependencies with correct paths

vi.mock('../../../src/services/nlp.js', () => ({
    parseMessage: vi.fn(),
}));

vi.mock('../../../src/services/chatSessionService.js', () => ({
    getSessionKey: vi.fn(),
    getPending: vi.fn(),
    clearPending: vi.fn(),
    saveMessage: vi.fn(),
    getActiveBarcode: vi.fn(),
    setPending: vi.fn(),
}));

vi.mock('../../../src/services/logService.js', () => ({
    createLog: vi.fn(),
}));

vi.mock('../../../src/utils/responseHelper.js', () => ({
    sendErrorResponse: vi.fn(({ res, statusCode, message, error }) => {
        return res.status(statusCode).json({ success: false, message, error });
    }),
}));

vi.mock('../../../src/i18n.js', () => ({
    t: vi.fn((locale, key) => key),
}));

vi.mock('../../../src/logger.js', () => ({
    logger: {
        warn: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
    chatLogger: {
        info: vi.fn(),
    },
}));

vi.mock('../../../src/handlers/chat/index.js', () => ({
}));

vi.mock('../../../src/services/userPreferenceService.js', () => ({
    getUserPreferences: vi.fn().mockReturnValue({}),
}));

vi.mock('../../../src/routes/chat/utils.js', () => ({
    applyPending: vi.fn(),
    getIntentHandler: vi.fn(),
}));

import * as nlp from '../../../src/services/nlp.js';
import * as utils from '../../../src/routes/chat/utils.js';

describe('Message Controller', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let jsonMock: any;
    let statusMock: any;

    beforeEach(() => {
        req = {
            body: { message: 'Hello' },
        };
        jsonMock = vi.fn();
        statusMock = vi.fn().mockReturnValue({ json: jsonMock });
        res = {
            status: statusMock,
            locals: {}
        };
        vi.clearAllMocks();
    });

    it('should return error if message and action are missing', async () => {
        req.body.message = '';
        await handleChatMessage(req as Request, res as Response);
        expect(statusMock).toHaveBeenCalledWith(400);
    });

    it('should process a valid message', async () => {
        (nlp.parseMessage as any).mockReturnValue({
            intent: 'greeting',
            missing: [],
            locale: 'tr'
        });

        const mockHandler = vi.fn().mockResolvedValue({
            success: true,
            reply: 'Merhaba!',
            data: {}
        });
        (utils.getIntentHandler as any).mockReturnValue(mockHandler);

        await handleChatMessage(req as Request, res as Response);

        // DEBUG: Print what json was called with
        console.log("JSON Mock Calls:", JSON.stringify(jsonMock.mock.calls, null, 2));

        expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            reply: 'Merhaba!'
        }));
    });
});
