
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Save, RefreshCw, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface WatermarkSettings {
  id: string;
  logo_url: string;
  opacity: number;
  watermark_size: number;
  watermark_margin: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

const WatermarkSettings = () => {
  const [settings, setSettings] = useState<WatermarkSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('watermark_settings')
        .select('*')
        .single();

      if (error) {
        console.error("Error loading watermark settings:", error);
        toast.error("Failed to load watermark settings");
        return;
      }

      setSettings(data);
    } catch (error) {
      console.error("Unexpected error loading watermark settings:", error);
      toast.error("Failed to load watermark settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('watermark_settings')
        .update({
          logo_url: settings.logo_url,
          opacity: settings.opacity,
          watermark_size: settings.watermark_size,
          watermark_margin: settings.watermark_margin,
          enabled: settings.enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id);

      if (error) {
        console.error("Error saving watermark settings:", error);
        toast.error("Failed to save watermark settings");
        return;
      }

      toast.success("Watermark settings saved successfully");
    } catch (error) {
      console.error("Unexpected error saving watermark settings:", error);
      toast.error("Failed to save watermark settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `logos/${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        toast.error('Failed to upload logo');
        return;
      }

      const logoUrl = `assets/${fileName}`;
      
      if (settings) {
        setSettings({ ...settings, logo_url: logoUrl });
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Unexpected error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin mr-2" size={16} />
            Loading watermark settings...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">No watermark settings found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watermark Settings</CardTitle>
        <CardDescription>
          Configure watermarks for property images. All uploaded images will automatically include the 14ForRent logo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings({ ...settings, enabled })}
          />
          <Label htmlFor="enabled">Enable watermarking</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo_upload">Watermark Logo</Label>
          <div className="flex items-center space-x-4">
            <Input
              id="logo_upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={!settings.enabled || isUploading}
              className="flex-1"
            />
            <Button
              onClick={() => document.getElementById('logo_upload')?.click()}
              disabled={!settings.enabled || isUploading}
              variant="outline"
              className="flex gap-2 items-center"
            >
              <Upload size={16} />
              {isUploading ? "Uploading..." : "Upload Logo"}
            </Button>
          </div>
          <p className="text-sm text-gray-500">Current: {settings.logo_url}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="watermark_size">Logo Size: {settings.watermark_size}px</Label>
          <Slider
            id="watermark_size"
            min={64}
            max={256}
            step={8}
            value={[settings.watermark_size]}
            onValueChange={(value) => setSettings({ ...settings, watermark_size: value[0] })}
            disabled={!settings.enabled}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="watermark_margin">Margin: {settings.watermark_margin}px</Label>
          <Slider
            id="watermark_margin"
            min={8}
            max={64}
            step={4}
            value={[settings.watermark_margin]}
            onValueChange={(value) => setSettings({ ...settings, watermark_margin: value[0] })}
            disabled={!settings.enabled}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="opacity">Opacity: {Math.round(settings.opacity * 100)}%</Label>
          <Slider
            id="opacity"
            min={0}
            max={1}
            step={0.1}
            value={[settings.opacity]}
            onValueChange={(value) => setSettings({ ...settings, opacity: value[0] })}
            disabled={!settings.enabled}
            className="w-full"
          />
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All new images uploaded for listings will automatically include the watermark 
            at bottom-right position with 50% opacity as required. Changes to these settings will only affect 
            newly uploaded images.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex gap-2 items-center"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WatermarkSettings;
