import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const AdminTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('auction_tickets').getFullList({
        sort: '-created',
        expand: 'clientId,categoryId',
        $autoCancel: false
      });
      setTickets(records);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({ title: "Error", description: "Failed to load tickets.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    try {
      await pb.collection('auction_tickets').delete(id, { $autoCancel: false });
      toast({ title: "Ticket Deleted", description: "The ticket has been removed." });
      fetchTickets();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete ticket.", variant: "destructive" });
    }
  };

  const filteredTickets = tickets.filter(t => 
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.expand?.clientId?.email && t.expand.clientId.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch(status) {
      case 'Open': return 'bg-yellow-500/20 text-yellow-500';
      case 'In Progress': return 'bg-blue-500/20 text-blue-500';
      case 'Completed': return 'bg-[hsl(var(--admin-success))]/20 text-[hsl(var(--admin-success))]';
      case 'Cancelled': return 'bg-destructive/20 text-destructive';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Tickets - Admin Portal</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tickets</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage service requests.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search tickets..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="admin-input pl-9"
          />
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-[hsl(var(--admin-border))/50] border-b border-[hsl(var(--admin-border))]">
              <tr>
                <th className="px-6 py-4 font-medium">Category / Client</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Budget</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--admin-border))]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-[hsl(var(--admin-border))/30] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{ticket.expand?.categoryId?.name || 'Unknown Category'}</span>
                        <span className="text-xs text-muted-foreground">{ticket.expand?.clientId?.email || 'Unknown Client'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`${getStatusColor(ticket.status)} border-none hover:opacity-80`}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {ticket.budget ? `€${ticket.budget}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(ticket.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-[hsl(var(--admin-border))]"
                          onClick={() => { setSelectedTicket(ticket); setViewModalOpen(true); }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteTicket(ticket.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="bg-[hsl(var(--admin-card))] border-[hsl(var(--admin-border))] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedTicket.expand?.clientId?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${getStatusColor(selectedTicket.status)} border-none mt-1`}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">{selectedTicket.budget ? `€${selectedTicket.budget}` : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedTicket.location || 'Not specified'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <div className="bg-[hsl(var(--admin-bg))] p-4 rounded-lg border border-[hsl(var(--admin-border))] text-sm whitespace-pre-wrap">
                  {selectedTicket.description}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTicketsPage;