import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

const CHANNEL = 'W0RKBEE';

// In-memory token cache — Twitch app tokens last ~60 days
let _token = null;
let _tokenExpiry = 0;

async function getAppToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type:    'client_credentials',
    }),
  });

  if (!res.ok) throw new Error(`Twitch token fetch failed: ${res.status}`);
  const data = await res.json();
  _token = data.access_token;
  _tokenExpiry = Date.now() + (data.expires_in - 300) * 1000; // refresh 5 min early
  return _token;
}

// GET /twitch/status
// Returns live status, viewer count and stream title for the W0RKBEE channel.
router.get('/status', async (_req, res) => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.json({ live: false, configured: false });
  }

  try {
    const token = await getAppToken();

    const streamRes = await fetch(
      `https://api.twitch.tv/helix/streams?user_login=${CHANNEL}`,
      { headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}` } },
    );
    if (!streamRes.ok) throw new Error(`Helix streams: ${streamRes.status}`);
    const { data } = await streamRes.json();
    const stream = data?.[0];

    if (stream) {
      return res.json({
        live: true,
        configured: true,
        viewerCount: stream.viewer_count,
        title: stream.title,
        gameName: stream.game_name,
        thumbnail: stream.thumbnail_url
          .replace('{width}', '640')
          .replace('{height}', '360'),
      });
    }

    res.json({ live: false, configured: true });
  } catch (err) {
    logger.error('Twitch status check failed:', err.message);
    res.json({ live: false, configured: true, error: err.message });
  }
});

export default router;
