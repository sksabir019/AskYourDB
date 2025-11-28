import { Router } from 'express';
import { 
  getQueryHistory, 
  saveQueryHistory, 
  getAnalytics,
  clearHistory 
} from '../api/controllers/historyController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getQueryHistory);
router.post('/', authMiddleware, saveQueryHistory);
router.get('/analytics', authMiddleware, getAnalytics);
router.delete('/', authMiddleware, clearHistory);

export default router;
