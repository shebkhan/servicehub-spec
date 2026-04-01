import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

function generateTokens(payload: { userId: string; tenantId?: string; role: UserRole }) {
  const accessToken = jwt.sign({ ...payload, type: 'access' }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
  return { accessToken, refreshToken };
}

// POST /auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('phone').optional().isMobilePhone(),
    body('role').optional().isIn(Object.values(UserRole)),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { email, password, name, phone, role = UserRole.CUSTOMER } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'USR002', message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, phone, role },
    });

    // Create tokens
    const tokens = generateTokens({ userId: user.id, role: user.role });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    });
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
    }

    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'AUTH001', message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'AUTH001', message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'AUTH003', message: 'Account is locked' });
    }

    // Get default tenant for this user
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { userId: user.id },
      include: { tenant: true },
    });

    const tokens = generateTokens({
      userId: user.id,
      tenantId: tenantUser?.tenantId,
      role: user.role,
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      ...tokens,
    });
  }
);

// POST /auth/refresh
router.post('/refresh', [body('refresh_token').notEmpty()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: errors.array() });
  }

  const { refresh_token } = req.body;

  try {
    const payload = jwt.verify(refresh_token, config.JWT_REFRESH_SECRET) as any;

    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'AUTH002', message: 'Invalid token type' });
    }

    const tokens = generateTokens({
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ error: 'AUTH002', message: 'Refresh token expired or invalid' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, phone: true, role: true, isActive: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'USR001', message: 'User not found' });
  }

  res.json({ user });
});

export default router;
