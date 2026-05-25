import React, { useState, useEffect, useRef } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Plus, Trash2, Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const MAX_FILES = 5;

const FileUploadZone = ({ side, files, previews, onAdd, onRemove, inputRef }) => (
  <div>
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={onAdd}
    />
    {previews.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2">
        {previews.map((url, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border shrink-0">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-md"
              onClick={() => onRemove(i)}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {files.length < MAX_FILES && (
          <button
            type="button"
            className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}
      </div>
    )}
    {previews.length === 0 && (
      <button
        type="button"
        className="w-full py-6 rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-6 w-6" />
        <span>Upload {side} photos</span>
      </button>
    )}
  </div>
);

const PortfolioManager = ({ contractorId, dialogOpen: externalOpen, onDialogOpenChange: setExternalOpen }) => {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled (from Dashboard header) and uncontrolled (internal Add buttons) open state
  const dialogOpen = externalOpen ?? internalOpen;
  const setDialogOpen = (val) => {
    setInternalOpen(val);
    setExternalOpen?.(val);
  };
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [beforeFiles, setBeforeFiles] = useState([]);
  const [afterFiles, setAfterFiles] = useState([]);
  const [beforePreviews, setBeforePreviews] = useState([]);
  const [afterPreviews, setAfterPreviews] = useState([]);

  const beforeInputRef = useRef(null);
  const afterInputRef  = useRef(null);

  const fetchItems = async () => {
    try {
      const data = await pb.collection('portfolio_items').getFullList({
        filter: `contractorId = "${contractorId}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setItems(data);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [contractorId]);

  const handleFileChange = (e, side) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const previews = files.map(f => URL.createObjectURL(f));
    if (side === 'before') {
      setBeforeFiles(prev => [...prev, ...files].slice(0, MAX_FILES));
      setBeforePreviews(prev => [...prev, ...previews].slice(0, MAX_FILES));
    } else {
      setAfterFiles(prev => [...prev, ...files].slice(0, MAX_FILES));
      setAfterPreviews(prev => [...prev, ...previews].slice(0, MAX_FILES));
    }
    e.target.value = '';
  };

  const removeFile = (side, idx) => {
    if (side === 'before') {
      setBeforeFiles(f => f.filter((_, i) => i !== idx));
      setBeforePreviews(p => {
        URL.revokeObjectURL(p[idx]);
        return p.filter((_, i) => i !== idx);
      });
    } else {
      setAfterFiles(f => f.filter((_, i) => i !== idx));
      setAfterPreviews(p => {
        URL.revokeObjectURL(p[idx]);
        return p.filter((_, i) => i !== idx);
      });
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    beforePreviews.forEach(u => URL.revokeObjectURL(u));
    afterPreviews.forEach(u => URL.revokeObjectURL(u));
    setBeforeFiles([]);
    setAfterFiles([]);
    setBeforePreviews([]);
    setAfterPreviews([]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title required', description: 'Add a short project title.', variant: 'destructive' });
      return;
    }
    if (!beforeFiles.length && !afterFiles.length) {
      toast({ title: 'Photos required', description: 'Upload at least one photo.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('contractorId', contractorId);
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      beforeFiles.forEach(f => formData.append('beforePhotos', f));
      afterFiles.forEach(f => formData.append('afterPhotos', f));

      await pb.collection('portfolio_items').create(formData);
      toast({ title: 'Project added' });
      resetForm();
      setDialogOpen(false);
      await fetchItems();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    setDeletingId(item.id);
    try {
      await pb.collection('portfolio_items').delete(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast({ title: 'Project removed' });
    } catch (err) {
      toast({ title: 'Could not delete', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const getThumb = (item) => {
    const filename = item.afterPhotos?.[0] || item.beforePhotos?.[0];
    return filename ? pb.files.getURL(item, filename, { thumb: '400x300' }) : null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-video rounded-xl" />)}
      </div>
    );
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
          <ImagePlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Before &amp; after photos are the #1 trust signal for new clients
          </p>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1.5" /> Add your first project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(item => {
            const thumb = getThumb(item);
            return (
              <div
                key={item.id}
                className="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted"
              >
                {thumb
                  ? <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No photo</div>
                }
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-2 gap-1.5">
                  <p className="text-white text-xs font-semibold truncate flex-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.title}
                  </p>
                  <button
                    type="button"
                    className="shrink-0 p-1.5 bg-destructive/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                </div>
              </div>
            );
          })}
          <button
            type="button"
            className="aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs">Add project</span>
          </button>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={open => { if (!open) resetForm(); setDialogOpen(open); }}
      >
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Portfolio Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Project title *</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Kitchen Renovation, Bathroom Retile"
                className="mt-1.5 bg-input border-border"
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What was done, materials used, duration..."
                className="mt-1.5 bg-input border-border min-h-[72px]"
              />
            </div>

            <div>
              <Label className="mb-1.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/60 shrink-0" />
                Before photos (up to {MAX_FILES})
              </Label>
              <FileUploadZone
                side="before"
                files={beforeFiles}
                previews={beforePreviews}
                onAdd={e => handleFileChange(e, 'before')}
                onRemove={i => removeFile('before', i)}
                inputRef={beforeInputRef}
              />
            </div>

            <div>
              <Label className="mb-1.5 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0" />
                After photos (up to {MAX_FILES})
              </Label>
              <FileUploadZone
                side="after"
                files={afterFiles}
                previews={afterPreviews}
                onAdd={e => handleFileChange(e, 'after')}
                onRemove={i => removeFile('after', i)}
                inputRef={afterInputRef}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => { resetForm(); setDialogOpen(false); }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading…</>
                  : 'Save project'
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PortfolioManager;
