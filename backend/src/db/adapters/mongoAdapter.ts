import mongoose from 'mongoose';
import { IDatabase, QueryPlan } from '../types';
import { config } from '../../configs';
import { DatabaseError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { ERROR_MESSAGES } from '../../utils/constants';

export class MongoAdapter implements IDatabase {
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;
    
    try {
      // Replace localhost with 127.0.0.1 for better DNS resolution
      const uri = config.database.mongo.uri.replace('localhost', '127.0.0.1');
      logger.info(`Attempting to connect to MongoDB: ${uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      });
      
      this.isConnected = true;
      logger.info('MongoDB connected successfully');
      
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw new DatabaseError('MongoDB connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw new DatabaseError('MongoDB disconnection failed');
    }
  }

  async execute(plan: QueryPlan): Promise<{ rows?: any[]; raw?: any }> {
    try {
      const { operation, collection, filter, projection, pipeline, limit, sort } = plan;
      
      if (!collection) {
        throw new DatabaseError(ERROR_MESSAGES.MONGO_REQUIRES_COLLECTION);
      }
      
      const schema = new mongoose.Schema({}, { strict: false });
      const Model = mongoose.models[collection] || mongoose.model(collection, schema);
      
      if (operation === 'find') {
        let query = Model.find(filter || {}, projection || {});
        if (limit) query = query.limit(limit);
        if (sort) query = query.sort(sort);
        const docs = await query.exec();
        return { rows: docs };
      }
      
      if (operation === 'aggregate') {
        if (!pipeline || !Array.isArray(pipeline)) {
          throw new DatabaseError('Aggregate operation requires a valid pipeline');
        }
        const docs = await Model.aggregate(pipeline);
        return { rows: docs };
      }
      
      if (operation === 'count') {
        const count = await Model.countDocuments(filter || {});
        return { rows: [{ count }] };
      }
      
      throw new DatabaseError(`${ERROR_MESSAGES.UNSUPPORTED_OPERATION}: ${operation}`);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      logger.error('MongoDB execution error:', error);
      throw new DatabaseError('MongoDB query execution failed');
    }
  }
}
