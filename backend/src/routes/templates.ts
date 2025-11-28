import { Router } from 'express';
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} from '../api/controllers/templatesController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, getTemplates);
router.post('/', authMiddleware, createTemplate);
router.put('/:id', authMiddleware, updateTemplate);
router.delete('/:id', authMiddleware, deleteTemplate);

export default router;
