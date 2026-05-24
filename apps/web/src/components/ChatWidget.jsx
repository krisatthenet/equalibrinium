import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, UserCircle, ArrowRight } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'https://api.workbee.space';

const TypingDots = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    {[0,1,2].map(i => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
);

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! 👋 I'm the WorkBee assistant. Ask me anything about finding contractors, posting a job, or how the platform works." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [showContact, setShowContact] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const history = messages.filter(m => m.role !== 'system');
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, name, email }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.escalate && !escalated) {
        setEscalated(true);
        setShowContact(true);
        setMessages(prev => [...prev, {
          role: 'system',
          content: "I've flagged this for our team — they'll follow up shortly. If you'd like to leave your details, we'll reach out faster."
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again or email us at hello@workbee.space." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Bubble */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Open support chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && !escalated && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '70vh' }}>

          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-primary-foreground">WorkBee Assistant</p>
              <p className="text-xs text-primary-foreground/70">
                {escalated ? 'Team notified · Usually replies in 1–2 h' : 'Online · Powered by AI'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : msg.role === 'system'
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-bl-sm text-xs'
                      : 'bg-muted text-foreground rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Optional contact capture after escalation */}
          {showContact && (
            <div className="px-4 pb-2 space-y-2 border-t border-border pt-3 bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium">Leave your details (optional):</p>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-xs bg-input border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs bg-input border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => setShowContact(false)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Done <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              disabled={loading}
              className="flex-1 text-sm bg-input border border-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
              aria-label="Send"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
