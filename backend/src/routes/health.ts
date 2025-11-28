import { Router, Request, Response } from 'express';
import { getAdapter } from '../db/factory';
import { logger } from '../utils/logger';
import { config } from '../configs';

const router = Router();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  database?: {
    connected: boolean;
    type: string;
  };
  services?: {
    llm: boolean;
  };
  error?: string;
}

router.get('/', async (_req: Request, res: Response) => {
  const healthStatus: HealthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
  };

  try {
    // Check database connection
    await getAdapter();
    healthStatus.database = {
      connected: true,
      type: config.database.engine,
    };

    // Check LLM service availability
    const llmAvailable = config.llm.provider === 'groq' 
      ? !!config.llm.groq.apiKey 
      : !!config.llm.openai.apiKey;
    healthStatus.services = {
      llm: llmAvailable,
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed:', error);
    healthStatus.status = 'error';
    healthStatus.error = error instanceof Error ? error.message : 'Unknown error';
    healthStatus.database = {
      connected: false,
      type: config.database.engine,
    };
    res.status(503).json(healthStatus);
  }
});

// Liveness probe (simpler check)
router.get('/live', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (checks dependencies)
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    await getAdapter();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export { router as healthCheck };
