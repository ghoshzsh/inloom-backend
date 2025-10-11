import dotenv from "dotenv";
dotenv.config();

import { startServer } from './server.js';
import pino from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

(async () => {
  try {
    await startServer();
  } catch (error) {
    logger.error(error, '❌ Failed to start server');
    process.exit(1);
  }
})();
