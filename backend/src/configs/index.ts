import dotenv from 'dotenv';
dotenv.config();

interface Config {
  server: {
    port: number;
    env: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  database: {
    engine: 'mongo' | 'postgres';
    mongo: {
      uri: string;
    };
    postgres: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
  llm: {
    provider: 'openai' | 'groq';
    openai: {
      apiKey: string;
      model: string;
    };
    groq: {
      apiKey: string;
      model: string;
    };
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  query: {
    maxLimit: number;
  };
}

class ConfigValidator {
  private static instance: ConfigValidator;
  private readonly config: Config;

  private constructor() {
    this.config = this.loadConfig();
    this.validate();
  }

  public static getInstance(): ConfigValidator {
    if (!ConfigValidator.instance) {
      ConfigValidator.instance = new ConfigValidator();
    }
    return ConfigValidator.instance;
  }

  private loadConfig(): Config {
    return {
      server: {
        port: Number(process.env.PORT) || 4000,
        env: process.env.NODE_ENV || 'development',
      },
      jwt: {
        secret: process.env.JWT_SECRET || '',
        expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      },
      database: {
        engine: (process.env.DB_ENGINE as 'mongo' | 'postgres') || 'mongo',
        mongo: {
          uri: process.env.MONGO_URI || 'mongodb://localhost:27017/askyourdb',
        },
        postgres: {
          host: process.env.PG_HOST || 'localhost',
          port: Number(process.env.PG_PORT) || 5432,
          user: process.env.PG_USER || 'postgres',
          password: process.env.PG_PASSWORD || 'postgres',
          database: process.env.PG_DB || 'askyourdb',
        },
      },
      llm: {
        provider: (process.env.LLM_PROVIDER as 'openai' | 'groq') || 'openai',
        openai: {
          apiKey: process.env.OPENAI_API_KEY || '',
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        },
        groq: {
          apiKey: process.env.GROQ_API_KEY || '',
          model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        },
      },
      rateLimit: {
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
        max: Number(process.env.RATE_LIMIT_MAX) || 60,
      },
      query: {
        maxLimit: Number(process.env.MAX_QUERY_LIMIT) || 100,
      },
    };
  }

  private validate(): void {
    const errors: string[] = [];

    if (!this.config.jwt.secret && this.config.server.env === 'production') {
      errors.push('JWT_SECRET is required in production');
    }

    // Validate API keys for current provider (in all environments)
    if (this.config.llm.provider === 'openai' && !this.config.llm.openai.apiKey) {
      errors.push('OPENAI_API_KEY is required when using OpenAI. Please add it to your .env file.');
    }
    if (this.config.llm.provider === 'groq' && !this.config.llm.groq.apiKey) {
      errors.push('GROQ_API_KEY is required when using Groq. Please add it to your .env file.');
    }

    if (this.config.database.engine === 'mongo' && !this.config.database.mongo.uri) {
      errors.push('MONGO_URI is required when using MongoDB');
    }

    if (this.config.database.engine === 'postgres' && !this.config.database.postgres.host) {
      errors.push('PG_HOST is required when using PostgreSQL');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  public get(): Config {
    return this.config;
  }
}

export const config = ConfigValidator.getInstance().get();
