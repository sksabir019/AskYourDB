import { IDatabase } from './types';
import { MongoAdapter } from './adapters/mongoAdapter';
import { PgAdapter } from './adapters/pgAdapter';
import { config } from '../configs';
import { DatabaseError } from '../utils/errors';
import { logger } from '../utils/logger';

let adapter: IDatabase | null = null;

export async function getAdapter(): Promise<IDatabase> {
  if (adapter) return adapter;
  
  const engine = config.database.engine;
  
  try {
    if (engine === 'mongo') {
      adapter = new MongoAdapter();
    } else if (engine === 'postgres') {
      adapter = new PgAdapter();
    } else {
      throw new DatabaseError(`Unsupported database engine: ${engine}`);
    }
    
    await adapter.connect();
    logger.info(`Database adapter initialized: ${engine}`);
    return adapter;
  } catch (error) {
    logger.error('Failed to initialize database adapter:', error);
    throw new DatabaseError('Database connection failed');
  }
}

export async function disconnectAdapter(): Promise<void> {
  if (adapter) {
    await adapter.disconnect();
    adapter = null;
    logger.info('Database adapter disconnected');
  }
}
