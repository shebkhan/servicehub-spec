import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /providers
router.get(
  '/',
  [
    query('service').optional().isUUID(),
    query('search').optional().isString(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { service, search, minRating, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };

    if (service) {
      where.services = { some: { tenantServiceId: String(service), isActive: true } };
    }

    if (search) {
      where.OR = [
        { businessName: { contains: String(search), mode: 'insensitive' } },
        { bio: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (minRating) {
      where.avgRating = { gte: Number(minRating) };
    }

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          services: { where: { isActive: true }, include: { tenantService: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { avgRating: 'desc' },
      }),
      prisma.provider.count({ where }),
    ]);

    res.json({
      providers,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  }
);

// GET /providers/:id
router.get(
  '/:id',
  [param('id').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const provider = await prisma.provider.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        services: { where: { isActive: true }, include: { tenantService: true } },
        schedules: { where: { isAvailable: true } },
      },
    });

    if (!provider) {
      return res.status(404).json({ error: 'PRV001', message: 'Provider not found' });
    }

    res.json({ provider });
  }
);

// GET /providers/:id/availability
router.get(
  '/:id/availability',
  [
    param('id').isUUID(),
  ],
  async (req: Request, res: Response) => {
    const { date } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'date query param required (YYYY-MM-DD)' });
    }

    const provider = await prisma.provider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ error: 'PRV001', message: 'Provider not found' });
    }

    // Generate time slots (9 AM to 6 PM, 1-hour slots)
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        available: Math.random() > 0.3, // Simulate availability
      });
    }

    res.json({ date, slots });
  }
);

// GET /providers/:id/reviews
router.get(
  '/:id/reviews',
  [
    param('id').isUUID(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await prisma.review.findMany({
      where: { providerId: req.params.id },
      include: { customer: { include: { user: { select: { name: true } } } } },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.review.count({ where: { providerId: req.params.id } });

    res.json({
      reviews,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  }
);

export default router;
