import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, FileText, Download, Trash2, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS = {
  pending:   { label: 'Pending',   icon: Clock,         cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  paid:      { label: 'Paid',      icon: CheckCircle2,  cls: 'bg-green-500/15 text-green-400 border-green-500/20' },
  overdue:   { label: 'Overdue',   icon: AlertCircle,   cls: 'bg-red-500/15 text-red-400 border-red-500/20' },
  cancelled: { label: 'Cancelled', icon: XCircle,       cls: 'bg-muted text-muted-foreground border-border' },
};

const AdminInvoicesPage = () => {
  const { toast } = useToast();
  const [invoices, setInvoices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [form, setForm] = useState({
    title: '', vendor: '', amount: '', currency: 'EUR',
    dueDate: '', status: 'pending', notes: '',
  });
  const [file, setFile] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await pb.collection('invoices').getFullList({ sort: '-created', $autoCancel: false });
      setInvoices(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const save = async () => {
    if (!form.title || !form.vendor || !form.amount) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries({ ...form, amount: Number(form.amount) }).forEach(([k,v]) => fd.append(k, v));
      if (file) fd.append('invoiceFile', file);
      await pb.collection('invoices').create(fd, { $autoCancel: false });
      toast({ title: 'Invoice added' });
      setShowForm(false);
      setFile(null);
      setForm({ title: '', vendor: '', amount: '', currency: 'EUR', dueDate: '', status: 'pending', notes: '' });
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    const update = { status };
    if (status === 'paid') update.paidDate = new Date().toISOString().slice(0,10);
    await pb.collection('invoices').update(id, update, { $autoCancel: false });
    await fetchData();
  };

  const remove = async (id) => {
    await pb.collection('invoices').delete(id, { $autoCancel: false });
    await fetchData();
  };

  const filtered = invoices
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.vendor?.toLowerCase().includes(search.toLowerCase()));

  const totals = {
    pending:  invoices.filter(i => i.status === 'pending').reduce((s,i) => s+(i.amount||0), 0),
    paid:     invoices.filter(i => i.status === 'paid').reduce((s,i) => s+(i.amount||0), 0),
    overdue:  invoices.filter(i => i.status === 'overdue').reduce((s,i) => s+(i.amount||0), 0),
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <Helmet><title>Invoices - Admin Portal</title></Helmet>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track incoming and outgoing invoices</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Invoice
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[['pending','Awaiting Payment','yellow'],['paid','Total Paid','green'],['overdue','Overdue','red']].map(([key,label,color]) => (
          <div key={key} className="admin-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-xl font-bold text-${color}-400`}>€{totals[key].toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{invoices.filter(i => i.status === key).length} invoice(s)</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Input
          placeholder="Search by title or vendor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs text-sm"
        />
        <div className="flex gap-1">
          {['all',...Object.keys(STATUS)].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors border ${filter === s ? 'bg-[hsl(var(--admin-primary))]/15 text-[hsl(var(--admin-primary))] border-[hsl(var(--admin-primary))]/30' : 'border-[hsl(var(--admin-border))] text-muted-foreground hover:text-foreground'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[hsl(var(--admin-border))]">
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Vendor</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No invoices found</td></tr>
            )}
            {filtered.map(inv => {
              const st = STATUS[inv.status] || STATUS.pending;
              const fileUrl = inv.invoiceFile ? pb.files.getURL(inv, inv.invoiceFile) : null;
              return (
                <tr key={inv.id} className="border-b border-[hsl(var(--admin-border))]/50 hover:bg-[hsl(var(--admin-border))]/30">
                  <td className="px-4 py-3 font-medium text-foreground">{inv.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.vendor}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{inv.currency || 'EUR'}{(inv.amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{inv.dueDate || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`${st.cls} text-xs gap-1`}>
                      <st.icon className="h-3 w-3" />{st.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {fileUrl
                      ? <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--admin-primary))] hover:underline flex items-center gap-1 text-xs"><Download className="h-3.5 w-3.5" />PDF</a>
                      : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {inv.status === 'pending' && (
                        <button onClick={() => updateStatus(inv.id, 'paid')} className="text-xs text-green-400 hover:underline">Mark paid</button>
                      )}
                      {inv.status === 'pending' && (
                        <button onClick={() => updateStatus(inv.id, 'overdue')} className="text-xs text-red-400 hover:underline">Overdue</button>
                      )}
                      <button onClick={() => remove(inv.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle>Add Invoice</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title</label>
                <Input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Vendor / Supplier</label>
                <Input value={form.vendor} onChange={e => setForm(p=>({...p,vendor:e.target.value}))} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                <Input type="number" value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Due date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Invoice file (PDF)</label>
              <input type="file" accept=".pdf,.png,.jpg" onChange={e => setFile(e.target.files[0])}
                className="text-sm text-muted-foreground file:mr-3 file:text-xs file:bg-[hsl(var(--admin-border))] file:text-foreground file:border-0 file:rounded-lg file:px-3 file:py-1.5 file:cursor-pointer" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
              <Input value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} className="text-sm" />
            </div>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminInvoicesPage;
