import { Router } from 'express';
import { getPreferences, updatePreferences } from '../api/controllers/preferencesController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getPreferences);
router.put('/', authMiddleware, updatePreferences);

export default router;
