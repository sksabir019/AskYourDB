import { IDatabase } from '../db/types';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

export interface SchemaInfo {
  tables?: string[];
  collections?: string[];
  columns?: Record<string, string[]>;
}

/**
 * Introspect database schema
 * For MongoDB: Get collection names
 * For PostgreSQL: Get table and column information
 */
export async function introspectSchema(db: IDatabase): Promise<SchemaInfo> {
  try {
    const dbType = process.env.DB_ENGINE;

    if (dbType === 'mongo') {
      return await introspectMongoSchema(db);
    } else if (dbType === 'postgres') {
      return await introspectPostgresSchema(db);
    }

    throw new DatabaseError('Unsupported database type for introspection');
  } catch (error) {
    logger.error('Schema introspection failed:', error);
    throw new DatabaseError('Failed to introspect database schema');
  }
}

async function introspectMongoSchema(_db: IDatabase): Promise<SchemaInfo> {
  try {
    // MongoDB doesn't have built-in schema introspection via our adapter
    // We would need to use mongoose.connection.db.listCollections()
    // For now, fallback to manual configuration
    logger.warn('MongoDB schema introspection not fully implemented, using defaults');
    return {
      collections: ['users', 'orders', 'products'], // Fallback to defaults
    };
  } catch (error) {
    logger.error('MongoDB introspection error:', error);
    return {
      collections: ['users', 'orders', 'products'],
    };
  }
}

async function introspectPostgresSchema(db: IDatabase): Promise<SchemaInfo> {
  try {
    // Query PostgreSQL information_schema
    const tablesResult = await db.execute({
      operation: 'find',
      table: 'information_schema.tables',
      filter: { table_schema: 'public' },
    });

    const tables = tablesResult.rows?.map((row: any) => row.table_name) || [];
    const columns: Record<string, string[]> = {};

    // Get columns for each table
    for (const table of tables) {
      const columnsResult = await db.execute({
        operation: 'find',
        table: 'information_schema.columns',
        filter: { table_name: table, table_schema: 'public' },
      });

      columns[table] = columnsResult.rows?.map((row: any) => row.column_name) || [];
    }

    return {
      tables,
      columns,
    };
  } catch (error) {
    logger.error('PostgreSQL introspection error:', error);
    return {
      tables: ['users', 'orders', 'products'], // Fallback to defaults
    };
  }
}

/**
 * Cache for schema information
 * Refreshes every 5 minutes
 */
class SchemaCache {
  private cache: SchemaInfo | null = null;
  private lastRefresh: number = 0;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  async getSchema(db: IDatabase): Promise<SchemaInfo> {
    const now = Date.now();

    if (this.cache && now - this.lastRefresh < this.TTL) {
      return this.cache;
    }

    this.cache = await introspectSchema(db);
    this.lastRefresh = now;
    logger.info('Schema cache refreshed');

    return this.cache;
  }

  invalidate() {
    this.cache = null;
    this.lastRefresh = 0;
    logger.info('Schema cache invalidated');
  }
}

export const schemaCache = new SchemaCache();
