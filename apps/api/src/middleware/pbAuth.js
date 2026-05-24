import PocketBase from 'pocketbase';

const PB_URL = process.env.POCKETBASE_URL || 'https://workbee-pocketbase-cayj-production.up.railway.app';

export async function requirePbAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);
  try {
    const pb = new PocketBase(PB_URL);
    pb.authStore.save(token, null);
    const { record } = await pb.collection('users').authRefresh();
    req.pbUser = record;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
