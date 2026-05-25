import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';

const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    try {
      const result = await pb.collection('notifications').getList(1, 20, {
        sort: '-created',
        $autoCancel: false,
      });
      setNotifications(result.items);
      setUnreadCount(result.items.filter(n => !n.read).length);
    } catch {
      // silently ignore
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    let unsub;
    pb.collection('notifications').subscribe('*', (e) => {
      if (e.record.userId !== userId) return;
      if (e.action === 'create') {
        setNotifications(prev => [e.record, ...prev].slice(0, 20));
        setUnreadCount(prev => prev + 1);
      }
      if (e.action === 'update') {
        setNotifications(prev => prev.map(n => n.id === e.record.id ? e.record : n));
        setUnreadCount(prev => {
          const wasUnread = notifications.find(n => n.id === e.record.id && !n.read);
          return wasUnread && e.record.read ? Math.max(0, prev - 1) : prev;
        });
      }
    }, { $autoCancel: false }).then(fn => { unsub = fn; }).catch(() => {});

    return () => { if (unsub) unsub(); };
  }, [userId, fetchNotifications]);

  const markRead = useCallback(async (id) => {
    try {
      await pb.collection('notifications').update(id, { read: true }, { $autoCancel: false });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // silently ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.read);
    if (!unread.length) return;
    try {
      await Promise.all(
        unread.map(n => pb.collection('notifications').update(n.id, { read: true }, { $autoCancel: false }))
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // silently ignore
    }
  }, [notifications]);

  return { notifications, unreadCount, markRead, markAllRead };
};

export default useNotifications;
