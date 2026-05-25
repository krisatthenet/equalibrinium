import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellDot, Hammer, CheckCircle2, Gavel, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import useNotifications from '@/hooks/useNotifications.js';

const TYPE_META = {
  new_bid:          { icon: Gavel,         color: 'text-primary',    bg: 'bg-primary/10' },
  bid_accepted:     { icon: CheckCircle2,  color: 'text-green-400',  bg: 'bg-green-500/10' },
  ticket_completed: { icon: Hammer,        color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  dispute_update:   { icon: Info,          color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const NotificationsBell = ({ userId }) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(userId);

  const handleClick = async (n) => {
    if (!n.read) await markRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full text-foreground hover:bg-muted" aria-label="Notifications">
          {unreadCount > 0 ? <BellDot className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 bg-card border-border rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[380px]">
            <div className="divide-y divide-border">
              {notifications.map((n) => {
                const meta = TYPE_META[n.type] || TYPE_META.dispute_update;
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className={`shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center ${meta.bg}`}>
                      <Icon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium leading-snug ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {n.title}
                        </p>
                        {!n.read && <span className="mt-1 shrink-0 w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsBell;
