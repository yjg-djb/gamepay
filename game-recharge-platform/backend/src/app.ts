import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { config } from './config';
import { logger } from './logger';
import { healthRouter } from './routes/health';
import { meRouter } from './routes/me';
import { gamesRouter } from './routes/games';
import { skusRouter } from './routes/skus';
import { ordersRouter } from './routes/orders';
import { merchantRouter } from './routes/merchant';
import { merchantApplyRouter } from './routes/merchantApply';
import { adminMerchantsRouter } from './routes/adminMerchants';
import { usersRouter } from './routes/users';
import { stripePaymentsRouter } from './routes/paymentsStripe';
import { paypalPaymentsRouter } from './routes/paymentsPaypal';
import { notFound, errorHandler } from './middleware/error';

export function createApp() {
  const app = express();

  app.use(pinoHttp({ logger }));
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow localhost on ports 5173 and 5174 for development
        if (!origin || origin.startsWith('http://localhost:517') || origin === config.webOrigin) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Demo-Role', 'X-Demo-Merchant-Id'],
    })
  );

  // Stripe webhooks need raw body (must be registered before json body parser)
  app.use('/api/webhooks/stripe', express.raw({ type: '*/*' }));
  app.use(express.json({ limit: '1mb' }));

  app.use(healthRouter);

  app.use('/api', meRouter);
  app.use('/api', gamesRouter);
  app.use('/api', skusRouter);
  app.use('/api', ordersRouter);
  app.use('/api', merchantRouter);
  app.use('/api', merchantApplyRouter);
  app.use('/api', adminMerchantsRouter);
  app.use('/api', usersRouter);
  app.use('/api', stripePaymentsRouter);
  app.use('/api', paypalPaymentsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}


