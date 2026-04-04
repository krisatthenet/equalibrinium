import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const ReviewModal = ({ open, onClose, contractorId, contractorName, ticketId, onSubmitted }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await pb.collection('reviews').create({
        contractorId,
        clientId: currentUser.id,
        ticketId,
        rating,
        comment
      }, { $autoCancel: false });
      toast({ title: 'Review submitted!' });
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      toast({ title: 'Failed to submit review', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          {contractorName && (
            <p className="text-sm text-muted-foreground">
              Rate your experience with <span className="font-semibold text-foreground">{contractorName}</span>
            </p>
          )}

          {/* Star picker */}
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(i)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    i <= (hovered || rating) ? 'text-primary fill-primary' : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </p>
          )}

          <Textarea
            placeholder="Share details about your experience (optional)..."
            className="bg-input border-border border-l-2 border-l-primary rounded-lg min-h-[100px]"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={loading} className="rounded-xl">
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!rating || loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewModal;
