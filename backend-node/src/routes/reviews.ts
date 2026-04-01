import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// POST /reviews
router.post(
  '/',
  authenticate,
  [
    body('orderId').isUUID(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('comment').optional().isString(),
    body('images').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { orderId, rating, comment, images = [] } = req.body;
    const userId = req.user!.userId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) return res.status(404).json({ error: 'ORD001', message: 'Order not found' });
    if (order.customer.userId !== userId) return res.status(403).json({ error: 'AUTH003', message: 'Not authorized' });
    if (order.status !== 'COMPLETED') return res.status(400).json({ error: 'REV001', message: 'Can only review completed orders' });

    const existing = await prisma.review.findUnique({ where: { orderId } });
    if (existing) return res.status(400).json({ error: 'REV002', message: 'Order already reviewed' });

    if (!order.providerId) return res.status(400).json({ error: 'REV003', message: 'No provider assigned to this order' });

    const review = await prisma.review.create({
      data: {
        orderId,
        customerId: order.customerId,
        providerId: order.providerId,
        tenantId: order.tenantId,
        rating,
        comment,
        images,
      },
    });

    // Update provider stats
    const allReviews = await prisma.review.findMany({ where: { providerId: order.providerId } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.provider.update({
      where: { id: order.providerId },
      data: { avgRating, totalReviews: { increment: 1 } },
    });

    res.status(201).json({ review });
  }
);

// GET /reviews/provider/:providerId
router.get(
  '/provider/:providerId',
  [param('providerId').isUUID(), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 50 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await prisma.review.findMany({
      where: { providerId: req.params.providerId },
      include: { customer: { include: { user: { select: { name: true } } } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.review.count({ where: { providerId: req.params.providerId } });

    res.json({ reviews, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  }
);

export default router;
