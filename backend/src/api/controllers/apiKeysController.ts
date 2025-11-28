import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { randomBytes } from 'node:crypto';
import { ApiKey } from '../../models/ApiKey';

export async function generateApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'API key name is required',
      });
    }
    
    // Check API key limit
    const existingKeys = await ApiKey.countDocuments({ userId });
    if (existingKeys >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum API key limit reached (10 keys)',
      });
    }
    
    // Generate secure random API key
    const keyPrefix = 'ask_';
    const randomKey = randomBytes(32).toString('hex');
    const fullKey = `${keyPrefix}${randomKey}`;
    
    const newApiKey = await ApiKey.create({
      userId,
      name,
      key: fullKey,
    });
    
    logger.info(`Generated API key for user: ${userId}, name: ${name}`);
    
    // Return full key only on creation (user won't see it again)
    const response = newApiKey.toObject();
    response.key = fullKey; // Override the masked version
    
    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: response,
    });
  } catch (error) {
    logger.error('Generate API key error:', error);
    return next(error);
  }
}

export async function getApiKeys(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const keys = await ApiKey.find({ userId }).sort({ createdAt: -1 });
    
    logger.info(`Retrieved ${keys.length} API keys for user: ${userId}`);
    res.status(200).json(keys); // Keys are automatically masked by the model
  } catch (error) {
    logger.error('Get API keys error:', error);
    return next(error);
  }
}

export async function deleteApiKey(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const { id } = req.params;
    
    const result = await ApiKey.deleteOne({ _id: id, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'API key not found',
      });
    }
    
    logger.info(`Deleted API key: ${id} for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'API key deleted successfully',
    });
  } catch (error) {
    logger.error('Delete API key error:', error);
    return next(error);
  }
}
