import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
};

const AvailabilityPicker = ({ contractorId }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchAvailability = useCallback(async () => {
    try {
      const avail = await pb.collection('availability').getFullList({
        filter: `contractorId = "${contractorId}"`,
        $autoCancel: false,
      });
      setAvailableDates(avail.map(r => new Date(r.date + 'T12:00:00')));
    } catch (_) {}
    setLoading(false);
  }, [contractorId]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const availableKeys = availableDates.map(toDateKey);

  const handleDayClick = (date) => {
    const key = toDateKey(date);
    if (!availableKeys.includes(key)) return;
    setSelectedDate(date);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!selectedDate) return;
    if (currentUser?.userType !== 'client') {
      toast({ title: 'Clients only', description: 'Only client accounts can request slots.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await pb.collection('slot_requests').create({
        contractorId,
        clientId:   currentUser.id,
        clientName: currentUser.name || currentUser.email,
        date:       toDateKey(selectedDate),
        message:    message.trim(),
        status:     'pending',
      }, { $autoCancel: false });
      setSubmitted(true);
      setSelectedDate(null);
      setMessage('');
      toast({ title: 'Slot requested!', description: 'The contractor will confirm shortly.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );

  if (availableDates.length === 0) return (
    <div className="text-center py-6">
      <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
      <p className="text-sm text-muted-foreground">No available dates set yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <Calendar
        mode="single"
        selected={selectedDate ?? undefined}
        onDayClick={handleDayClick}
        disabled={(date) => date < today || !availableKeys.includes(toDateKey(date))}
        modifiers={{ available: availableDates }}
        modifiersClassNames={{
          available: 'bg-green-500/20 !text-green-400 font-semibold rounded-md',
        }}
        className="rounded-xl w-full"
      />
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <span className="inline-block w-3 h-3 rounded bg-green-500/30 shrink-0" />
        Available — click a date to request it
      </p>

      {selectedDate && !submitted && (
        <div className="space-y-2 pt-3 border-t border-border">
          <p className="text-sm font-medium text-foreground">
            Request <span className="text-primary">{toDateKey(selectedDate)}</span>
          </p>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Any details about the work? (optional)"
            className="text-sm bg-input border-border rounded-xl resize-none"
            rows={2}
          />
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : <CalendarDays className="h-4 w-4 mr-2" />}
            Request this slot
          </Button>
        </div>
      )}

      {submitted && (
        <div className="flex items-center gap-2 text-sm text-green-500 pt-3 border-t border-border">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Request sent! The contractor will confirm shortly.
        </div>
      )}
    </div>
  );
};

export default AvailabilityPicker;
