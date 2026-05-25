import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import {
  Search, ShieldBan, ShieldCheck, Eye, Loader2, UserCircle, Ticket, AlertTriangle,
  MessageSquare, CheckCircle2, Clock, XCircle, ChevronDown, Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const statusColor = {
  Open: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'In Progress': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  Completed: 'bg-green-500/15 text-green-400 border-green-500/20',
  Cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const CS_STATUS = {
  open:        { label: 'Open',        icon: Clock,         cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'In Progress', icon: MessageSquare, cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  resolved:    { label: 'Resolved',    icon: CheckCircle2,  cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  closed:      { label: 'Closed',      icon: XCircle,       cls: 'bg-muted text-muted-foreground border-border' },
};

const CS_PRIORITY = {
  low:    'bg-muted text-muted-foreground border-border',
  normal: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  high:   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const AdminSupportPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [openTickets, setOpenTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // CS tickets state
  const [csTickets, setCsTickets] = useState([]);
  const [csLoading, setCsLoading] = useState(false);
  const [csFilter, setCsFilter] = useState('open');
  const [selectedCsTicket, setSelectedCsTicket] = useState(null);
  const [csModalOpen, setCsModalOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // User detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTickets, setUserTickets] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [loadingUserTickets, setLoadingUserTickets] = useState(false);

  // Ban modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, ticketsRes] = await Promise.all([
          pb.collection('users').getFullList({ sort: '-created', $autoCancel: false }),
          pb.collection('auction_tickets').getFullList({
            filter: 'status = "Open" || status = "In Progress"',
            sort: '-created',
            expand: 'clientId,categoryId',
            $autoCancel: false,
          }),
        ]);
        setUsers(usersRes);
        setOpenTickets(ticketsRes);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load data.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const fetchCsTickets = useCallback(async () => {
    setCsLoading(true);
    try {
      const data = await pb.collection('cs_tickets').getFullList({
        sort: '-created',
        $autoCancel: false,
      });
      setCsTickets(data);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load CS tickets.', variant: 'destructive' });
    } finally {
      setCsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'cs' || tab === 'disputes') fetchCsTickets();
  }, [tab, fetchCsTickets]);

  const updateCsStatus = async (id, status) => {
    await pb.collection('cs_tickets').update(id, { status }, { $autoCancel: false });
    setCsTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (selectedCsTicket?.id === id) setSelectedCsTicket(prev => ({ ...prev, status }));
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedCsTicket) return;
    setReplyLoading(true);
    try {
      await pb.collection('cs_tickets').update(selectedCsTicket.id, {
        response: replyText,
        status: 'in_progress',
      }, { $autoCancel: false });
      setSelectedCsTicket(prev => ({ ...prev, response: replyText, status: 'in_progress' }));
      setCsTickets(prev => prev.map(t => t.id === selectedCsTicket.id ? { ...t, response: replyText, status: 'in_progress' } : t));
      setReplyText('');
      toast({ title: 'Reply saved' });
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setReplyLoading(false);
    }
  };

  const openUserModal = async (user) => {
    setSelectedUser(user);
    setUserModalOpen(true);
    setLoadingUserTickets(true);
    try {
      const tickets = await pb.collection('auction_tickets').getFullList({
        filter: `clientId = "${user.id}"`,
        sort: '-created',
        expand: 'categoryId',
        $autoCancel: false,
      });
      setUserTickets(tickets);
    } catch (_) {
      setUserTickets([]);
    } finally {
      setLoadingUserTickets(false);
    }
  };

  const handleBan = async () => {
    if (!banTarget) return;
    setActionLoading(true);
    try {
      await pb.collection('users').update(banTarget.id, { banned: !banTarget.banned });
      setUsers(prev => prev.map(u => u.id === banTarget.id ? { ...u, banned: !banTarget.banned } : u));
      toast({
        title: banTarget.banned ? 'User unbanned' : 'User banned',
        description: `${banTarget.name || banTarget.email} has been ${banTarget.banned ? 'unbanned' : 'banned'}.`,
      });
      setBanModalOpen(false);
      setBanReason('');
    } catch (e) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    !searchTerm ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const csFiltered = csTickets.filter(t => t.source !== 'dispute' && (csFilter === 'all' || t.status === csFilter));
  const disputeTickets = csTickets.filter(t => t.source === 'dispute');

  return (
    <>
      <Helmet><title>Support — Admin</title></Helmet>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Customer Support</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage users, tickets, and CS inbox</p>
          </div>
          <div className="flex gap-1 bg-[hsl(var(--admin-border))]/40 rounded-lg p-1">
            {[['users','Users & Tickets'],['cs','CS Inbox'],['disputes','Disputes']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === key ? 'bg-[hsl(var(--admin-primary))]/15 text-[hsl(var(--admin-primary))]' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {label}
                {key === 'cs' && csTickets.filter(t => t.status === 'open' && t.source !== 'dispute').length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {csTickets.filter(t => t.status === 'open' && t.source !== 'dispute').length}
                  </span>
                )}
                {key === 'disputes' && csTickets.filter(t => t.source === 'dispute' && t.status === 'open').length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                    {csTickets.filter(t => t.source === 'dispute' && t.status === 'open').length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {tab === 'users' && <>
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="admin-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Total Users</p>
            {loading ? <Skeleton className="h-8 w-16 bg-[hsl(var(--admin-border))]" /> : (
              <p className="text-3xl font-bold text-foreground">{users.length}</p>
            )}
          </div>
          <div className="admin-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Open / In-Progress Tickets</p>
            {loading ? <Skeleton className="h-8 w-16 bg-[hsl(var(--admin-border))]" /> : (
              <p className="text-3xl font-bold text-foreground">{openTickets.length}</p>
            )}
          </div>
          <div className="admin-card p-5">
            <p className="text-xs text-muted-foreground mb-1">Banned Users</p>
            {loading ? <Skeleton className="h-8 w-16 bg-[hsl(var(--admin-border))]" /> : (
              <p className="text-3xl font-bold text-red-400">{users.filter(u => u.banned).length}</p>
            )}
          </div>
        </div>

        {/* User search */}
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            <h2 className="font-semibold text-foreground">User Lookup</h2>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 bg-[hsl(var(--admin-border))]/50 border-[hsl(var(--admin-border))] text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-[hsl(var(--admin-border))]" />)}</div>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {filteredUsers.slice(0, 50).map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--admin-border))] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-[hsl(var(--admin-border))] flex items-center justify-center text-sm font-bold text-foreground shrink-0">
                      {(user.name || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0 border-[hsl(var(--admin-border))] text-muted-foreground">
                      {user.userType || 'unknown'}
                    </Badge>
                    {user.banned && (
                      <Badge variant="outline" className="text-xs shrink-0 border-red-500/30 text-red-400">banned</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      onClick={() => openUserModal(user)}
                      title="View details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${user.banned ? 'text-green-400 hover:text-green-300' : 'text-red-400 hover:text-red-300'}`}
                      onClick={() => { setBanTarget(user); setBanModalOpen(true); }}
                      title={user.banned ? 'Unban user' : 'Ban user'}
                    >
                      {user.banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No users found.</p>
              )}
            </div>
          )}
        </div>

        {/* Open tickets needing attention */}
        <div className="admin-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-4 w-4 text-[hsl(var(--admin-primary))]" />
            <h2 className="font-semibold text-foreground">Open Tickets</h2>
            {!loading && openTickets.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">{openTickets.length} active</span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-[hsl(var(--admin-border))]" />)}</div>
          ) : openTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open tickets — all clear!</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {openTickets.map(ticket => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[hsl(var(--admin-border))]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ticket.expand?.categoryId?.name || 'Service request'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.expand?.clientId?.email || ticket.clientId} · {new Date(ticket.created).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${statusColor[ticket.status] || ''}`}>
                    {ticket.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        </>}

        {tab === 'disputes' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(CS_STATUS).map(([key, { label, cls }]) => (
                <div key={key} className="admin-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{disputeTickets.filter(t => t.status === key).length}</p>
                </div>
              ))}
            </div>

            <div className="admin-card overflow-hidden">
              {csLoading ? (
                <div className="p-6 space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full bg-[hsl(var(--admin-border))]" />)}</div>
              ) : disputeTickets.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No disputes raised</p>
              ) : (
                <div className="divide-y divide-[hsl(var(--admin-border))]/50">
                  {disputeTickets.map(ticket => {
                    const st = CS_STATUS[ticket.status] || CS_STATUS.open;
                    const StIcon = st.icon;
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--admin-border))]/30 cursor-pointer transition-colors"
                        onClick={() => { setSelectedCsTicket(ticket); setReplyText(ticket.response || ''); setCsModalOpen(true); }}
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.name || ticket.email} · Ticket {ticket.ticketId?.slice(-8) || '—'} · {new Date(ticket.created).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs bg-orange-500/15 text-orange-400 border-orange-500/25">Dispute</Badge>
                          <Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'cs' && (
          <div className="space-y-4">
            {/* CS summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(CS_STATUS).map(([key, { label, cls }]) => (
                <div key={key} className="admin-card p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{csTickets.filter(t => t.status === key).length}</p>
                </div>
              ))}
            </div>

            {/* Filter row */}
            <div className="flex gap-1 flex-wrap">
              {['all', ...Object.keys(CS_STATUS)].map(s => (
                <button
                  key={s}
                  onClick={() => setCsFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${csFilter === s ? 'bg-[hsl(var(--admin-primary))]/15 text-[hsl(var(--admin-primary))] border-[hsl(var(--admin-primary))]/30' : 'border-[hsl(var(--admin-border))] text-muted-foreground hover:text-foreground'}`}
                >
                  {s === 'all' ? 'All' : CS_STATUS[s].label}
                </button>
              ))}
            </div>

            {/* Ticket list */}
            <div className="admin-card overflow-hidden">
              {csLoading ? (
                <div className="p-6 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full bg-[hsl(var(--admin-border))]" />)}</div>
              ) : csFiltered.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground">No tickets found</p>
              ) : (
                <div className="divide-y divide-[hsl(var(--admin-border))]/50">
                  {csFiltered.map(ticket => {
                    const st = CS_STATUS[ticket.status] || CS_STATUS.open;
                    const StIcon = st.icon;
                    return (
                      <div
                        key={ticket.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[hsl(var(--admin-border))]/30 cursor-pointer transition-colors"
                        onClick={() => { setSelectedCsTicket(ticket); setReplyText(ticket.response || ''); setCsModalOpen(true); }}
                      >
                        <div className="shrink-0">
                          <StIcon className={`h-4 w-4 ${st.cls.split(' ')[1]}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {ticket.name || ticket.email} · {ticket.source || 'widget'} · {new Date(ticket.created).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-xs ${CS_PRIORITY[ticket.priority] || ''}`}>{ticket.priority}</Badge>
                          <Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User detail modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="bg-[hsl(var(--admin-sidebar))] border-[hsl(var(--admin-border))] text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[hsl(var(--admin-border))] flex items-center justify-center text-lg font-bold">
                  {(selectedUser.name || selectedUser.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{selectedUser.name || '—'}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Type', selectedUser.userType || '—'],
                  ['Plan', selectedUser.plan || 'free'],
                  ['Joined', new Date(selectedUser.created).toLocaleDateString()],
                  ['Status', selectedUser.banned ? '🚫 Banned' : '✅ Active'],
                  ['Phone', selectedUser.phone || '—'],
                  ['Location', selectedUser.location || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[hsl(var(--admin-border))]/40 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="font-medium mt-0.5">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Recent Tickets ({userTickets.length})</p>
                {loadingUserTickets ? (
                  <Skeleton className="h-10 w-full bg-[hsl(var(--admin-border))]" />
                ) : userTickets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tickets.</p>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {userTickets.slice(0, 5).map(t => (
                      <div key={t.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-[hsl(var(--admin-border))]/40">
                        <span className="truncate">{t.expand?.categoryId?.name || 'Ticket'}</span>
                        <Badge variant="outline" className={`ml-2 shrink-0 text-[10px] ${statusColor[t.status] || ''}`}>{t.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* CS ticket detail modal */}
      <Dialog open={csModalOpen} onOpenChange={v => { setCsModalOpen(v); if (!v) setSelectedCsTicket(null); }}>
        <DialogContent className="bg-[hsl(var(--admin-sidebar))] border-[hsl(var(--admin-border))] text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedCsTicket?.subject}</DialogTitle>
          </DialogHeader>
          {selectedCsTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['From', selectedCsTicket.name || '—'],
                  ['Email', selectedCsTicket.email || '—'],
                  ['Phone', selectedCsTicket.phone || '—'],
                  ['Source', selectedCsTicket.source || 'widget'],
                  ['Priority', selectedCsTicket.priority],
                  ['Created', new Date(selectedCsTicket.created).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[hsl(var(--admin-border))]/40 rounded-lg px-3 py-2">
                    <p className="text-muted-foreground mb-0.5">{k}</p>
                    <p className="font-medium text-sm capitalize">{v}</p>
                  </div>
                ))}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Message</Label>
                <div className="mt-1 bg-[hsl(var(--admin-border))]/30 rounded-lg px-3 py-2 text-sm text-foreground whitespace-pre-wrap">{selectedCsTicket.message}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reply / Response</Label>
                <Textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply or internal note…"
                  rows={3}
                  className="mt-1 bg-[hsl(var(--admin-border))]/50 border-[hsl(var(--admin-border))] text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" onClick={sendReply} disabled={replyLoading || !replyText.trim()} className="gap-1.5">
                  {replyLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Save Reply
                </Button>
                {Object.entries(CS_STATUS).map(([key, { label }]) => (
                  selectedCsTicket.status !== key && (
                    <button
                      key={key}
                      onClick={() => updateCsStatus(selectedCsTicket.id, key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${CS_STATUS[key].cls}`}
                    >
                      → {label}
                    </button>
                  )
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban modal */}
      <Dialog open={banModalOpen} onOpenChange={setBanModalOpen}>
        <DialogContent className="bg-[hsl(var(--admin-sidebar))] border-[hsl(var(--admin-border))] text-foreground max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              {banTarget?.banned ? 'Unban User' : 'Ban User'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {banTarget?.banned
                ? `Restore access for ${banTarget?.name || banTarget?.email}?`
                : `Restrict access for ${banTarget?.name || banTarget?.email}?`}
            </DialogDescription>
          </DialogHeader>
          {!banTarget?.banned && (
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Reason (internal)</Label>
              <Textarea
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Optional note for the team…"
                className="bg-[hsl(var(--admin-border))]/50 border-[hsl(var(--admin-border))] text-foreground placeholder:text-muted-foreground resize-none"
                rows={3}
              />
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setBanModalOpen(false)} className="text-muted-foreground">Cancel</Button>
            <Button
              onClick={handleBan}
              disabled={actionLoading}
              className={banTarget?.banned
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {banTarget?.banned ? 'Unban' : 'Ban User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminSupportPage;
