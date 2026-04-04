import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import contactsRouter from './contacts.js';
import translateRouter from './translate.js';
import stripeRouter from './stripe.js';
import googleWalletRouter from './google-wallet.js';
import dalleRouter from './dalle.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.use('/auth', authRouter);
  router.use('/contacts', contactsRouter);
  router.use('/translate', translateRouter);
  router.use('/stripe', stripeRouter);
  router.use('/google-wallet', googleWalletRouter);
  router.use('/dalle', dalleRouter);

  return router;
};