import { config } from './configs';
import { logger } from './utils/logger';
import app from './app';
import { getAdapter, disconnectAdapter } from './db/factory';

const PORT = config.server.port;

// Initialize database connection before starting server
async function startServer() {
  try {
    // Connect to database
    await getAdapter();
    logger.info('Database connection established');
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`AskYourDB backend listening on port ${PORT} in ${config.server.env} mode`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);
      server.close(async () => {
        logger.info('HTTP server closed');
        await disconnectAdapter();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      throw reason;
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
