import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import LocationPicker from '@/components/LocationPicker.jsx';

const RequestForm = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usingDefault, setUsingDefault] = useState(false);
  const [formData, setFormData] = useState({
    categoryId: '',
    budget: '',
    description: '',
    durationEstimate: '',
    location: '',
    latitude: null,
    longitude: null
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await pb.collection('categories').getFullList({ $autoCancel: false });
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDefaultLocation = async () => {
      if (currentUser?.userType === 'client') {
        try {
          const existing = await pb.collection('client_locations').getList(1, 1, { 
            filter: `clientId="${currentUser.id}"`, 
            $autoCancel: false 
          });
          if (existing.items.length > 0) {
            const loc = existing.items[0];
            setFormData(prev => ({
              ...prev,
              latitude: loc.latitude,
              longitude: loc.longitude,
              location: loc.address || `${loc.latitude}, ${loc.longitude}`
            }));
            setUsingDefault(true);
          }
        } catch (error) {
          console.error('Error fetching default location:', error);
        }
      }
    };
    fetchDefaultLocation();
  }, [currentUser]);

  const handleLocationSelect = (pos) => {
    setFormData(prev => ({
      ...prev,
      latitude: pos.lat,
      longitude: pos.lng,
      location: pos.address || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`
    }));
    setUsingDefault(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.latitude || !formData.longitude) {
      toast({ title: "Missing fields", description: "Please select a service and location.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await pb.collection('auction_tickets').create({
        clientId: currentUser.id,
        categoryId: formData.categoryId,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        description: formData.description,
        durationEstimate: formData.durationEstimate,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        status: 'Open'
      }, { $autoCancel: false });

      toast({ title: "Success", description: "Your request has been created." });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({ title: "Error", description: "Could not create request.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t('auction.service_needed')}</Label>
        <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})} required>
          <SelectTrigger className="bg-input border-border text-foreground">
            <SelectValue placeholder={t('professions.select')} />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {t(`professions.${cat.name}`, { defaultValue: cat.name })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('auction.select_request_location')}</Label>
          {usingDefault && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <MapPin className="w-3 h-3 mr-1" />
              {t('auction.using_default_location')}
            </Badge>
          )}
        </div>
        <LocationPicker 
          initialLocation={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : null}
          onLocationSelect={handleLocationSelect} 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('auction.budget')} (€)</Label>
          <Input 
            type="number" 
            min="0" 
            step="0.01"
            value={formData.budget} 
            onChange={(e) => setFormData({...formData, budget: e.target.value})}
            className="bg-input border-border text-foreground"
            placeholder="e.g. 150"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('auction.duration_estimate')}</Label>
          <Select value={formData.durationEstimate} onValueChange={(val) => setFormData({...formData, durationEstimate: val})}>
            <SelectTrigger className="bg-input border-border text-foreground">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-2 hours">1-2 hours</SelectItem>
              <SelectItem value="Half day">Half day</SelectItem>
              <SelectItem value="Full day">Full day</SelectItem>
              <SelectItem value="Multiple days">Multiple days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('auction.description')}</Label>
        <Textarea 
          value={formData.description} 
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="bg-input border-border text-foreground min-h-[100px]"
          placeholder="Describe what needs to be done..."
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
          {t('auction.create_request')}
        </Button>
      </div>
    </form>
  );
};

export default RequestForm;