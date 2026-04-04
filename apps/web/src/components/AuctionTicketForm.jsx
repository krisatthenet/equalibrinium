import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10;

const AuctionTicketForm = ({ onSuccess, onCancel, initialData = null, ticketId = null, assignedContractorId = null, assignedContractorName = null }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const isEditing = !!ticketId;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [formData, setFormData] = useState({
    categoryId: initialData?.categoryId || '',
    description: initialData?.description || '',
    budget: initialData?.budget || '',
    durationEstimate: initialData?.durationEstimate || '',
    location: initialData?.location || ''
  });

  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const records = await pb.collection('categories').getFullList({
          sort: 'name',
          $autoCancel: false
        });
        setCategories(records);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => {
        if (preview.url) URL.revokeObjectURL(preview.url);
      });
    };
  }, [filePreviews]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCategoryChange = (value) => {
    setFormData(prev => ({ ...prev, categoryId: value }));
  };

  const processFiles = (newFiles) => {
    const validFiles = [];
    const newPreviews = [];

    Array.from(newFiles).forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast({ title: "File too large", description: `${file.name} exceeds 5MB limit.`, variant: "destructive" });
        return;
      }
      if (!file.type.match(/(jpeg|png|gif|webp|pdf)$/i)) {
        toast({ title: "Invalid format", description: `${file.name} is not supported.`, variant: "destructive" });
        return;
      }
      
      validFiles.push(file);
      
      if (file.type.startsWith('image/')) {
        newPreviews.push({ file, url: URL.createObjectURL(file), type: 'image' });
      } else {
        newPreviews.push({ file, url: null, type: 'pdf' });
      }
    });

    if (files.length + validFiles.length > MAX_FILES) {
      toast({ title: "Too many files", description: `Maximum ${MAX_FILES} files allowed.`, variant: "destructive" });
      const allowedCount = MAX_FILES - files.length;
      setFiles(prev => [...prev, ...validFiles.slice(0, allowedCount)]);
      setFilePreviews(prev => [...prev, ...newPreviews.slice(0, allowedCount)]);
    } else {
      setFiles(prev => [...prev, ...validFiles]);
      setFilePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      const newPreviews = [...prev];
      if (newPreviews[index].url) URL.revokeObjectURL(newPreviews[index].url);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast({ title: "Required Field", description: "Please select a category.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('categoryId', formData.categoryId);
      submitData.append('description', formData.description);
      if (formData.budget) submitData.append('budget', formData.budget);
      if (formData.durationEstimate) submitData.append('durationEstimate', formData.durationEstimate);
      if (formData.location) submitData.append('location', formData.location);

      // Geocode location to coordinates if available
      if (formData.location && window.google?.maps?.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          await new Promise((resolve) => {
            geocoder.geocode({ address: formData.location }, (results, status) => {
              if (status === 'OK' && results[0]) {
                submitData.append('latitude', results[0].geometry.location.lat());
                submitData.append('longitude', results[0].geometry.location.lng());
              }
              resolve();
            });
          });
        } catch (_) { /* geocoding optional */ }
      }

      if (isEditing) {
        files.forEach(file => submitData.append('files', file));
        await pb.collection('auction_tickets').update(ticketId, submitData, { $autoCancel: false });
        toast({ title: "Success", description: "Request updated successfully." });
      } else {
        submitData.append('clientId', currentUser.id);
        submitData.append('status', 'Open');
        if (assignedContractorId) {
          submitData.append('assignedContractorId', assignedContractorId);
          submitData.append('isDirect', 'true');
        }
        files.forEach(file => submitData.append('files', file));
        await pb.collection('auction_tickets').create(submitData, { $autoCancel: false });
        toast({ title: "Success", description: assignedContractorId ? "Direct request sent!" : "Request created successfully." });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({ title: "Error", description: isEditing ? "Failed to update request." : "Failed to create request.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {assignedContractorName && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary font-medium">
          Direct request to <span className="font-bold">{assignedContractorName}</span> — only they will see this request.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="categoryId">{t('upload.selectCategory')} *</Label>
        <Select value={formData.categoryId} onValueChange={handleCategoryChange} required>
          <SelectTrigger className="bg-input border-border border-l-2 border-l-primary text-foreground rounded-lg">
            <SelectValue placeholder={t('upload.selectCategory')} />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('auction.description')} *</Label>
        <Textarea 
          id="description" name="description" required
          value={formData.description} onChange={handleChange}
          className="bg-input border-border border-l-2 border-l-primary text-foreground min-h-[100px] rounded-lg"
          placeholder="Describe what you need help with..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">{t('auction.budget')} (€)</Label>
          <Input 
            id="budget" name="budget" type="number" min="1"
            value={formData.budget} onChange={handleChange}
            className="bg-input border-border border-l-2 border-l-primary text-foreground rounded-lg"
            placeholder="e.g. 500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationEstimate">{t('auction.duration_estimate')}</Label>
          <Input 
            id="durationEstimate" name="durationEstimate" type="text"
            value={formData.durationEstimate} onChange={handleChange}
            className="bg-input border-border border-l-2 border-l-primary text-foreground rounded-lg"
            placeholder="e.g. 2 days, 1 week"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t('auth.location')}</Label>
        <Input 
          id="location" name="location" type="text"
          value={formData.location} onChange={handleChange}
          className="bg-input border-border text-foreground rounded-lg"
          placeholder="City or address"
        />
      </div>

      <div className="space-y-3">
        <Label>{t('upload.uploadImagesOrPdf')}</Label>
        <div 
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 cursor-pointer
            ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">{t('upload.dropFilesHere')}</p>
          <p className="text-xs text-muted-foreground">{t('upload.supportedFormats')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('upload.maxFileSize')}</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInput} 
            className="hidden" 
            multiple 
            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf" 
          />
        </div>

        {filePreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {filePreviews.map((preview, index) => (
              <div key={index} className="relative group aspect-square rounded-lg border border-border overflow-hidden bg-muted flex items-center justify-center">
                {preview.type === 'image' ? (
                  <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center p-2 text-center">
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <span className="text-xs text-muted-foreground truncate w-full px-2">{preview.file.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  title={t('upload.removeFile')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="rounded-xl">
            {t('auction.cancel')}
          </Button>
        )}
        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t('settings.save_changes') : t('auction.create_request')}
        </Button>
      </div>
    </form>
  );
};

export default AuctionTicketForm;