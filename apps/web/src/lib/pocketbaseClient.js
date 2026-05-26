import Pocketbase from 'pocketbase';

// In production builds, hardcode the PocketBase URL so a misconfigured VITE_POCKETBASE_URL
// secret can never redirect PocketBase calls to the wrong service (same pattern as apiServerClient.js).
const POCKETBASE_API_URL = import.meta.env.PROD
  ? 'https://workbee-pocketbase-cayj-production.up.railway.app'
  : (import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;

export { pocketbaseClient };
