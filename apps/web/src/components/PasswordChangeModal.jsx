import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const PasswordChangeModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      toast({
        title: "Invalid Password",
        description: "New password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await pb.collection('users').update(currentUser.id, {
        oldPassword: formData.oldPassword,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm
      }, { $autoCancel: false });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed."
      });
      
      setFormData({ oldPassword: '', password: '', passwordConfirm: '' });
      onClose();
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: "Update Failed",
        description: error.response?.message || "Failed to change password. Please check your current password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>{t('password_modal.title')}</DialogTitle>
          <DialogDescription>
            {t('password_modal.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">{t('password_modal.current')}</Label>
            <Input
              id="oldPassword"
              name="oldPassword"
              type="password"
              required
              value={formData.oldPassword}
              onChange={handleChange}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password_modal.new_password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="bg-input border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passwordConfirm">{t('password_modal.confirm')}</Label>
            <Input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              required
              minLength={8}
              value={formData.passwordConfirm}
              onChange={handleChange}
              className="bg-input border-border text-foreground"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('password_modal.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('password_modal.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordChangeModal;