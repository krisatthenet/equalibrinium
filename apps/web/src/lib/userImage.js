import pb from './pocketbaseClient.js';

/**
 * Returns the URL for a user's avatar image.
 * Pass { thumb: '100x100' } to get a resized version via PocketBase's built-in thumbnailer.
 */
export function getUserImageUrl(user, { thumb } = {}) {
  if (!user?.avatar) return null;
  return pb.files.getUrl(user, user.avatar, thumb ? { thumb } : {});
}
