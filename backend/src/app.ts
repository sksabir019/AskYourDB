import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import { json } from 'body-parser';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import queryRouter from './routes/query';
import preferencesRouter from './routes/preferences';
import templatesRouter from './routes/templates';
import historyRouter from './routes/history';
import apiKeysRouter from './routes/apiKeys';
import { requestLogger } from './middleware/requestLogger';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import rateLimit from 'express-rate-limit';
import { config } from './configs';
import { healthCheck } from './routes/health';
import { metricsRouter } from './routes/metrics';
import { NotFoundError } from './utils/errors';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Body parser
app.use(json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Security middleware
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP parameter pollution

// Metrics middleware (before routes)
app.use(metricsMiddleware);

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', limiter);

// Disable X-Powered-By header
app.disable('x-powered-by');

// Routes
app.use('/health', healthCheck);
app.use('/metrics', metricsRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/query', queryRouter);
app.use('/api/v1/preferences', preferencesRouter);
app.use('/api/v1/templates', templatesRouter);
app.use('/api/v1/history', historyRouter);
app.use('/api/v1/api-keys', apiKeysRouter);

// 404 handler
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.url} not found`));
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
