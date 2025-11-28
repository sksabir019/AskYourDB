export type QueryPlan = {
  operation: 'find'|'aggregate'|'count'|'rawSql'|'insert'|'update'|'delete';
  collection?: string; // mongodb
  table?: string;      // postgres
  filter?: any;
  projection?: any;
  pipeline?: any[];
  sql?: string;
  params?: any[];
  limit?: number;
  sort?: any;
}

export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  execute(plan: QueryPlan): Promise<{ rows?: any[], raw?: any }>;
  explain?(plan: QueryPlan): Promise<any>;
}
