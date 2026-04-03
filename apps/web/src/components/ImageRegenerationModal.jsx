import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { useImageGeneration } from '@/contexts/ImageGenerationContext.jsx';
import { useToast } from '@/hooks/use-toast';
import pb from '@/lib/pocketbaseClient';

const ImageRegenerationModal = ({ isOpen, onClose, userId, currentImageUrl, imageType = 'profilePicture', onSuccess }) => {
  const { t } = useTranslation();
  const { generateProfileImage, downloadAndStore, isGenerating } = useImageGeneration();
  const { toast } = useToast();
  
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generatedFile, setGeneratedFile] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!userId) return;
    
    try {
      // 1. Generate Image via DALL-E
      const genRes = await generateProfileImage({
        userType: 'user', // Fallback, backend can use customPrompt primarily
        name: 'User',
        role: 'Professional',
        customPrompt: customPrompt || 'A professional, high-quality portrait avatar, modern and clean.'
      });

      // 2. Download and get base64
      const dlRes = await downloadAndStore({
        imageUrl: genRes.imageUrl,
        userId: userId,
        imageType: imageType
      });

      // 3. Convert to File for preview and saving
      const res = await fetch(`data:${dlRes.mimeType};base64,${dlRes.base64}`);
      const blob = await res.blob();
      const file = new File([blob], `${imageType}.png`, { type: dlRes.mimeType });
      
      setPreviewUrl(`data:${dlRes.mimeType};base64,${dlRes.base64}`);
      setGeneratedFile(file);
      setGeneratedPrompt(genRes.revisedPrompt || customPrompt);
      
      toast({ title: "Image Generated", description: "Preview your new image before saving." });
    } catch (error) {
      console.error('Generation error:', error);
      toast({ 
        title: "Generation Failed", 
        description: error.message || "Could not generate image. Please try again.", 
        variant: "destructive" 
      });
    }
  };

  const handleSave = async () => {
    if (!generatedFile || !userId) return;
    
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append(imageType, generatedFile);
      
      // If updating profile picture, also update avatar to match
      if (imageType === 'profilePicture') {
        formData.append('avatar', generatedFile);
      }
      
      formData.append('generatedImagePrompt', generatedPrompt);

      await pb.collection('users').update(userId, formData, { $autoCancel: false });
      
      toast({ title: "Image Saved", description: "Your profile has been updated successfully." });
      if (onSuccess) onSuccess();
      handleClose();
    } catch (error) {
      console.error('Save error:', error);
      toast({ title: "Save Failed", description: "Could not save the image to your profile.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCustomPrompt('');
    setPreviewUrl(null);
    setGeneratedFile(null);
    setGeneratedPrompt('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Regenerate Profile Image
          </DialogTitle>
          <DialogDescription>
            Use AI to generate a unique, high-quality profile picture. Describe what you want or leave it blank for a surprise.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center py-4">
          {/* Current Image */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-muted-foreground">Current</Label>
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center">
              {currentImageUrl ? (
                <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
              )}
            </div>
          </div>

          <ArrowRight className="hidden md:block w-6 h-6 text-muted-foreground" />

          {/* New Image Preview */}
          <div className="flex flex-col items-center gap-3">
            <Label className="text-primary font-medium">New Generation</Label>
            <div className="w-32 h-32 rounded-2xl overflow-hidden bg-muted border-2 border-dashed border-primary/50 flex items-center justify-center relative">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2 text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-medium">Generating...</span>
                </div>
              ) : previewUrl ? (
                <img src={previewUrl} alt="Generated Preview" className="w-full h-full object-cover" />
              ) : (
                <Sparkles className="w-8 h-8 text-primary/30" />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="prompt">Custom Prompt (Optional)</Label>
          <Textarea
            id="prompt"
            placeholder="e.g. A professional headshot of a software developer in a modern office, cinematic lighting..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="bg-input border-border resize-none h-24 rounded-xl"
            disabled={isGenerating || isSaving}
          />
        </div>

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating || isSaving} className="rounded-xl">
            Cancel
          </Button>
          {!previewUrl ? (
            <Button onClick={handleGenerate} disabled={isGenerating} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl">
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Image
            </Button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={handleGenerate} disabled={isGenerating || isSaving} className="rounded-xl flex-1 sm:flex-none">
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Regenerate
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl flex-1 sm:flex-none">
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Image
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageRegenerationModal;