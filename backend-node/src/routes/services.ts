import { Router, Request, Response } from 'express';
import { param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /services/categories
router.get('/categories', async (_req: Request, res: Response) => {
  const categories = await prisma.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  res.json({ categories });
});

// GET /services
router.get(
  '/',
  [
    query('category').optional().isString(),
    query('search').optional().isString(),
    query('minPrice').optional().isFloat({ min: 0 }),
    query('maxPrice').optional().isFloat({ min: 0 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isActive: true };

    if (category) {
      where.category = String(category);
    }

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const [services, total] = await Promise.all([
      prisma.tenantService.findMany({
        where,
        include: { globalService: { include: { category: true } } },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenantService.count({ where }),
    ]);

    res.json({
      services,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  }
);

// GET /services/:id
router.get(
  '/:id',
  [param('id').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const service = await prisma.tenantService.findUnique({
      where: { id: req.params.id },
      include: { globalService: { include: { category: true } }, tenant: true },
    });

    if (!service) {
      return res.status(404).json({ error: 'SVC001', message: 'Service not found' });
    }

    // Get providers who offer this service
    const providers = await prisma.providerService.findMany({
      where: { tenantServiceId: service.id, isActive: true },
      include: { provider: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });

    res.json({ service, providers });
  }
);

export default router;
