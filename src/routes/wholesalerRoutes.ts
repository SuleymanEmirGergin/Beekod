import express from "express";
import { wholesalerService } from "../services/wholesalerService.js";
import { auditService } from "../chatbot/auditService.js";
import { logger } from "../logger.js";

const router = express.Router();

/**
 * GET /api/wholesaler/products/:barcode
 * Barkod ile ürün ara (tüm toptancılarda)
 */
router.get("/products/:barcode", async (req, res) => {
    try {
        const { barcode } = req.params;
        const products = await wholesalerService.getProduct(barcode);

        return res.json({
            barcode,
            products,
        });
    } catch (error) {
        logger.error("wholesalerRoutes.get_products_failed", { error });
        return res.status(500).json({
            error: "Failed to get products",
        });
    }
});

/**
 * GET /api/wholesaler/stock-holders/:barcode
 * Kimde var? query
 */
router.get("/stock-holders/:barcode", async (req, res) => {
    try {
        const { barcode } = req.params;
        const { viewerWholesalerId } = req.query;

        const stockHolders = await wholesalerService.listStockHolders(
            barcode,
            viewerWholesalerId ? parseInt(viewerWholesalerId as string) : undefined
        );

        return res.json({
            barcode,
            stockHolders,
        });
    } catch (error) {
        logger.error("wholesalerRoutes.stock_holders_failed", { error });
        return res.status(500).json({
            error: "Failed to get stock holders",
        });
    }
});

/**
 * POST /api/wholesaler/message
 * Platform içi mesaj gönder
 */
router.post("/message", async (req, res) => {
    try {
        const {
            fromWholesalerId,
            toWholesalerId,
            barcode,
            productName,
            requestedQty,
            messageText,
            includePhone,
            senderPhone,
            userId,
            sessionId,
        } = req.body;

        if (!fromWholesalerId || !toWholesalerId) {
            return res.status(400).json({
                error: "fromWholesalerId and toWholesalerId are required",
            });
        }

        // Send message
        await wholesalerService.sendMessage({
            fromWholesalerId,
            toWholesalerId,
            barcode,
            productName,
            requestedQty,
            messageText,
            includePhone,
            senderPhone,
        });

        // Audit log
        if (sessionId) {
            await auditService.logMessageSend({
                userId,
                sessionId,
                fromWholesalerId,
                toWholesalerId,
                barcode,
                includePhone: includePhone || false,
                phone: includePhone ? senderPhone : undefined,
            });
        }

        return res.json({
            success: true,
            message: "Message sent successfully",
        });
    } catch (error) {
        logger.error("wholesalerRoutes.send_message_failed", { error });
        return res.status(500).json({
            error: "Failed to send message",
        });
    }
});

/**
 * GET /api/wholesaler/messages
 * Mesajları getir (inbox/sent)
 */
router.get("/messages", async (req, res) => {
    try {
        const { wholesalerId, type = "inbox", limit = "50" } = req.query;

        if (!wholesalerId) {
            return res.status(400).json({
                error: "wholesalerId is required",
            });
        }

        const messages = await wholesalerService.getMessages(
            parseInt(wholesalerId as string),
            type as "inbox" | "sent",
            parseInt(limit as string)
        );

        return res.json({
            messages,
        });
    } catch (error) {
        logger.error("wholesalerRoutes.get_messages_failed", { error });
        return res.status(500).json({
            error: "Failed to get messages",
        });
    }
});

/**
 * PATCH /api/wholesaler/messages/:id/read
 * Mesajı okundu işaretle
 */
router.patch("/messages/:id/read", async (req, res) => {
    try {
        const { id } = req.params;
        const { wholesalerId } = req.body;

        if (!wholesalerId) {
            return res.status(400).json({
                error: "wholesalerId is required",
            });
        }

        await wholesalerService.markAsRead(parseInt(id), parseInt(wholesalerId));

        return res.json({
            success: true,
        });
    } catch (error) {
        logger.error("wholesalerRoutes.mark_read_failed", { error });
        return res.status(500).json({
            error: "Failed to mark message as read",
        });
    }
});

/**
 * GET /api/wholesaler/search
 * Toptancı ağında ürün ara
 */
router.get("/search", async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                error: "Query is required (q parameter)",
            });
        }

        const products = await wholesalerService.searchProducts(q as string);

        return res.json({
            query: q,
            products,
        });
    } catch (error) {
        logger.error("wholesalerRoutes.search_failed", { error });
        return res.status(500).json({
            error: "Failed to search products",
        });
    }
});

export default router;
