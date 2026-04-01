import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /users/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'USR001', message: 'User not found' });

  let profile = null;
  if (req.user!.role === 'CUSTOMER') {
    profile = await prisma.customer.findUnique({ where: { userId: user.id } });
  } else if (req.user!.role === 'PROVIDER') {
    profile = await prisma.provider.findUnique({ where: { userId: user.id } });
  }

  res.json({ user, profile });
});

// PATCH /users/me
router.patch('/me', authenticate, [
  body('name').optional().isString().trim().notEmpty(),
  body('phone').optional().isString(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  const { name, phone } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name, phone },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });

  res.json({ user });
});

// GET /users/addresses
router.get('/addresses', authenticate, async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({
    where: { userId: req.user!.userId },
    select: { defaultAddress: true },
  });
  res.json({ addresses: customer?.defaultAddress ? [customer.defaultAddress] : [] });
});

// POST /users/addresses
router.post('/addresses', authenticate, [
  body('address').isObject(),
  body('address.lat').isFloat(),
  body('address.lng').isFloat(),
  body('address.fullAddress').isString(),
  body('address.instructions').optional().isString(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) return res.status(404).json({ error: 'CUST001', message: 'Customer not found' });

  await prisma.customer.update({
    where: { id: customer.id },
    data: { defaultAddress: req.body.address },
  });

  res.json({ success: true, address: req.body.address });
});

export default router;
