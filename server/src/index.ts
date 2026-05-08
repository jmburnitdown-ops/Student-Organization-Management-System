import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { logger } from './utils/logger';
import { swaggerSpec } from './utils/swagger';

import authRoutes from './routes/auth.routes';
import organizationRoutes from './routes/organization.routes';
import membershipRoutes from './routes/membership.routes';
import eventRoutes from './routes/event.routes';
import documentRoutes from './routes/document.routes';
import userRoutes from './routes/user.routes';

const requiredEnv = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const missingEnv = requiredEnv.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variable(s): ${missingEnv.join(', ')}. Check server/.env`);
}

const app = express();
const PORT = process.env.PORT || 3000;

const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const defaultAllowedOrigins = [
  'http://localhost:4200',
  'https://student-organization-management-sys.vercel.app',
  'https://student-organization-management-system.vercel.app',
];

const allowedOrigins = new Set([...configuredOrigins, ...defaultAllowedOrigins]);
const allowedVercelHostPattern = /^student-organization-management-(?:sys|system)(?:-[a-z0-9-]+)?\.vercel\.app$/;

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    return allowedVercelHostPattern.test(hostname);
  } catch {
    return false;
  }
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin) ? origin || true : false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Logging & parsing
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SOMS API Docs',
  customCss: '.swagger-ui .topbar { background: #1a1a2e; }',
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'SOMS API' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/documents', documentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 SOMS API running on port ${PORT}`);
  logger.info(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});

export default app;
