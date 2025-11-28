import { Router } from 'express';
import { generateApiKey, getApiKeys, deleteApiKey } from '../api/controllers/apiKeysController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getApiKeys);
router.post('/', authMiddleware, generateApiKey);
router.delete('/:id', authMiddleware, deleteApiKey);

export default router;
