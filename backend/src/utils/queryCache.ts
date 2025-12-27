import { logger } from '../utils/logger';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private defaultTTL: number; // milliseconds

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutes default
  }

  /**
   * Generate cache key from query parameters
   */
  private generateKey(question: string, schemaHint?: any): string {
    const normalized = question.toLowerCase().trim();
    return `${normalized}:${JSON.stringify(schemaHint || {})}`;
  }

  /**
   * Get cached result if available and not expired
   */
  get(question: string, schemaHint?: any): any | null {
    const key = this.generateKey(question, schemaHint);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Expired
      this.cache.delete(key);
      logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    logger.debug(`Cache hit for key: ${key}, age: ${age}ms`);
    return entry.data;
  }

  /**
   * Store result in cache
   */
  set(question: string, data: any, schemaHint?: any, ttl?: number): void {
    const key = this.generateKey(question, schemaHint);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value as string;
      this.cache.delete(oldestKey);
      logger.debug(`Cache full, evicted oldest key: ${oldestKey}`);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });

    logger.debug(`Cached result for key: ${key}`);
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
    };
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.info(`Cache cleanup: removed ${removed} expired entries`);
    }
  }
}

// Singleton instance
export const queryCache = new QueryCache();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  queryCache.cleanup();
}, 10 * 60 * 1000);
