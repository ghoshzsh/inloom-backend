import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pino from 'pino';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';

// GraphQL schemas and resolvers
import { shopTypeDefs, shopResolvers, createShopContext } from './graphql/shop/index.js';
import { sellerTypeDefs, sellerResolvers, createSellerContext } from './graphql/seller/index.js';
import { adminTypeDefs, adminResolvers, createAdminContext } from './graphql/admin/index.js';
import { prisma } from './config/database.js';

// Logger
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(morgan('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // Shop GraphQL Server (for customers)
  const shopServer = new ApolloServer({
    typeDefs: shopTypeDefs,
    resolvers: shopResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await shopServer.start();

  app.use(
    '/graphql/shop',
    cors<cors.CorsRequest>({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(shopServer, {
      context: async ({ req }) => {
        try {
          return await createShopContext({ req });
        } catch (err) {
          logger.error(`❌ Error in createShopContext: ${err.message}`);
          throw err;
        }
      },
    })
  );

  // Seller GraphQL Server (for vendors)
  const sellerServer = new ApolloServer({
    typeDefs: sellerTypeDefs,
    resolvers: sellerResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await sellerServer.start();

  app.use(
    '/graphql/seller',
    cors<cors.CorsRequest>({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(sellerServer, {
      context: async ({ req }) => {
        try {
          return await createSellerContext({ req });
        } catch (err) {
          logger.error(`❌ Error in createSellerContext: ${err.message}`);
          throw err;
        }
      },
    })
  );

  // Admin GraphQL Server (for platform administrators)
  const adminServer = new ApolloServer({
    typeDefs: adminTypeDefs,
    resolvers: adminResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.NODE_ENV !== 'production',
  });

  await adminServer.start();

  app.use(
    '/graphql/admin',
    cors<cors.CorsRequest>({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(adminServer, {
      context: async ({ req }) => {
        try {
          return await createAdminContext({ req });
        } catch (err) {
          logger.error(`❌ Error in createAdminContext: ${err.message}`);
          throw err;
        }
      },
    })
  );

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
  });

  const PORT = process.env.PORT || 4000;

  await new Promise<void>((resolve) => 
    httpServer.listen({ port: PORT }, resolve)
  );

  logger.info(`🚀 Server ready at http://localhost:${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`🛍️  Shop GraphQL: http://localhost:${PORT}/graphql/shop`);
  logger.info(`🏪 Seller GraphQL: http://localhost:${PORT}/graphql/seller`);
  logger.info(`👨‍💼 Admin GraphQL: http://localhost:${PORT}/graphql/admin`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    await Promise.all([
      shopServer.stop(),
      sellerServer.stop(),
      adminServer.stop(),
    ]);
    httpServer.close(() => {
      logger.info('HTTP server closed');
      prisma.$disconnect();
      process.exit(0);
    });
  });
}
