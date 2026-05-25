import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import AdminLayout from '@/components/AdminLayout.jsx';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2, Trash2, ChevronRight, Calendar, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const COLUMNS = [
  { key: 'backlog',    label: 'Backlog',      color: 'text-muted-foreground' },
  { key: 'todo',       label: 'To Do',         color: 'text-blue-400' },
  { key: 'inprogress', label: 'In Progress',   color: 'text-yellow-400' },
  { key: 'review',     label: 'Review',        color: 'text-purple-400' },
  { key: 'done',       label: 'Done',          color: 'text-green-400' },
];

const PRIORITY_STYLE = {
  low:    'bg-muted text-muted-foreground border-border',
  normal: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  high:   'bg-orange-500/15 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/15 text-red-400 border-red-500/20',
};

const DEPARTMENTS = ['engineering','marketing','cs','operations','finance','hr'];

const AdminBoardPage = () => {
  const { toast } = useToast();
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deptFilter, setDeptFilter]     = useState('all');

  const [form, setForm] = useState({
    title: '', description: '', status: 'backlog', priority: 'normal',
    department: 'engineering', assigneeEmail: '', dueDate: '', tags: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const data = await pb.collection('admin_tasks').getFullList({ sort: '-created', $autoCancel: false });
      setTasks(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveTask = async () => {
    if (!form.title) return;
    setSaving(true);
    try {
      if (selectedTask?.id) {
        await pb.collection('admin_tasks').update(selectedTask.id, form, { $autoCancel: false });
        toast({ title: 'Task updated' });
      } else {
        await pb.collection('admin_tasks').create(form, { $autoCancel: false });
        toast({ title: 'Task created' });
      }
      setShowForm(false);
      setSelectedTask(null);
      setForm({ title: '', description: '', status: 'backlog', priority: 'normal', department: 'engineering', assigneeEmail: '', dueDate: '', tags: '' });
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const moveTask = async (task, newStatus) => {
    try {
      await pb.collection('admin_tasks').update(task.id, { status: newStatus }, { $autoCancel: false });
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const deleteTask = async (id) => {
    try {
      await pb.collection('admin_tasks').delete(id, { $autoCancel: false });
      await fetchData();
    } catch (err) { toast({ title: 'Error', description: err.message, variant: 'destructive' }); }
  };

  const openEdit = (task) => {
    setSelectedTask(task);
    setForm({ title: task.title, description: task.description||'', status: task.status||'backlog', priority: task.priority||'normal', department: task.department||'engineering', assigneeEmail: task.assigneeEmail||'', dueDate: task.dueDate||'', tags: task.tags||'' });
    setShowForm(true);
  };

  const filtered = tasks.filter(t => deptFilter === 'all' || t.department === deptFilter);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <Helmet><title>Board - Admin Portal</title></Helmet>

      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team Board</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tasks.length} tasks across all departments</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="text-sm bg-[hsl(var(--admin-sidebar))] border border-[hsl(var(--admin-border))] rounded-lg px-3 py-2 text-foreground"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <Button onClick={() => { setSelectedTask(null); setForm({ title:'',description:'',status:'backlog',priority:'normal',department:'engineering',assigneeEmail:'',dueDate:'',tags:'' }); setShowForm(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => (t.status || 'backlog') === col.key);
          return (
            <div key={col.key} className="flex-shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3">
                <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                <span className="text-xs text-muted-foreground bg-[hsl(var(--admin-border))] px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              <div className="space-y-2 min-h-20">
                {colTasks.map(task => {
                  const ps = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.normal;
                  const nextCol = COLUMNS[COLUMNS.findIndex(c => c.key === col.key) + 1];
                  return (
                    <div
                      key={task.id}
                      className="admin-card p-3 cursor-pointer hover:border-[hsl(var(--admin-primary))]/40 transition-colors group"
                      onClick={() => openEdit(task)}
                    >
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <p className="text-sm text-foreground font-medium leading-snug line-clamp-2">{task.title}</p>
                        <button
                          onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-2">
                        <Badge variant="outline" className={`${ps} text-[10px] px-1.5 py-0 capitalize`}>{task.priority}</Badge>
                        {task.department && (
                          <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px] px-1.5 py-0 capitalize">{task.department}</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          {task.assigneeEmail && <span className="truncate">{task.assigneeEmail.split('@')[0]}</span>}
                          {task.dueDate && (
                            <span className="flex items-center gap-0.5 shrink-0">
                              <Calendar className="h-2.5 w-2.5" />{task.dueDate}
                            </span>
                          )}
                        </div>
                        {nextCol && (
                          <button
                            onClick={e => { e.stopPropagation(); moveTask(task, nextCol.key); }}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 text-[hsl(var(--admin-primary))] hover:underline shrink-0 transition-opacity"
                            title={`Move to ${nextCol.label}`}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Add to this column shortcut */}
                <button
                  onClick={() => { setSelectedTask(null); setForm(p => ({...p, status: col.key})); setShowForm(true); }}
                  className="w-full py-2 text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-[hsl(var(--admin-border))]/50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Add card
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task form dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setSelectedTask(null); }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} className="text-sm" placeholder="Task title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Input value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} className="text-sm" placeholder="Optional details" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}
                  className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                <select value={form.priority} onChange={e => setForm(p=>({...p,priority:e.target.value}))}
                  className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2">
                  {['low','normal','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Department</label>
                <select value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))}
                  className="w-full text-sm bg-input border border-border rounded-lg px-3 py-2">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Due date</label>
                <Input type="date" value={form.dueDate} onChange={e => setForm(p=>({...p,dueDate:e.target.value}))} className="text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Assignee email</label>
              <Input value={form.assigneeEmail} onChange={e => setForm(p=>({...p,assigneeEmail:e.target.value}))} className="text-sm" placeholder="team@workbee.space" />
            </div>
            <Button className="w-full" onClick={saveTask} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {selectedTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBoardPage;
