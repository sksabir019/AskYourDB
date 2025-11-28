import { Router } from 'express';
import { handleQuery, handleStreamQuery } from '../api/controllers/queryController';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.post('/', authMiddleware, handleQuery);
router.post('/stream', authMiddleware, handleStreamQuery);
export default router;
