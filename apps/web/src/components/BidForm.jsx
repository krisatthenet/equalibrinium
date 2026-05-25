import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { PLANS, getEffectivePlan } from '@/lib/plans';


const BidForm = ({ ticketId, onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    proposedRate: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.proposedRate) {
      toast({ title: "Missing fields", description: "Please enter a proposed rate.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Enforce monthly bid limit based on plan
      const plan = getEffectivePlan(currentUser);
      const limit = PLANS[plan]?.contractor?.bidsPerMonth ?? 5;
      if (limit !== Infinity) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const monthBids = await pb.collection('bids').getList(1, 1, {
          filter: `masterId = "${currentUser.id}" && created >= "${startOfMonth.toISOString()}"`,
          $autoCancel: false,
        });
        if (monthBids.totalItems >= limit) {
          toast({
            title: "Monthly bid limit reached",
            description: `Your ${plan === 'standard' ? 'free' : plan} plan allows ${limit} bids/month. Upgrade to place more bids.`,
            variant: "destructive",
            action: <Link to="/settings?tab=plan" className="underline text-sm">Upgrade</Link>,
          });
          setLoading(false);
          return;
        }
      }

      await pb.collection('bids').create({
        ticketId: ticketId,
        masterId: currentUser.id, // Keeping masterId as per DB schema
        proposedRate: parseFloat(formData.proposedRate),
        message: formData.message,
        status: 'pending'
      }, { $autoCancel: false });

      toast({ title: "Success", description: "Your bid has been placed." });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error placing bid:', error);
      toast({ title: "Error", description: "Could not place bid.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('auction.proposed_rate')} (€)</Label>
        <Input 
          type="number" 
          min="0" 
          step="0.01"
          required
          value={formData.proposedRate} 
          onChange={(e) => setFormData({...formData, proposedRate: e.target.value})}
          className="bg-input border-border text-foreground"
          placeholder="e.g. 25"
        />
      </div>

      <div className="space-y-2">
        <Label>{t('auction.message_to_client')}</Label>
        <Textarea 
          value={formData.message} 
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          className="bg-input border-border text-foreground min-h-[100px]"
          placeholder="Explain why you are a good fit for this job..."
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {t('auction.cancel')}
          </Button>
        )}
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auction.place_bid')}
        </Button>
      </div>
    </form>
  );
};

export default BidForm;