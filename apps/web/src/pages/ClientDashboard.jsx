import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { FileText, Clock, CheckCircle, Plus, Settings, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import AuctionTicketForm from '@/components/AuctionTicketForm.jsx';

const ClientDashboard = () => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchTickets = async () => {
    try {
      const records = await pb.collection('auction_tickets').getFullList({
        filter: `clientId = "${currentUser.id}"`,
        sort: '-created',
        expand: 'categoryId',
        $autoCancel: false
      });
      setTickets(records);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTickets();
    }
  }, [currentUser]);

  const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
  const completedTickets = tickets.filter(t => t.status === 'Completed');

  return (
    <>
      <Helmet>
        <title>{t('dashboard.client_title')} - Bee Marketplace</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-foreground">{t('dashboard.client_title')}</h1>
                <p className="text-muted-foreground">{t('dashboard.welcome', { name: currentUser?.name || currentUser?.email })}</p>
              </div>
              <div className="flex gap-3">
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-md">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('auction.create_new_request')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('auction.create_new_request')}</DialogTitle>
                    </DialogHeader>
                    <AuctionTicketForm 
                      onSuccess={() => { setIsCreateModalOpen(false); fetchTickets(); }} 
                      onCancel={() => setIsCreateModalOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" asChild className="border-border hover:bg-muted rounded-xl">
                  <Link to="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    {t('header.settings')}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.your_requests')}</p>
                      <p className="text-3xl font-bold text-foreground">{tickets.length}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.active_requests')}</p>
                      <p className="text-3xl font-bold text-foreground">{activeTickets.length}</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{t('dashboard.completed')}</p>
                      <p className="text-3xl font-bold text-foreground">{completedTickets.length}</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border rounded-2xl">
              <CardHeader>
                <CardTitle>{t('dashboard.your_requests')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                ) : tickets.length > 0 ? (
                  <div className="space-y-4">
                    {tickets.map(ticket => (
                      <div key={ticket.id} className="border border-border rounded-xl p-5 hover:bg-muted/30 transition-colors duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-foreground">
                                {ticket.expand?.categoryId?.name || 'Service Request'}
                              </h3>
                              <Badge className={
                                ticket.status === 'Open' ? 'bg-yellow-500/10 text-yellow-500' :
                                ticket.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500' :
                                ticket.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                                'bg-red-500/10 text-red-500'
                              }>
                                {t(`auction.${ticket.status.toLowerCase().replace(' ', '_')}`, { defaultValue: ticket.status })}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3 line-clamp-2">{ticket.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              {ticket.budget && (
                                <span className="font-medium text-primary">€{ticket.budget}</span>
                              )}
                              {ticket.location && (
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5"/> {ticket.location}
                                </span>
                              )}
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5"/> {new Date(ticket.created).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shrink-0">
                            <Link to={`/auction-ticket/${ticket.id}`}>{t('auction.view_details')}</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">{t('dashboard.no_requests')}</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('dashboard.start_browsing')}</p>
                    <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      {t('auction.create_new_request')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ClientDashboard;