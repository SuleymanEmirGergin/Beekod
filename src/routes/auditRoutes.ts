import { Router } from 'express';
import { auditService } from '../services/auditService.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { z } from 'zod';
import { validateQuery } from '../validation.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['Owner', 'Admin']));

const auditQuerySchema = z.object({
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0)
});

router.get('/', validateQuery(auditQuerySchema), async (req, res, next) => {
    try {
        const { limit, offset } = req.query as unknown as { limit: number; offset: number };
        const result = await auditService.getLogs(limit, offset);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export const auditRouter = router;
