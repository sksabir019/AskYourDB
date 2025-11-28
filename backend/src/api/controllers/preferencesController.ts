import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { UserPreferences } from '../../models/UserPreferences';

export async function getPreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    
    let preferences = await UserPreferences.findOne({ userId });
    
    // Create default preferences if not exist
    preferences ??= await UserPreferences.create({
      userId,
      theme: 'system',
      language: 'en',
      queriesPerPage: 10,
      autoSave: true,
      notifications: true,
    });
    
    logger.info(`Retrieved preferences for user: ${userId}`);
    res.status(200).json(preferences);
  } catch (error) {
    logger.error('Get preferences error:', error);
    return next(error);
  }
}

export async function updatePreferences(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const updates = req.body;
    
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );
    
    logger.info(`Updated preferences for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: preferences,
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    return next(error);
  }
}
