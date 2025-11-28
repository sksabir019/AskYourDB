import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';
import { QueryHistory } from '../../models/QueryHistory';

export async function saveQueryHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const { question, success, executionTime, rowCount } = req.body;
    
    const newHistory = await QueryHistory.create({
      userId,
      question,
      success: success || false,
      executionTime: executionTime || 0,
      rowCount: rowCount || 0,
    });
    
    logger.info(`Saved query history for user: ${userId}`);
    res.status(201).json({
      success: true,
      message: 'Query history saved successfully',
      data: newHistory,
    });
  } catch (error) {
    logger.error('Save query history error:', error);
    return next(error);
  }
}

export async function getQueryHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    const limit = Number.parseInt(req.query.limit as string, 10) || 50;
    
    const history = await QueryHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    logger.info(`Retrieved ${history.length} history items for user: ${userId}`);
    res.status(200).json(history);
  } catch (error) {
    logger.error('Get query history error:', error);
    return next(error);
  }
}

export async function getAnalytics(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    
    // Use MongoDB aggregation for efficient analytics
    const [stats] = await QueryHistory.aggregate([
      { $match: { userId } },
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                successful: { $sum: { $cond: ['$success', 1, 0] } },
                avgExecutionTime: { $avg: '$executionTime' },
              },
            },
          ],
          today: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                },
              },
            },
            { $count: 'count' },
          ],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                question: 1,
                timestamp: { $toLong: '$createdAt' },
                success: 1,
              },
            },
          ],
        },
      },
    ]);
    
    const overview = stats?.overview[0] || { total: 0, successful: 0, avgExecutionTime: 0 };
    const todayCount = stats?.today[0]?.count || 0;
    const recentQueries = stats?.recent || [];
    
    const analytics = {
      totalQueries: overview.total,
      successfulQueries: overview.successful,
      failedQueries: overview.total - overview.successful,
      successRate: overview.total > 0 ? Math.round((overview.successful / overview.total) * 100) : 0,
      todayQueries: todayCount,
      avgExecutionTime: Math.round(overview.avgExecutionTime || 0),
      recentQueries,
    };
    
    logger.info(`Retrieved analytics for user: ${userId}`);
    res.status(200).json(analytics);
  } catch (error) {
    logger.error('Get analytics error:', error);
    return next(error);
  }
}

export async function clearHistory(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id || 'default';
    await QueryHistory.deleteMany({ userId });
    
    logger.info(`Cleared history for user: ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Query history cleared successfully',
    });
  } catch (error) {
    logger.error('Clear history error:', error);
    return next(error);
  }
}
