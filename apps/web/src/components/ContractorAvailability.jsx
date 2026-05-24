import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarDays, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
};

const ContractorAvailability = ({ contractorId }) => {
  const { toast } = useToast();
  const [availableDates, setAvailableDates] = useState([]);
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [slotRequests, setSlotRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [actioning, setActioning] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [avail, requests] = await Promise.all([
        pb.collection('availability').getFullList({
          filter: `contractorId = "${contractorId}"`,
          sort: '+date',
          $autoCancel: false,
        }),
        pb.collection('slot_requests').getFullList({
          filter: `contractorId = "${contractorId}"`,
          sort: '-created',
          $autoCancel: false,
        }),
      ]);

      const map = {};
      const dates = [];
      for (const rec of avail) {
        map[rec.date] = rec.id;
        dates.push(new Date(rec.date + 'T12:00:00'));
      }
      setAvailabilityMap(map);
      setAvailableDates(dates);
      setSlotRequests(requests);
    } catch (err) {
      console.error('availability fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, [contractorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDayClick = async (date) => {
    if (toggling) return;
    const key = toDateKey(date);
    setToggling(key);
    try {
      if (availabilityMap[key]) {
        await pb.collection('availability').delete(availabilityMap[key], { $autoCancel: false });
      } else {
        await pb.collection('availability').create(
          { contractorId, date: key },
          { $autoCancel: false }
        );
      }
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setToggling(null);
    }
  };

  const handleAction = async (requestId, status) => {
    setActioning(requestId);
    try {
      await pb.collection('slot_requests').update(requestId, { status }, { $autoCancel: false });
      toast({ title: status === 'confirmed' ? 'Slot confirmed!' : 'Request declined' });
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setActioning(null);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingRequests = slotRequests.filter(r => r.status === 'pending');
  const pastRequests    = slotRequests.filter(r => r.status !== 'pending');

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Click any future date to mark yourself as <strong className="text-foreground">available</strong>. Clients browsing your profile can then request a specific day — cutting the "when are you free?" back-and-forth.
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          <Calendar
            onDayClick={handleDayClick}
            disabled={{ before: today }}
            modifiers={{ available: availableDates }}
            modifiersClassNames={{
              available: 'bg-green-500/20 !text-green-400 font-semibold rounded-md hover:bg-green-500/30',
            }}
            className="rounded-xl border border-border p-3 w-full"
          />
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded bg-green-500/30 shrink-0" />
            Available &nbsp;·&nbsp; Click any future date to toggle
            {toggling && <Loader2 className="h-3 w-3 animate-spin ml-1" />}
          </p>
        </div>

        {/* Requests sidebar */}
        <div className="lg:w-72 space-y-4">
          {pendingRequests.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                Pending Requests
                <Badge className="bg-primary/20 text-primary border-none ml-1">{pendingRequests.length}</Badge>
              </p>
              <div className="space-y-3">
                {pendingRequests.map(req => (
                  <div key={req.id} className="border border-border rounded-xl p-3 space-y-2 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{req.date}</span>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-xs">
                        Pending
                      </Badge>
                    </div>
                    {req.clientName && (
                      <p className="text-xs text-muted-foreground">From: <span className="text-foreground">{req.clientName}</span></p>
                    )}
                    {req.message && (
                      <p className="text-sm text-muted-foreground italic line-clamp-2">"{req.message}"</p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-8 text-xs"
                        onClick={() => handleAction(req.id, 'confirmed')}
                        disabled={actioning === req.id}
                      >
                        {actioning === req.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <><Check className="h-3 w-3 mr-1" />Confirm</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 rounded-lg h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleAction(req.id, 'declined')}
                        disabled={actioning === req.id}
                      >
                        <X className="h-3 w-3 mr-1" />Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pendingRequests.length === 0 && availableDates.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No available dates set yet.
              <br />Start by clicking dates on the calendar.
            </div>
          )}

          {pastRequests.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">History</p>
              <div className="space-y-2">
                {pastRequests.slice(0, 5).map(req => (
                  <div key={req.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                    <span className="text-muted-foreground">{req.date}</span>
                    <Badge
                      variant="outline"
                      className={req.status === 'confirmed'
                        ? 'bg-green-500/10 text-green-500 border-green-500/20 text-xs'
                        : 'bg-muted text-muted-foreground border-none text-xs'}
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractorAvailability;
