import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import ChatPanel from '@/components/ChatPanel.jsx';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';

const ConversationsInbox = () => {
  const { currentUser } = useAuth();
  const [threads, setThreads] = useState([]);
  const [ticketTitles, setTicketTitles] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildThreads = useCallback((msgs) => {
    const map = {};
    for (const m of msgs) {
      if (!map[m.ticketId]) map[m.ticketId] = { ticketId: m.ticketId, msgs: [], unread: 0 };
      map[m.ticketId].msgs.push(m);
      if (m.receiverId === currentUser.id && !m.read) map[m.ticketId].unread++;
    }
    return Object.values(map).map(t => {
      t.msgs.sort((a, b) => new Date(b.created) - new Date(a.created));
      const last = t.msgs[0];
      const otherPartyId = last.senderId === currentUser.id ? last.receiverId : last.senderId;
      return { ...t, lastMsg: last, otherPartyId };
    }).sort((a, b) => new Date(b.lastMsg.created) - new Date(a.lastMsg.created));
  }, [currentUser]);

  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    const msgs = await pb.collection('messages').getFullList({
      filter: `senderId = "${currentUser.id}" || receiverId = "${currentUser.id}"`,
      sort: '-created',
      $autoCancel: false,
    });
    const built = buildThreads(msgs);
    setThreads(built);
    setLoading(false);

    const ids = [...new Set(built.map(t => t.ticketId))];
    if (ids.length === 0) return;
    const filter = ids.map(id => `id = "${id}"`).join(' || ');
    pb.collection('auction_tickets').getFullList({ filter, $autoCancel: false })
      .then(tickets => {
        const map = {};
        tickets.forEach(t => { map[t.id] = t.description; });
        setTicketTitles(map);
      }).catch(() => {});
  }, [currentUser, buildThreads]);

  useEffect(() => {
    if (!currentUser) return;
    fetchMessages();

    let unsub;
    pb.collection('messages').subscribe('*', (e) => {
      const m = e.record;
      if (m.senderId !== currentUser.id && m.receiverId !== currentUser.id) return;
      fetchMessages();
    }, { $autoCancel: false }).then(fn => { unsub = fn; }).catch(() => {});

    return () => { if (unsub) unsub(); };
  }, [currentUser, fetchMessages]);

  if (loading) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm">
        Loading conversations…
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <MessageCircle className="h-10 w-10 opacity-20" />
        <p className="text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {threads.map(thread => {
        const { ticketId, lastMsg, unread, otherPartyId } = thread;
        const title = ticketTitles[ticketId];
        const preview = title
          ? (title.length > 55 ? title.slice(0, 55) + '…' : title)
          : `Thread #${ticketId.slice(-6)}`;
        const isOwn = lastMsg.senderId === currentUser.id;
        const isOpen = expandedId === ticketId;

        return (
          <div key={ticketId}>
            <button
              className="w-full flex items-center gap-3 px-1 py-4 hover:bg-muted/40 transition-colors text-left"
              onClick={() => setExpandedId(prev => prev === ticketId ? null : ticketId)}
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                    {preview}
                  </span>
                  {unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4 shrink-0 leading-none">
                      {unread}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {isOwn ? 'You: ' : `${lastMsg.senderName}: `}
                  {lastMsg.text}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(lastMsg.created).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
                {isOpen
                  ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                  : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-border bg-muted/10">
                <ChatPanel ticketId={ticketId} receiverId={otherPartyId} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConversationsInbox;
