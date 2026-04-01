import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';

const router = Router();
const prisma = new PrismaClient();
const stripe = config.STRIPE_SECRET_KEY ? new Stripe(config.STRIPE_SECRET_KEY) : null;

// GET /wallet/balance
router.get('/balance', authenticate, async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) return res.status(404).json({ error: 'CUST001', message: 'Customer not found' });

  res.json({ balance: Number(customer.creditBalance), currency: 'USD' });
});

// GET /wallet/transactions
router.get('/transactions', authenticate, async (req: Request, res: Response) => {
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) return res.status(404).json({ error: 'CUST001', message: 'Customer not found' });

  const txs = await prisma.walletTransaction.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  res.json({ transactions: txs });
});

// POST /wallet/topup
router.post('/topup', authenticate, [body('amount').isFloat({ min: 1 })], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  const { amount } = req.body;
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) return res.status(404).json({ error: 'CUST001', message: 'Customer not found' });

  if (!stripe) {
    return res.status(500).json({ error: 'STRIPE_ERROR', message: 'Stripe not configured' });
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // cents
    currency: 'usd',
    customer: customer.defaultPayment || undefined,
    metadata: { type: 'wallet_topup', customerId: customer.id },
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount,
  });
});

// POST /payments/stripe-intent (for card payments on orders)
router.post('/stripe-intent', authenticate, [body('orderId').isUUID(), body('amount').isFloat({ min: 0.5 })], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  if (!stripe) return res.status(500).json({ error: 'STRIPE_ERROR', message: 'Stripe not configured' });

  const { orderId, amount } = req.body;
  const customer = await prisma.customer.findUnique({ where: { userId: req.user!.userId } });
  if (!customer) return res.status(404).json({ error: 'CUST001', message: 'Customer not found' });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ error: 'ORD001', message: 'Order not found' });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata: { type: 'order_payment', orderId, customerId: customer.id },
  });

  res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
});

// POST /payments/confirm - webhook or client callback to confirm payment
router.post('/confirm', authenticate, async (req: Request, res: Response) => {
  const { paymentIntentId, type = 'wallet_topup', customerId, orderId, amount } = req.body;

  if (type === 'wallet_topup' && customerId) {
    await prisma.walletTransaction.create({
      data: {
        customerId,
        type: 'topup',
        amount,
        description: 'Wallet top-up',
      },
    });
    await prisma.customer.update({
      where: { id: customerId },
      data: { creditBalance: { increment: amount } },
    });
  } else if (type === 'order_payment' && orderId) {
    await prisma.payment.create({
      data: {
        orderId,
        tenantId: req.user!.tenantId || '',
        customerId: req.user!.userId,
        amount,
        type: 'card',
        status: 'completed',
        stripePaymentId: paymentIntentId,
      },
    });
  }

  res.json({ success: true });
});

// POST /payments/refund
router.post('/refund', authenticate, [body('orderId').isUUID()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });

  if (!stripe) return res.status(500).json({ error: 'STRIPE_ERROR', message: 'Stripe not configured' });

  const { orderId } = req.body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return res.status(404).json({ error: 'ORD001', message: 'Order not found' });

  const payment = await prisma.payment.findFirst({ where: { orderId } });
  if (!payment?.stripePaymentId) return res.status(400).json({ error: 'PAY001', message: 'No Stripe payment found' });

  await stripe.refunds.create({ payment_intent: payment.stripePaymentId });
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'refunded' } });

  res.json({ success: true, message: 'Refund processed' });
});

export default router;
