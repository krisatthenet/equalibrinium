import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import { Search, Trash2, Star, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('reviews').getFullList({
        sort: '-created',
        expand: 'clientId,contractorId',
        $autoCancel: false
      });
      setReviews(records);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({ title: "Error", description: "Failed to load reviews.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await pb.collection('reviews').delete(id, { $autoCancel: false });
      toast({ title: "Review Deleted", description: "The review has been removed." });
      fetchReviews();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
    }
  };

  const filteredReviews = reviews.filter(r => 
    (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.expand?.clientId?.email && r.expand.clientId.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <Helmet>
        <title>Manage Reviews - Admin Portal</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Reviews</h1>
          <p className="text-muted-foreground mt-1">Moderate platform feedback and ratings.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search reviews..." 
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
                <th className="px-6 py-4 font-medium">Reviewer</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium w-1/2">Comment</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(var(--admin-border))]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading reviews...
                  </td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No reviews found.
                  </td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-[hsl(var(--admin-border))/30] transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{review.expand?.clientId?.email || 'Unknown'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-[hsl(var(--admin-primary))]">
                        <Star className="h-4 w-4 fill-current mr-1" />
                        <span className="font-bold">{review.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <p className="line-clamp-2">{review.comment || 'No comment provided.'}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(review.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReviewsPage;