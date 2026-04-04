import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Heart, Star, Briefcase, User, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const FavouritesPage = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [favourites, setFavourites] = useState([]);
  const [contractors, setContractors] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchFavourites = async () => {
    try {
      const result = await pb.collection('favourites').getFullList({
        filter: `userId = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setFavourites(result);

      // Fetch contractor details for each favourite
      const contractorIds = result.map(f => f.contractorId);
      if (contractorIds.length > 0) {
        const filter = contractorIds.map(cid => `id = "${cid}"`).join(' || ');
        const contractorData = await pb.collection('contractors').getFullList({
          filter,
          $autoCancel: false
        });
        const map = {};
        contractorData.forEach(c => { map[c.id] = c; });
        setContractors(map);
      }
    } catch (err) {
      console.error('Error fetching favourites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchFavourites();
  }, [currentUser]);

  const handleRemove = async (favId, contractorName) => {
    try {
      await pb.collection('favourites').delete(favId, { $autoCancel: false });
      setFavourites(prev => prev.filter(f => f.id !== favId));
      toast({ title: `Removed ${contractorName || 'contractor'} from favourites` });
    } catch (err) {
      toast({ title: 'Error', description: 'Could not remove from favourites.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Favourite Contractors - WorkBee</title>
      </Helmet>
      <Header />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
            <h1 className="text-3xl font-bold text-foreground">Favourite Contractors</h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
          ) : favourites.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No favourites yet</h2>
              <p className="text-muted-foreground mb-6">Save contractors you like for quick access.</p>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
                <Link to="/explore">Browse Contractors</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favourites.map(fav => {
                const contractor = contractors[fav.contractorId];
                if (!contractor) return null;
                return (
                  <Card key={fav.id} className="bg-card border-border rounded-2xl hover:bg-muted/20 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                          {contractor.profilePicture ? (
                            <img
                              src={pb.files.getUrl(contractor, contractor.profilePicture)}
                              alt={contractor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-7 h-7 text-primary/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{contractor.name}</h3>
                          {contractor.profession && (
                            <Badge className="mt-1 mb-2 bg-primary/10 text-primary border-none text-xs">
                              <Briefcase className="w-2.5 h-2.5 mr-1" />
                              {contractor.profession}
                            </Badge>
                          )}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {contractor.rating > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                {contractor.rating.toFixed(1)}
                              </span>
                            )}
                            {contractor.location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="h-3.5 w-3.5 shrink-0" /> {contractor.location}
                              </span>
                            )}
                            {contractor.hourlyRate > 0 && (
                              <span className="text-primary font-medium">€{contractor.hourlyRate}/hr</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          asChild
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                        >
                          <Link to={`/contractor/${contractor.id}`}>View Profile</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(fav.id, contractor.name)}
                          title="Remove from favourites"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FavouritesPage;
