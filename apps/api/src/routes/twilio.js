import { Router } from 'express';
import PocketBase from 'pocketbase';
import { requirePbAuth } from '../middleware/pbAuth.js';
import logger from '../utils/logger.js';

const router = Router();
const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const ACCOUNT_SID        = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN         = process.env.TWILIO_AUTH_TOKEN;

function normalisePhone(raw) {
  let n = (raw || '').trim().replace(/\s+/g, '');
  if (n.startsWith('8') && n.length === 9) n = '+370' + n.slice(1);
  if (!n.startsWith('+')) n = '+' + n;
  return n;
}

async function twilioVerify(path, body) {
  const url  = `https://verify.twilio.com/v2/Services/${VERIFY_SERVICE_SID}/${path}`;
  const creds = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  const res  = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body).toString(),
  });
  return { status: res.status, data: await res.json() };
}

// POST /twilio/verify/send — send OTP to phone number
router.post('/verify/send', requirePbAuth, async (req, res) => {
  if (!VERIFY_SERVICE_SID || !ACCOUNT_SID || !AUTH_TOKEN) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  const phone = normalisePhone(req.body.phone);
  if (!phone || phone.length < 8) {
    return res.status(400).json({ error: 'Valid phone number required' });
  }

  try {
    const { status, data } = await twilioVerify('Verifications', { To: phone, Channel: 'sms' });
    if (status >= 400) {
      logger.warn('Twilio send failed', { phone, code: data.code, message: data.message });
      return res.status(status).json({ error: data.message || 'Failed to send verification' });
    }
    logger.info('Verify OTP sent', { to: phone, sid: data.sid });
    res.json({ ok: true, status: data.status });
  } catch (err) {
    logger.error('verify send error', { error: err.message });
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// POST /twilio/verify/check — confirm OTP code
router.post('/verify/check', requirePbAuth, async (req, res) => {
  if (!VERIFY_SERVICE_SID || !ACCOUNT_SID || !AUTH_TOKEN) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  const phone = normalisePhone(req.body.phone);
  const code  = (req.body.code || '').trim();

  if (!phone || !code) {
    return res.status(400).json({ error: 'phone and code are required' });
  }

  try {
    const { status, data } = await twilioVerify('VerificationCheck', { To: phone, Code: code });
    if (status >= 400 || data.status !== 'approved') {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark phone as verified on the PocketBase user record
    const pb = new PocketBase(PB_URL);
    await pb.collection('users').update(req.pbUser.id, {
      phone: phone,
      phoneVerified: true,
    });

    logger.info('Phone verified', { userId: req.pbUser.id, phone });
    res.json({ ok: true });
  } catch (err) {
    logger.error('verify check error', { error: err.message });
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /twilio/status — Twilio delivery status callback
router.post('/status', (req, res) => {
  const { MessageSid, MessageStatus, To, From, ErrorCode, ErrorMessage,
          AccountSid, ServiceSid, Channel, Status } = req.body;

  if (MessageSid) {
    logger.info('Twilio SMS status', {
      sid: MessageSid, status: MessageStatus, to: To, from: From,
      ...(ErrorCode && { errorCode: ErrorCode, errorMessage: ErrorMessage }),
    });
  } else if (ServiceSid) {
    logger.info('Twilio Verify status', { account: AccountSid, service: ServiceSid, channel: Channel, to: To, status: Status });
  } else {
    logger.info('Twilio callback received', req.body);
  }

  res.sendStatus(204);
});

export default router;
