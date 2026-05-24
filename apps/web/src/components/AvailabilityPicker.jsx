import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarDays, CheckCircle2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
};

// Types clients can actually book
const BOOKABLE = new Set(['available', 'priority']);

const TYPE_CAL = {
  available:     'bg-green-500/20 !text-green-400 font-semibold rounded-md',
  priority:      'bg-orange-500/20 !text-orange-400 font-semibold rounded-md',
  holiday:       'opacity-40 line-through rounded-md cursor-not-allowed',
  busy:          'opacity-40 line-through rounded-md cursor-not-allowed',
  other_project: 'opacity-40 line-through rounded-md cursor-not-allowed',
};

const AvailabilityPicker = ({ contractorId }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [recordMap, setRecordMap]   = useState({});  // dateKey → record
  const [selectedDate, setSelectedDate] = useState(null);
  const [message, setMessage]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);

  const fetchAvailability = useCallback(async () => {
    try {
      const avail = await pb.collection('availability').getFullList({
        filter: `contractorId = "${contractorId}"`,
        $autoCancel: false,
      });
      const map = {};
      for (const rec of avail) map[rec.date] = rec;
      setRecordMap(map);
    } catch (_) {}
    setLoading(false);
  }, [contractorId]);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const records = Object.values(recordMap);
  const byType  = (type) => records.filter(r => (r.type || 'available') === type).map(r => new Date(r.date + 'T12:00:00'));

  const bookableKeys = records
    .filter(r => BOOKABLE.has(r.type || 'available'))
    .map(r => r.date);

  const handleDayClick = (date) => {
    const key = toDateKey(date);
    if (!bookableKeys.includes(key)) return;
    setSelectedDate(date);
    setSubmitted(false);
  };

  const selectedRecord = selectedDate ? recordMap[toDateKey(selectedDate)] : null;
  const isPriority = selectedRecord?.type === 'priority';

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

  if (records.length === 0) return (
    <div className="text-center py-6">
      <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30" />
      <p className="text-sm text-muted-foreground">No available dates set yet.</p>
    </div>
  );

  const modifiers = {};
  const modifiersClassNames = {};
  for (const [type, cls] of Object.entries(TYPE_CAL)) {
    const dates = byType(type);
    if (dates.length) {
      modifiers[type] = dates;
      modifiersClassNames[type] = cls;
    }
  }

  return (
    <div className="space-y-3">
      <Calendar
        mode="single"
        selected={selectedDate ?? undefined}
        onDayClick={handleDayClick}
        disabled={(date) => {
          if (date < today) return true;
          const key = toDateKey(date);
          // disable past + non-bookable (blocked) dates
          if (!recordMap[key]) return true;
          return !BOOKABLE.has(recordMap[key].type || 'available');
        }}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="rounded-xl w-full"
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500/30 shrink-0" />
          Available
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-500/30 shrink-0" />
          Priority
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted shrink-0" />
          Unavailable
        </span>
      </div>

      {selectedDate && !submitted && (
        <div className="space-y-2 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            {isPriority && (
              <span className="flex items-center gap-1 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                <Zap className="h-3 w-3" /> Priority date
              </span>
            )}
            <p className="text-sm font-medium text-foreground">
              Request <span className={isPriority ? 'text-orange-400' : 'text-primary'}>{toDateKey(selectedDate)}</span>
            </p>
          </div>
          {selectedRecord?.note && (
            <p className="text-xs text-muted-foreground italic bg-muted/30 rounded-lg px-3 py-2">
              Note: {selectedRecord.note}
            </p>
          )}
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Any details about the work? (optional)"
            className="text-sm bg-input border-border rounded-xl resize-none"
            rows={2}
          />
          <Button
            className={`w-full rounded-xl ${isPriority ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              : isPriority
                ? <><Zap className="h-4 w-4 mr-2" />Request this priority slot</>
                : <><CalendarDays className="h-4 w-4 mr-2" />Request this slot</>}
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
