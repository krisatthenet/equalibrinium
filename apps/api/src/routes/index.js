import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import contactsRouter from './contacts.js';
import stripeRouter from './stripe.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.use('/auth', authRouter);
  router.use('/contacts', contactsRouter);
  router.use('/stripe', stripeRouter);

  return router;
};