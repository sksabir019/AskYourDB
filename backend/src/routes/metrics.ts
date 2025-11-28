import { Router, Request, Response } from 'express';
import { register } from '../utils/metrics';

const router = Router();

// Prometheus metrics endpoint
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

export { router as metricsRouter };
