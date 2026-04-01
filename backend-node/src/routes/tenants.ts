import { Router, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /tenants/:id
router.get('/:id', [param('id').isUUID()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'TEN001', message: 'Tenant not found' });

  res.json({ tenant });
});

// GET /tenants/:id/services
router.get('/:id/services', [
  param('id').isUUID(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  const services = await prisma.tenantService.findMany({
    where: { tenantId: req.params.id, isActive: true },
    include: { globalService: { include: { category: true } } },
    orderBy: { category: 'asc' },
  });

  res.json({ services });
});

// GET /tenants/settings
router.get('/:id/settings', authenticate, async (req: Request, res: Response) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } });
  if (!tenant) return res.status(404).json({ error: 'TEN001', message: 'Tenant not found' });

  res.json({ settings: tenant.settings });
});

export default router;
