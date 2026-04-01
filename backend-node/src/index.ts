import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/index.js';
import {
  authRoutes,
  servicesRoutes,
  providersRoutes,
  ordersRoutes,
  paymentsRoutes,
  reviewsRoutes,
  usersRoutes,
  tenantsRoutes,
} from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGINS, credentials: true }));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/services`, servicesRoutes);
app.use(`${API}/providers`, providersRoutes);
app.use(`${API}/orders`, ordersRoutes);
app.use(`${API}/wallet`, paymentsRoutes);
app.use(`${API}/payments`, paymentsRoutes);
app.use(`${API}/reviews`, reviewsRoutes);
app.use(`${API}/users`, usersRoutes);
app.use(`${API}/tenants`, tenantsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Endpoint not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
});

// Start server
app.listen(config.PORT, () => {
  console.log(`ServiceHub API running on http://localhost:${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
});

export default app;
