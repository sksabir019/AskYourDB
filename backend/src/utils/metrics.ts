import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a Registry
export const register = new Registry();

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'error_type'],
  registers: [register],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'database_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections',
  labelNames: ['database_type'],
  registers: [register],
});

export const dbErrors = new Counter({
  name: 'db_errors_total',
  help: 'Total number of database errors',
  labelNames: ['database_type', 'error_type'],
  registers: [register],
});

// LLM Metrics
export const llmRequestDuration = new Histogram({
  name: 'llm_request_duration_seconds',
  help: 'Duration of LLM API requests in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

export const llmRequestTotal = new Counter({
  name: 'llm_requests_total',
  help: 'Total number of LLM API requests',
  labelNames: ['operation', 'model', 'status'],
  registers: [register],
});

export const llmTokensUsed = new Counter({
  name: 'llm_tokens_used_total',
  help: 'Total number of tokens used in LLM requests',
  labelNames: ['operation', 'model'],
  registers: [register],
});

// Application Metrics
export const appUptime = new Gauge({
  name: 'app_uptime_seconds',
  help: 'Application uptime in seconds',
  registers: [register],
});

export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  registers: [register],
});

// Update uptime metric every 10 seconds
setInterval(() => {
  appUptime.set(process.uptime());
}, 10000);

// Default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register, prefix: 'nodejs_' });
