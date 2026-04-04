import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient.js';
import { MapPin, Users, FileText, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import GoogleMapsIntegration from '@/components/GoogleMapsIntegration.jsx';

const LocatorPage = () => {
  const [contractors, setContractors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [cats, contractorData, ticketData] = await Promise.all([
          pb.collection('categories').getFullList({ sort: 'name', $autoCancel: false }),
          pb.collection('contractors').getFullList({
            $autoCancel: false
          }).catch(() => []),
          pb.collection('auction_tickets').getFullList({
            filter: 'status = "Open"',
            expand: 'categoryId',
            $autoCancel: false
          }).catch(() => [])
        ]);
        setCategories(cats);
        setContractors(contractorData);
        setTickets(ticketData);
      } catch (err) {
        console.error('Explore fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredContractors = showFilter === 'tickets' ? [] : contractors.filter(c =>
    categoryFilter === 'all' || (c.categories && c.categories.includes(categoryFilter))
  );

  const filteredTickets = showFilter === 'contractors' ? [] : tickets.filter(t =>
    categoryFilter === 'all' || t.categoryId === categoryFilter
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Explore - WorkBee</title>
        <meta name="description" content="Explore open job requests and contractors near you." />
      </Helmet>

      <Header />

      <main className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">

          {/* Page title + filters */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground mr-2">Explore</h1>

            {/* Show filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {[
                { value: 'all', label: 'All', icon: <MapPin className="h-3.5 w-3.5" /> },
                { value: 'tickets', label: 'Requests', icon: <FileText className="h-3.5 w-3.5" /> },
                { value: 'contractors', label: 'Contractors', icon: <Users className="h-3.5 w-3.5" /> },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setShowFilter(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    showFilter === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 bg-input border-border rounded-lg h-9 text-sm">
                <Filter className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Counts */}
            <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
              {showFilter !== 'contractors' && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                  {filteredTickets.length} requests
                </span>
              )}
              {showFilter !== 'tickets' && (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  {filteredContractors.length} contractors
                </span>
              )}
            </div>
          </div>

          {/* Map */}
          {loading ? (
            <div className="w-full h-[600px] rounded-2xl bg-muted/30 flex items-center justify-center border border-border">
              <div className="text-center">
                <MapPin className="h-10 w-10 text-primary mx-auto mb-3 animate-bounce" />
                <p className="text-muted-foreground font-medium">Loading map...</p>
              </div>
            </div>
          ) : (
            <GoogleMapsIntegration
              contractors={filteredContractors}
              tickets={filteredTickets}
              categories={categories}
            />
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LocatorPage;
