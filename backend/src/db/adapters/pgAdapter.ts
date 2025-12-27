// @ts-nocheck
import Knex from 'knex';
import { IDatabase, QueryPlan } from '../types';
import { config } from '../../configs';
import { DatabaseError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { ERROR_MESSAGES } from '../../utils/constants';

export class PgAdapter implements IDatabase {
  private knex: ReturnType<typeof Knex> | null = null;

  async connect(): Promise<void> {
    if (this.knex) return;
    
    try {
      this.knex = Knex({
        client: 'pg',
        connection: {
          host: config.database.postgres.host,
          port: config.database.postgres.port,
          user: config.database.postgres.user,
          password: config.database.postgres.password,
          database: config.database.postgres.database,
        },
        pool: {
          min: 2,
          max: 10,
          acquireTimeoutMillis: 30000,
          idleTimeoutMillis: 30000,
        },
        acquireConnectionTimeout: 10000,
      });
      
      // Test connection
      await this.knex.raw('SELECT 1');
      logger.info('PostgreSQL connected successfully');
    } catch (error) {
      logger.error('Failed to connect to PostgreSQL:', error);
      throw new DatabaseError('PostgreSQL connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.knex) return;
    
    try {
      await this.knex.destroy();
      this.knex = null;
      logger.info('PostgreSQL disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from PostgreSQL:', error);
      throw new DatabaseError('PostgreSQL disconnection failed');
    }
  }

  /**
   * Convert MongoDB-style filter to Knex query builder conditions
   */
  private applyFilter(query: Knex.QueryBuilder, filter: any): Knex.QueryBuilder {
    if (!filter || Object.keys(filter).length === 0) {
      return query;
    }

    for (const [key, value] of Object.entries(filter)) {
      if (value === null) {
        query = query.whereNull(key);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle MongoDB-style operators
        for (const [op, opValue] of Object.entries(value as Record<string, any>)) {
          switch (op) {
            case '$eq':
              query = query.where(key, '=', opValue);
              break;
            case '$ne':
              query = query.where(key, '!=', opValue);
              break;
            case '$gt':
              query = query.where(key, '>', opValue);
              break;
            case '$gte':
              query = query.where(key, '>=', opValue);
              break;
            case '$lt':
              query = query.where(key, '<', opValue);
              break;
            case '$lte':
              query = query.where(key, '<=', opValue);
              break;
            case '$in':
              query = query.whereIn(key, opValue as any[]);
              break;
            case '$nin':
              query = query.whereNotIn(key, opValue as any[]);
              break;
            case '$like':
            case '$regex':
              query = query.where(key, 'ILIKE', `%${opValue}%`);
              break;
            default:
              logger.warn(`Unknown filter operator: ${op}`);
          }
        }
      } else {
        // Simple equality
        query = query.where(key, '=', value);
      }
    }

    return query;
  }

  /**
   * Apply sort to query builder
   */
  private applySort(query: Knex.QueryBuilder, sort: any): Knex.QueryBuilder {
    if (!sort || Object.keys(sort).length === 0) {
      return query;
    }

    for (const [key, direction] of Object.entries(sort)) {
      const order = direction === -1 || direction === 'desc' ? 'desc' : 'asc';
      query = query.orderBy(key, order);
    }

    return query;
  }

  async execute(plan: QueryPlan): Promise<{ rows?: any[]; raw?: any }> {
    if (!this.knex) {
      throw new DatabaseError(ERROR_MESSAGES.DB_NOT_INITIALIZED);
    }

    // Use table or collection (for compatibility with MongoDB-style plans)
    const tableName = plan.table || plan.collection;
    
    try {
      const { operation } = plan;

      if (operation === 'rawSql' && plan.sql) {
        // Raw SQL is disabled for security
        throw new DatabaseError(ERROR_MESSAGES.RAW_SQL_NOT_PERMITTED);
      }
      
      if (operation === 'find') {
        if (!tableName) {
          throw new DatabaseError('Table name is required for find operation');
        }
        
        let query = this.knex.select('*').from(tableName);
        
        // Apply filter
        query = this.applyFilter(query, plan.filter);
        
        // Apply sort
        query = this.applySort(query, plan.sort);
        
        // Apply limit
        query = query.limit(plan.limit || 100);
        
        // Apply projection (select specific columns)
        if (plan.projection && Object.keys(plan.projection).length > 0) {
          const columns = Object.entries(plan.projection)
            .filter(([_, include]) => include === 1 || include === true)
            .map(([col]) => col);
          if (columns.length > 0) {
            query = this.knex.select(columns).from(tableName);
            query = this.applyFilter(query, plan.filter);
            query = this.applySort(query, plan.sort);
            query = query.limit(plan.limit || 100);
          }
        }
        
        query = query.timeout(30000);
        const rows = await query;
        return { rows };
      }

      if (operation === 'count') {
        if (!tableName) {
          throw new DatabaseError('Table name is required for count operation');
        }

        let query = this.knex(tableName);
        query = this.applyFilter(query, plan.filter);
        const result = await query.count('* as count').first();
        const count = Number(result?.count || 0);
        
        return { rows: [{ count }], raw: { count } };
      }

      if (operation === 'aggregate') {
        if (!tableName) {
          throw new DatabaseError('Table name is required for aggregate operation');
        }

        // Handle simple aggregation pipelines
        // This is a simplified translation - complex MongoDB aggregations may need custom handling
        if (plan.pipeline && plan.pipeline.length > 0) {
          let query = this.knex(tableName);
          
          for (const stage of plan.pipeline) {
            if (stage.$match) {
              query = this.applyFilter(query, stage.$match);
            }
            if (stage.$group) {
              const groupBy = stage.$group._id;
              const aggregations: string[] = [];
              
              for (const [key, value] of Object.entries(stage.$group)) {
                if (key === '_id') continue;
                
                if (typeof value === 'object') {
                  const aggOp = Object.keys(value as object)[0];
                  const aggField = (value as any)[aggOp];
                  
                  switch (aggOp) {
                    case '$sum':
                      if (aggField === 1) {
                        aggregations.push(`COUNT(*) as ${key}`);
                      } else {
                        aggregations.push(`SUM(${aggField.replace('$', '')}) as ${key}`);
                      }
                      break;
                    case '$avg':
                      aggregations.push(`AVG(${aggField.replace('$', '')}) as ${key}`);
                      break;
                    case '$min':
                      aggregations.push(`MIN(${aggField.replace('$', '')}) as ${key}`);
                      break;
                    case '$max':
                      aggregations.push(`MAX(${aggField.replace('$', '')}) as ${key}`);
                      break;
                    case '$count':
                      aggregations.push(`COUNT(*) as ${key}`);
                      break;
                  }
                }
              }
              
              if (groupBy && groupBy !== null) {
                const groupField = typeof groupBy === 'string' ? groupBy.replace('$', '') : null;
                if (groupField) {
                  query = this.knex.raw(
                    `SELECT ${groupField} as _id, ${aggregations.join(', ')} FROM ${tableName} GROUP BY ${groupField}`
                  ) as any;
                }
              } else {
                query = this.knex.raw(
                  `SELECT ${aggregations.join(', ')} FROM ${tableName}`
                ) as any;
              }
            }
            if (stage.$sort) {
              // For raw queries, sort is handled differently
              // This simplified version doesn't handle all cases
            }
            if (stage.$limit) {
              query = query.limit(stage.$limit);
            }
          }
          
          const rows = await query;
          return { rows: Array.isArray(rows) ? rows : [rows] };
        }
        
        throw new DatabaseError('Aggregate operation requires a pipeline');
      }
      
      throw new DatabaseError(`${ERROR_MESSAGES.UNSUPPORTED_OPERATION}: ${operation}`);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      logger.error('PostgreSQL execution error:', error);
      throw new DatabaseError('PostgreSQL query execution failed');
    }
  }
}
