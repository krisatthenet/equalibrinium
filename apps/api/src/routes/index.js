import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import contactsRouter from './contacts.js';
import stripeRouter from './stripe.js';
import pushRouter from './push.js';
import referralsRouter from './referrals.js';
import recaptchaRouter from './recaptcha.js';
import twilioRouter from './twilio.js';
import reachRouter from './reach.js';
import chatRouter from './chat.js';
import ticketsRouter from './tickets.js';
import reviewsRouter from './reviews.js';
import twitchRouter from './twitch.js';
import complianceRouter from './compliance.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.get('/api/health', healthCheck); // Railway dashboard healthcheck alias
  router.use('/auth', authRouter);
  router.use('/contacts', contactsRouter);
  router.use('/stripe', stripeRouter);
  router.use('/push', pushRouter);
  router.use('/referrals', referralsRouter);
  router.use('/recaptcha', recaptchaRouter);
  router.use('/twilio', twilioRouter);
  router.use('/reach', reachRouter);
  router.use('/chat', chatRouter);
  router.use('/tickets', ticketsRouter);
  router.use('/reviews', reviewsRouter);
  router.use('/twitch', twitchRouter);
  router.use('/compliance', complianceRouter);

  return router;
};