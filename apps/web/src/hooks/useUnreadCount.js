import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const useUnreadCount = (userId) => {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await pb.collection('messages').getList(1, 1, {
        filter: `receiverId = "${userId}" && read = false`,
        $autoCancel: false,
      });
      setCount(result.totalItems);
    } catch {
      // silently ignore
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchCount();

    let unsub;
    pb.collection('messages').subscribe('*', (e) => {
      if (e.action === 'create' && e.record.receiverId === userId && !e.record.read) {
        setCount(prev => prev + 1);
      }
      if (e.action === 'update') {
        fetchCount();
      }
    }, { $autoCancel: false }).then(fn => { unsub = fn; }).catch(() => {});

    return () => { if (unsub) unsub(); };
  }, [userId, fetchCount]);

  return count;
};

export default useUnreadCount;
