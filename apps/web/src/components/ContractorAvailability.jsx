import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarDays, Check, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const toDateKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
};

const TYPES = {
  available:     { label: 'Available',         emoji: '🟢', cal: 'bg-green-500/20 !text-green-400 font-semibold rounded-md hover:bg-green-500/30',   chip: 'bg-green-500/20 text-green-400 border-green-500/30' },
  priority:      { label: 'Priority / Urgent', emoji: '🟠', cal: 'bg-orange-500/20 !text-orange-400 font-semibold rounded-md hover:bg-orange-500/30', chip: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  holiday:       { label: 'Holiday',           emoji: '🌴', cal: 'bg-purple-500/20 !text-purple-400 font-semibold rounded-md hover:bg-purple-500/30', chip: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  busy:          { label: 'Busy',              emoji: '🔴', cal: 'bg-red-500/20 !text-red-400 font-semibold rounded-md hover:bg-red-500/30',           chip: 'bg-red-500/20 text-red-400 border-red-500/30' },
  other_project: { label: 'Other project',     emoji: '🔵', cal: 'bg-blue-500/20 !text-blue-400 font-semibold rounded-md hover:bg-blue-500/30',       chip: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
};

const PRESETS = {
  holiday:       ['On holiday', 'Family trip', 'Public holiday', 'Vacation'],
  busy:          ['Busy', 'Personal matter', 'Doctor appointment'],
  other_project: ['Working on another project', 'On-site work', 'Full day booked'],
};

const ContractorAvailability = ({ contractorId }) => {
  const { toast } = useToast();
  const [records, setRecords]         = useState([]);
  const [recordMap, setRecordMap]     = useState({});  // dateKey → record
  const [slotRequests, setSlotRequests] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editingDay, setEditingDay]   = useState(null); // { key, record | null }
  const [editType, setEditType]       = useState('available');
  const [editNote, setEditNote]       = useState('');
  const [saving, setSaving]           = useState(false);
  const [actioning, setActioning]     = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const avail = await pb.collection('availability').getFullList({
        filter: `contractorId = "${contractorId}"`,
        sort: '+date',
        $autoCancel: false,
      });
      const map = {};
      for (const rec of avail) map[rec.date] = rec;
      setRecordMap(map);
      setRecords(avail);
    } catch (err) {
      console.error('availability fetch failed', err);
    }

    try {
      const requests = await pb.collection('slot_requests').getFullList({
        filter: `contractorId = "${contractorId}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setSlotRequests(requests);
    } catch (err) {
      console.error('slot_requests fetch failed', err);
    }

    setLoading(false);
  }, [contractorId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEditor = (date) => {
    const key = toDateKey(date);
    const existing = recordMap[key] ?? null;
    setEditingDay({ key, record: existing });
    setEditType(existing?.type || 'available');
    setEditNote(existing?.note || '');
  };

  const handleSave = async () => {
    if (!editingDay) return;
    setSaving(true);
    try {
      if (editingDay.record) {
        await pb.collection('availability').update(editingDay.record.id, {
          type: editType,
          note: editNote.trim(),
        }, { $autoCancel: false });
      } else {
        await pb.collection('availability').create({
          contractorId,
          date: editingDay.key,
          type: editType,
          note: editNote.trim(),
        }, { $autoCancel: false });
      }
      setEditingDay(null);
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!editingDay?.record) return;
    setSaving(true);
    try {
      await pb.collection('availability').delete(editingDay.record.id, { $autoCancel: false });
      setEditingDay(null);
      await fetchData();
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
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

  // Build per-type date arrays for the calendar
  const modifiers = {};
  const modifiersClassNames = {};
  for (const [type, cfg] of Object.entries(TYPES)) {
    const dates = records
      .filter(r => (r.type || 'available') === type)
      .map(r => new Date(r.date + 'T12:00:00'));
    if (dates.length) {
      modifiers[type] = dates;
      modifiersClassNames[type] = cfg.cal;
    }
  }

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
        Click any future date to set its status. Clients see <strong className="text-green-400">available</strong> and{' '}
        <strong className="text-orange-400">priority</strong> dates and can request a slot.
      </p>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar + editor */}
        <div className="flex-1 min-w-0 space-y-4">
          <Calendar
            onDayClick={openEditor}
            disabled={{ before: today }}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-xl border border-border p-3 w-full"
          />

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(TYPES).map(([type, cfg]) => (
              <span key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{cfg.emoji}</span>{cfg.label}
              </span>
            ))}
          </div>

          {/* Date editor card — Google Calendar-style inline panel */}
          {editingDay && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-card shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{editingDay.key}</p>
                {editingDay.record && (
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1"
                    onClick={handleRemove}
                    disabled={saving}
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </Button>
                )}
              </div>

              {/* Type chips */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(TYPES).map(([type, cfg]) => (
                  <button
                    key={type}
                    onClick={() => setEditType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      editType === type
                        ? cfg.chip
                        : 'bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
              </div>

              {/* Quick preset labels */}
              {PRESETS[editType] && (
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS[editType].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setEditNote(editNote === preset ? '' : preset)}
                      className={`px-2 py-0.5 rounded-md text-xs border transition-all ${
                        editNote === preset
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom note */}
              <Input
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Add a note… (optional)"
                className="text-sm bg-input border-border rounded-xl h-9"
              />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-8 text-xs"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <><Check className="h-3 w-3 mr-1" />Save</>}
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="rounded-lg h-8 text-xs"
                  onClick={() => setEditingDay(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
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
                        size="sm" variant="ghost"
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

          {pendingRequests.length === 0 && records.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No dates marked yet.
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
