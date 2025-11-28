export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const DB_OPERATIONS = {
  FIND: 'find',
  AGGREGATE: 'aggregate',
  RAW_SQL: 'rawSql',
  INSERT: 'insert',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

export const DEFAULT_TABLES = ['users', 'orders', 'products', 'customers'] as const;
export const DEFAULT_COLLECTIONS = ['users', 'orders', 'products', 'customers'] as const;

export const ERROR_MESSAGES = {
  EMPTY_QUESTION: 'Question is required',
  MISSING_AUTH: 'Missing Authorization header',
  INVALID_TOKEN: 'Invalid or expired token',
  FORBIDDEN: 'Insufficient permissions',
  LLM_NO_PLAN: 'LLM did not return a valid plan',
  EMPTY_PLAN: 'Empty query plan received',
  RAW_SQL_NOT_PERMITTED: 'Raw SQL queries are not permitted',
  UNKNOWN_TABLE: 'Unknown table',
  UNKNOWN_COLLECTION: 'Unknown collection',
  DB_NOT_INITIALIZED: 'Database connection not initialized',
  MONGO_REQUIRES_COLLECTION: 'MongoDB operations require a collection name',
  UNSUPPORTED_OPERATION: 'Unsupported database operation',
} as const;
