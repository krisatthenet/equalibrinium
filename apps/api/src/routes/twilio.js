import { Router } from 'express';
import logger from '../utils/logger.js';

const router = Router();

// Twilio posts status callbacks as application/x-www-form-urlencoded
router.post('/status', (req, res) => {
  const {
    MessageSid,
    MessageStatus,
    To,
    From,
    ErrorCode,
    ErrorMessage,
    // Verify-specific fields
    AccountSid,
    ServiceSid,
    Channel,
    Status,
  } = req.body;

  const isSms     = !!MessageSid;
  const isVerify  = !!ServiceSid;

  if (isSms) {
    logger.info('Twilio SMS status', {
      sid: MessageSid,
      status: MessageStatus,
      to: To,
      from: From,
      ...(ErrorCode && { errorCode: ErrorCode, errorMessage: ErrorMessage }),
    });
  } else if (isVerify) {
    logger.info('Twilio Verify status', {
      account: AccountSid,
      service: ServiceSid,
      channel: Channel,
      to: To,
      status: Status,
    });
  } else {
    logger.info('Twilio callback received', req.body);
  }

  // Twilio expects a 204 or empty 200 — no body needed
  res.sendStatus(204);
});

export default router;
