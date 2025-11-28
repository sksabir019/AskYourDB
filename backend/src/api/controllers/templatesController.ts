import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { QueryTemplate } from '../../models/QueryTemplate';

export async function getTemplates(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const templates = await QueryTemplate.find({ userId }).sort({ createdAt: -1 });
    
    logger.info(`Retrieved ${templates.length} templates for user: ${userId}`);
    res.status(200).json(templates);
  } catch (error) {
    logger.error('Get templates error:', error);
    return next(error);
  }
}

export async function createTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const { name, query, category, isFavorite } = req.body;
    
    if (!name || !query) {
      return res.status(400).json({
        success: false,
        message: 'Name and query are required',
      });
    }
    
    const template = await QueryTemplate.create({
      userId,
      name,
      query,
      category,
      isFavorite: isFavorite || false,
    });
    
    logger.info(`Created template for user: ${userId}, template: ${template._id}`);
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Create template error:', error);
    return next(error);
  }
}

export async function updateTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const { id } = req.params;
    const updates = req.body;
    
    const template = await QueryTemplate.findOneAndUpdate(
      { _id: id, userId }, // Ensure user owns this template
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    logger.info(`Updated template: ${id} for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  } catch (error) {
    logger.error('Update template error:', error);
    return next(error);
  }
}

export async function deleteTemplate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const { id } = req.params;
    
    const result = await QueryTemplate.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }
    
    logger.info(`Deleted template: ${id} for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    logger.error('Delete template error:', error);
    return next(error);
  }
}
