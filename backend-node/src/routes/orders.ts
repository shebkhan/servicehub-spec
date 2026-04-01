import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient, OrderStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD-${dateStr}-${random}`;
}

// POST /orders
router.post(
  '/',
  authenticate,
  [
    body('scheduledDate').matches(/^\d{4}-\d{2}-\d{2}$/),
    body('scheduledTime').matches(/^\d{2}:\d{2}$/),
    body('serviceAt').optional().isIn(['home', 'store', 'provider_location']),
    body('address').optional().isObject(),
    body('items').isArray({ min: 1 }),
    body('items.*.serviceId').isUUID(),
    body('items.*.quantity').optional().isInt({ min: 1 }),
    body('paymentMethod').optional().isIn(['wallet', 'card', 'cash']),
    body('promoCode').optional().isString(),
    body('providerId').optional().isUUID(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { scheduledDate, scheduledTime, serviceAt = 'home', address, items, paymentMethod = 'wallet', promoCode, providerId } = req.body;
    const userId = req.user!.userId;

    // Get customer
    const customer = await prisma.customer.findUnique({
      where: { userId },
      include: { tenant: true },
    });

    if (!customer) {
      return res.status(404).json({ error: 'CUST001', message: 'Customer profile not found' });
    }

    // Fetch service details
    const serviceIds = items.map((i: any) => i.serviceId);
    const services = await prisma.tenantService.findMany({
      where: { id: { in: serviceIds } },
    });

    if (services.length !== items.length) {
      return res.status(400).json({ error: 'ORD001', message: 'One or more services not found' });
    }

    // Calculate totals
    let subtotal = 0;
    let totalDuration = 0;
    const orderItems = services.map((svc) => {
      const item = items.find((i: any) => i.serviceId === svc.id);
      const qty = item?.quantity || 1;
      subtotal += Number(svc.price) * qty;
      totalDuration += svc.duration * qty;
      return {
        id: uuidv4(),
        tenantServiceId: svc.id,
        price: Number(svc.price),
        duration: svc.duration,
        quantity: qty,
      };
    });

    let discount = 0;
    let creditUsed = 0;
    let cashCollected = subtotal;

    // Apply promo code if valid
    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: { code: promoCode, tenantId: customer.tenantId, isActive: true },
      });
      if (promo && new Date() < promo.validUntil && (promo.usageLimit === 0 || promo.usedCount < promo.usageLimit)) {
        if (subtotal >= Number(promo.minOrderValue)) {
          if (promo.discountType === 'percentage') {
            discount = (subtotal * Number(promo.discountValue)) / 100;
            if (promo.maxDiscount > 0) discount = Math.min(discount, Number(promo.maxDiscount));
          } else {
            discount = Number(promo.discountValue);
          }
          // Increment usage
          await prisma.promoCode.update({ where: { id: promo.id }, data: { usedCount: { increment: 1 } } });
        }
      }
    }

    // Use wallet credit if payment method is wallet
    if (paymentMethod === 'wallet') {
      creditUsed = Math.min(Number(customer.creditBalance), subtotal - discount);
      cashCollected = subtotal - discount - creditUsed;
    }

    const total = subtotal - discount;

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        tenantId: customer.tenantId,
        customerId: customer.id,
        providerId,
        status: OrderStatus.PENDING,
        scheduledDate,
        scheduledTime,
        serviceAt,
        address: address || null,
        subtotal,
        discount,
        total,
        creditUsed,
        cashCollected,
        notes: req.body.notes,
        items: { create: orderItems },
      },
      include: { items: true, customer: true, provider: true },
    });

    res.status(201).json({ order });
  }
);

// GET /orders
router.get(
  '/',
  authenticate,
  [
    query('status').optional().isIn(Object.values(OrderStatus)),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userId = req.user!.userId;

    const where: any = {};
    if (status) where.status = status;

    // Filter by user role
    if (req.user!.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer) return res.json({ orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      where.customerId = customer.id;
    } else if (req.user!.role === 'PROVIDER') {
      const provider = await prisma.provider.findUnique({ where: { userId } });
      if (!provider) return res.json({ orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      where.providerId = provider.id;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: { include: { user: { select: { name: true, email: true } } } }, provider: true, items: true },
        skip,
        take: Number(limit),
        orderBy: { placedAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  }
);

// GET /orders/:id
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { tenantService: true } },
        customer: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        provider: { include: { user: { select: { id: true, name: true, email: true, phone: true } } } },
        payment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'ORD001', message: 'Order not found' });
    }

    res.json({ order });
  }
);

// PATCH /orders/:id/status
router.patch(
  '/:id/status',
  authenticate,
  authorize('PROVIDER', 'TENANT_ADMIN'),
  [
    param('id').isUUID(),
    body('status').isIn(Object.values(OrderStatus)),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { status } = req.body;
    const orderId = req.params.id;

    const updateData: any = { status };

    if (status === 'CONFIRMED') updateData.confirmedAt = new Date();
    if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      // Credit the provider and platform
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (order) {
        // Update provider stats
        if (order.providerId) {
          await prisma.provider.update({
            where: { id: order.providerId },
            data: { completedJobs: { increment: 1 }, totalJobs: { increment: 1 } },
          });
        }
      }
    }

    const order = await prisma.order.update({ where: { id: orderId }, data: updateData });

    res.json({ order });
  }
);

// PATCH /orders/:id/cancel
router.patch(
  '/:id/cancel',
  authenticate,
  [param('id').isUUID(), body('reason').optional().isString()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order) {
      return res.status(404).json({ error: 'ORD001', message: 'Order not found' });
    }

    // Only pending/confirmed orders can be cancelled
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ error: 'ORD003', message: 'Order cannot be cancelled' });
    }

    // Refund wallet credit if used
    if (Number(order.creditUsed) > 0) {
      await prisma.customer.update({
        where: { id: order.customerId },
        data: { creditBalance: { increment: Number(order.creditUsed) } },
      });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: req.body.reason,
      },
    });

    res.json({ order: updated });
  }
);

export default router;
