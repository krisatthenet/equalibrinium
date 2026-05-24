import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import PocketBase from 'pocketbase';
import logger from '../utils/logger.js';

const router = express.Router();
const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

const SYSTEM_PROMPT = `You are a friendly customer support assistant for WorkBee (workbee.space) — a marketplace connecting clients with skilled contractors for home services (plumbing, electrical, cleaning, renovation, etc.) in Lithuania and nearby regions.

You help visitors with:
- How to register as a client or contractor
- How to post a job / create a service request ticket
- How to find and book a contractor
- How slot booking and availability works
- Subscription plans (Free, Pro, Business)
- Payment and billing questions
- How reviews and ratings work
- General platform navigation

Guidelines:
- Be warm, concise, and helpful. Match the user's language (English, Lithuanian, Russian, Polish, or Ukrainian).
- Never make up specific prices, policies, or user data.
- If a question involves a specific account, payment dispute, technical bug, or anything you cannot answer from general knowledge, set escalate to true.
- Keep replies under 120 words unless more detail is clearly needed.

Always respond as JSON in this exact shape:
{ "reply": "<your response>", "escalate": false }

Set escalate: true when: account-specific issues, payment problems, bugs, complaints, or anything requiring a human to look up real data.`;

async function adminPb() {
  const pb = new PocketBase(PB_URL);
  await pb.collection('_superusers').authWithPassword(
    process.env.POCKETBASE_ADMIN_EMAIL,
    process.env.POCKETBASE_ADMIN_PASSWORD
  );
  return pb;
}

// POST /chat/message
router.post('/message', async (req, res) => {
  const { message, history = [], name, email } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'message required' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'AI not configured' });

  try {
    const client = new Anthropic({ apiKey });

    // Build conversation history (max last 10 turns to stay within context)
    const messages = [
      ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message.trim() },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    });

    const raw = response.content[0]?.text ?? '{"reply":"Sorry, I could not process that.","escalate":false}';

    let parsed;
    try {
      // Claude should return JSON; extract it even if there's extra text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: raw, escalate: false };
    } catch {
      parsed = { reply: raw, escalate: false };
    }

    // If escalating, create a CS ticket in PocketBase
    if (parsed.escalate) {
      try {
        const pb = await adminPb();
        await pb.collection('cs_tickets').create({
          name:    name || 'Widget visitor',
          email:   email || '',
          subject: message.slice(0, 120),
          message: `[AI escalation]\n\nUser message: ${message}\n\nConversation history:\n${history.map(h => `${h.role}: ${h.content}`).join('\n')}`,
          status:  'open',
          priority:'normal',
          source:  'widget',
        });
        logger.info('CS ticket created from chat escalation');
      } catch (err) {
        logger.error('Failed to create CS ticket', 'error', err.message);
      }
    }

    res.json({ reply: parsed.reply, escalate: parsed.escalate ?? false });
  } catch (err) {
    logger.error('Chat error', 'error', err.message);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

export default router;
