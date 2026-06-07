import express from 'express';
import PocketBase from 'pocketbase';
import { getPocketBase } from '../utils/pocketbase.js';
import { verifyRecaptchaToken } from '../utils/recaptcha.js';
import { requirePbAuth } from '../middleware/pbAuth.js';
import logger from '../utils/logger.js';

const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

// Superuser-authenticated client — needed to read fields the public/owner API
// hides (email via emailVisibility, and phone/location once they're marked hidden
// by migration 1785800000_hide_sensitive_user_fields).
async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD,
  );
  return pb;
}

const router = express.Router();

/**
 * POST /contacts
 * Create a contact message with reCaptcha validation
 * Request body: { name, email, subject, message, recaptchaToken, category? }
 * Response: { message, contactId, name, email, recaptchaScore }
 */
router.post('/', async (req, res) => {
  const { name, email, subject, message, recaptchaToken, category } = req.body;

  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      error: 'Name, email, subject, and message are required',
    });
  }

  if (!recaptchaToken) {
    return res.status(400).json({
      error: 'reCaptcha token is required',
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: 'Invalid email address',
    });
  }

  // Validate category if provided
  const validCategories = ['General', 'Support', 'Partnership', 'Other'];
  if (category && !validCategories.includes(category)) {
    return res.status(400).json({
      error: `category must be one of: ${validCategories.join(', ')}`,
    });
  }

  logger.info(`Contact message submission attempt from ${email}`);

  // Verify reCaptcha token - throws if verification fails internally
  const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'contact');

  if (!recaptchaResult.valid) {
    return res.status(400).json({
      error: 'Security verification failed. Please try again.',
    });
  }

  // Save contact to PocketBase
  const pb = getPocketBase();

  const contactData = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
    ...(category && { category }),
  };

  const record = await pb.collection('contacts').create(contactData);

  logger.info(`Contact message saved (id: ${record.id}) from ${email} (reCaptcha score: ${recaptchaResult.score})`);

  res.status(201).json({
    message: 'Contact message received successfully',
    contactId: record.id,
    name: record.name,
    email: record.email,
    recaptchaScore: recaptchaResult.score,
  });
});

/**
 * GET /contacts/users/:id
 * Return another user's contact details (email, phone, location) ONLY when the
 * requester and the target are matched parties on a live job — i.e. there is an
 * accepted bid on an "In Progress" ticket linking them as {client, contractor}.
 *
 * This is the secured replacement for the unauthenticated /stripe/user-email
 * route (which leaks any user's email+phone by id) and the only sanctioned way to
 * read phone/location once those fields are hidden on the users collection.
 *
 * Requires a valid bearer token (requirePbAuth). Returns 403 if the two users
 * are not matched, so it cannot be used to scrape arbitrary contact info.
 */
router.get('/users/:id', requirePbAuth, async (req, res) => {
  const requesterId = req.pbUser.id;
  const targetId = req.params.id;

  if (!targetId) {
    return res.status(400).json({ error: 'user id is required' });
  }
  // Reading your own contact info needs no special route — use the authed record.
  if (targetId === requesterId) {
    return res.status(400).json({ error: 'cannot request your own contact details here' });
  }

  try {
    const pb = await adminPb();

    // Quote-strip ids before interpolating into the filter (ids are PB-generated
    // [a-z0-9], so this is belt-and-suspenders against filter injection).
    const reqId = requesterId.replace(/["\\]/g, '');
    const tgtId = targetId.replace(/["\\]/g, '');

    // masterId on a bid is the contractor; ticket.clientId is the client. A match
    // exists if an accepted bid sits on an In-Progress ticket pairing the two.
    const acceptedBids = await pb.collection('bids').getFullList({
      filter: `status = "accepted" && (masterId = "${reqId}" || masterId = "${tgtId}")`,
    });

    let matched = false;
    for (const bid of acceptedBids) {
      if (!bid.ticketId) continue;
      let ticket;
      try {
        ticket = await pb.collection('auction_tickets').getOne(bid.ticketId);
      } catch {
        continue; // ticket missing/deleted — not a valid match
      }
      if (ticket.status !== 'In Progress') continue;

      const contractorId = bid.masterId;
      const clientId = ticket.clientId;
      const isPair =
        (contractorId === requesterId && clientId === targetId) ||
        (contractorId === targetId && clientId === requesterId);
      if (isPair) {
        matched = true;
        break;
      }
    }

    if (!matched) {
      logger.info(`Contact lookup denied: ${requesterId} -> ${targetId} (no active match)`);
      return res.status(403).json({ error: 'Not authorized to view this user\'s contact details' });
    }

    const user = await pb.collection('users').getOne(targetId);
    logger.info(`Contact lookup granted: ${requesterId} -> ${targetId}`);
    res.json({
      id: user.id,
      name: user.name || '',
      email: user.email || null,
      phone: user.phone || null,
      latitude: user.latitude || null,
      longitude: user.longitude || null,
      location: user.location || null,
    });
  } catch (err) {
    logger.error('contact lookup error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch contact details' });
  }
});

export default router;
