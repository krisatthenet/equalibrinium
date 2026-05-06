import express from 'express';
import routes from '../routes/index.js';
import { errorMiddleware } from '../middleware/index.js';

export function createApp() {
  const app = express();
  app.use('/stripe/webhook', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/', routes());
  app.use(errorMiddleware);
  app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
  return app;
}
