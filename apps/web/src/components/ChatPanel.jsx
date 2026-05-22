import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageCircle } from 'lucide-react';

const ChatPanel = ({ ticketId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!ticketId || !currentUser) return;

    pb.collection('messages').getFullList({
      filter: `ticketId = "${ticketId}"`,
      sort: '+created',
      $autoCancel: false,
    }).then(msgs => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 30);
    }).catch(() => setLoading(false));

    pb.collection('messages').subscribe('*', (e) => {
      if (e.record.ticketId !== ticketId) return;
      if (e.action === 'create') {
        setMessages(prev => prev.find(m => m.id === e.record.id) ? prev : [...prev, e.record]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
      }
    }, { $autoCancel: false }).catch(() => {});

    return () => { pb.collection('messages').unsubscribe('*'); };
  }, [ticketId, currentUser]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      await pb.collection('messages').create({
        ticketId,
        senderId: currentUser.id,
        senderName: currentUser.name || currentUser.email,
        text: trimmed,
      }, { $autoCancel: false });
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-80">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <MessageCircle className="h-8 w-8 opacity-25" />
            <p className="text-sm">No messages yet — say hello!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isOwn = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                {!isOwn && (
                  <span className="text-[10px] text-muted-foreground mb-0.5 px-1">{msg.senderName}</span>
                )}
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                  isOwn
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
                  {new Date(msg.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 px-3 pb-3 pt-2 border-t border-border">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="bg-input border-border text-foreground rounded-xl text-sm"
          disabled={sending}
        />
        <Button
          onClick={send}
          disabled={!text.trim() || sending}
          size="icon"
          className="rounded-xl shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
