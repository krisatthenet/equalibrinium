import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Check, Trash2, TrendingUp, Wallet, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DEPARTMENTS = ['engineering','marketing','cs','operations','finance','hr'];
const CATEGORIES  = ['salary','software','marketing','infrastructure','travel','office','misc'];

const deptColor = {
  engineering: 'bg-blue-500/15 text-blue-400',
  marketing:   'bg-purple-500/15 text-purple-400',
  cs:          'bg-green-500/15 text-green-400',
  operations:  'bg-yellow-500/15 text-yellow-400',
  finance:     'bg-orange-500/15 text-orange-400',
  hr:          'bg-pink-500/15 text-pink-400',
};

const currentPeriod = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};

const AdminFinancePage = () => {
  const { toast } = useToast();
  const [tab, setTab]             = useState('budgets');
  const [budgets, setBudgets]     = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);

  // Budget form
  const [bForm, setBForm] = useState({ department: 'engineering', period: currentPeriod(), allocated: '', currency: 'EUR', notes: '' });
  // Expense form
  const [eForm, setEForm] = useState({ department: 'engineering', amount: '', currency: 'EUR', category: 'software', description: '', date: new Date().toISOString().slice(0,10), submittedBy: '' });

  const fetchData = useCallback(async () => {
    try {
      const [b, e] = await Promise.all([
        pb.collection('budgets').getFullList({ sort: '-period', $autoCancel: false }),
        pb.collection('expenses').getFullList({ sort: '-date', $autoCancel: false }),
      ]);
      setBudgets(b);
      setExpenses(e);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveBudget = async () => {
    if (!bForm.allocated) return;
    setSaving(true);
    try {
      await pb.collection('budgets').create({ ...bForm, allocated: Number(bForm.allocated), spent: 0 }, { $autoCancel: false });
      toast({ title: 'Budget created' });
      setShowForm(false);
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const saveExpense = async () => {
    if (!eForm.amount || !eForm.description) return;
    setSaving(true);
    try {
      await pb.collection('expenses').create({ ...eForm, amount: Number(eForm.amount), approved: false }, { $autoCancel: false });
      // Increment spent on matching budget
      const match = budgets.find(b => b.department === eForm.department && b.period === eForm.date.slice(0,7));
      if (match) await pb.collection('budgets').update(match.id, { spent: (match.spent || 0) + Number(eForm.amount) }, { $autoCancel: false });
      toast({ title: 'Expense logged' });
      setShowForm(false);
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const deleteRecord = async (collection, id) => {
    try {
      await pb.collection(collection).delete(id, { $autoCancel: false });
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const toggleApproved = async (exp) => {
    await pb.collection('expenses').update(exp.id, { approved: !exp.approved }, { $autoCancel: false });
    await fetchData();
  };

  // Budget summary per dept for current period
  const period = currentPeriod();
  const summary = DEPARTMENTS.map(dept => {
    const b = budgets.find(x => x.department === dept && x.period === period);
    const spent = expenses.filter(e => e.department === dept && e.date?.startsWith(period)).reduce((s,e) => s + (e.amount||0), 0);
    return { dept, allocated: b?.allocated || 0, spent, currency: b?.currency || 'EUR' };
  }).filter(s => s.allocated > 0 || s.spent > 0);

  const totalAllocated = summary.reduce((s,x) => s + x.allocated, 0);
  const totalSpent     = summary.reduce((s,x) => s + x.spent, 0);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <Helmet><title>Finance - Admin Portal</title></Helmet>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Budgets, expenses — {period}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add {tab === 'budgets' ? 'Budget' : 'Expense'}
        </Button>
      </div>

      {/* Summary cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="admin-card p-5">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" />Total Allocated</p>
            <p className="text-2xl font-bold text-white">€{totalAllocated.toLocaleString()}</p>
          </div>
          <div className="admin-card p-5">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Receipt className="h-3.5 w-3.5" />Total Spent</p>
            <p className="text-2xl font-bold text-white">€{totalSpent.toLocaleString()}</p>
          </div>
          <div className="admin-card p-5">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />Remaining</p>
            <p className={`text-2xl font-bold ${totalAllocated - totalSpent < 0 ? 'text-red-400' : 'text-green-400'}`}>
              €{(totalAllocated - totalSpent).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Budget bars */}
      {summary.length > 0 && (
        <div className="admin-card p-5 mb-6">
          <p className="text-sm font-semibold text-white mb-4">Department Burn Rate — {period}</p>
          <div className="space-y-3">
            {summary.map(({ dept, allocated, spent, currency }) => {
              const pct = allocated > 0 ? Math.min(100, Math.round(spent / allocated * 100)) : 100;
              return (
                <div key={dept}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground capitalize">{dept}</span>
                    <span className="text-muted-foreground">{currency}{spent.toLocaleString()} / {currency}{allocated.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[hsl(var(--admin-border))] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab selector */}
      <div className="flex gap-1 mb-4 border-b border-[hsl(var(--admin-border))] pb-0">
        {['budgets','expenses'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${tab === t ? 'border-[hsl(var(--admin-primary))] text-[hsl(var(--admin-primary))]' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t} ({t === 'budgets' ? budgets.length : expenses.length})
          </button>
        ))}
      </div>

      {/* Budgets table */}
      {tab === 'budgets' && (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[hsl(var(--admin-border))]">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Allocated</th>
                <th className="px-4 py-3">Spent</th>
                <th className="px-4 py-3">Remaining</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {budgets.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No budgets yet</td></tr>
              )}
              {budgets.map(b => (
                <tr key={b.id} className="border-b border-[hsl(var(--admin-border))]/50 hover:bg-[hsl(var(--admin-border))]/30">
                  <td className="px-4 py-3"><Badge className={`${deptColor[b.department]} capitalize border-0 text-xs`}>{b.department}</Badge></td>
                  <td className="px-4 py-3 text-foreground">{b.period}</td>
                  <td className="px-4 py-3 text-foreground font-medium">{b.currency}{(b.allocated||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.currency}{(b.spent||0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={b.allocated - b.spent < 0 ? 'text-red-400' : 'text-green-400'}>
                      {b.currency}{(b.allocated - (b.spent||0)).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-32">{b.notes}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRecord('budgets', b.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expenses table */}
      {tab === 'expenses' && (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-[hsl(var(--admin-border))]">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">Approved</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">No expenses logged yet</td></tr>
              )}
              {expenses.map(e => (
                <tr key={e.id} className="border-b border-[hsl(var(--admin-border))]/50 hover:bg-[hsl(var(--admin-border))]/30">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.date}</td>
                  <td className="px-4 py-3"><Badge className={`${deptColor[e.department]} capitalize border-0 text-xs`}>{e.department}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs capitalize">{e.category}</td>
                  <td className="px-4 py-3 text-foreground text-xs max-w-48 truncate">{e.description}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.currency}{(e.amount||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.submittedBy}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleApproved(e)} className={`transition-colors ${e.approved ? 'text-green-400' : 'text-muted-foreground hover:text-green-400'}`}>
                      <Check className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRecord('expenses', e.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add form dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{tab === 'budgets' ? 'New Budget' : 'Log Expense'}</DialogTitle>
          </DialogHeader>

          {tab === 'budgets' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                  <select value={bForm.department} onChange={e => setBForm(p => ({...p, department: e.target.value}))}
                    className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Period (YYYY-MM)</label>
                  <Input value={bForm.period} onChange={e => setBForm(p => ({...p, period: e.target.value}))} className="text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Allocated amount</label>
                  <Input type="number" value={bForm.allocated} onChange={e => setBForm(p => ({...p, allocated: e.target.value}))} placeholder="0" className="text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                  <Input value={bForm.currency} onChange={e => setBForm(p => ({...p, currency: e.target.value}))} placeholder="EUR" className="text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Notes</label>
                <Input value={bForm.notes} onChange={e => setBForm(p => ({...p, notes: e.target.value}))} className="text-sm" />
              </div>
              <Button className="w-full" onClick={saveBudget} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                  <select value={eForm.department} onChange={e => setEForm(p => ({...p, department: e.target.value}))}
                    className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                  <select value={eForm.category} onChange={e => setEForm(p => ({...p, category: e.target.value}))}
                    className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                  <Input type="number" value={eForm.amount} onChange={e => setEForm(p => ({...p, amount: e.target.value}))} placeholder="0" className="text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                  <Input type="date" value={eForm.date} onChange={e => setEForm(p => ({...p, date: e.target.value}))} className="text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Input value={eForm.description} onChange={e => setEForm(p => ({...p, description: e.target.value}))} className="text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Submitted by</label>
                <Input value={eForm.submittedBy} onChange={e => setEForm(p => ({...p, submittedBy: e.target.value}))} className="text-sm" placeholder="Name or email" />
              </div>
              <Button className="w-full" onClick={saveExpense} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Log Expense
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFinancePage;
