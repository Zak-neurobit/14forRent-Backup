
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, Eye, EyeOff, AlertCircle } from "lucide-react";

interface GeneralSettingsProps {
  isSaving: boolean;
  onSettingsChange: (settings: {
    apiKey?: string;
    model?: string;
  }) => void;
  onSave?: () => void;
}

export const GeneralSettings = ({ isSaving, onSettingsChange, onSave }: GeneralSettingsProps) => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const models = [
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Recommended)" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4.1-preview", label: "GPT-4.1 Preview" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" }
  ];

  // Validate OpenAI API key format
  const validateApiKey = (key: string): boolean => {
    const trimmedKey = key.trim();
    // OpenAI API keys should start with "sk-" and be at least 20 characters
    return trimmedKey.startsWith('sk-') && trimmedKey.length > 20;
  };

  // Check admin status and load settings
  useEffect(() => {
    const checkAdminAndLoadSettings = async () => {
      try {
        console.log('GeneralSettings: Starting admin check and settings load...');
        
        // Get current user with timeout
        const userPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('User fetch timeout')), 10000)
        );
        
        const { data: { user }, error: userError } = await Promise.race([
          userPromise,
          timeoutPromise
        ]) as any;
        
        if (userError) {
          console.error('GeneralSettings: User error:', userError);
          setIsLoading(false);
          return;
        }

        if (!user) {
          console.log('GeneralSettings: No user found');
          setIsLoading(false);
          return;
        }
        
        console.log('GeneralSettings: User found:', user.id);
        
        // Check admin roles with timeout
        console.log('GeneralSettings: Checking admin roles...');
        const rolesPromise = supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
          
        const rolesTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Roles fetch timeout')), 10000)
        );
        
        const { data: roles, error: rolesError } = await Promise.race([
          rolesPromise,
          rolesTimeoutPromise
        ]) as any;
        
        if (rolesError) {
          console.error('GeneralSettings: Error fetching user roles:', rolesError);
          // If we can't verify admin status, assume not admin but don't block loading
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        console.log('GeneralSettings: Roles data:', roles);
        const hasAdminRole = roles?.some(r => r.role === 'admin') || false;
        console.log('GeneralSettings: Has admin role:', hasAdminRole);
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          console.log('GeneralSettings: User is not admin, finishing load');
          setIsLoading(false);
          return;
        }

        // Load AI settings with timeout
        console.log('GeneralSettings: Loading AI settings for admin...');
        const settingsPromise = supabase
          .from('ai_settings')
          .select('*')
          .limit(1)
          .single();
          
        const settingsTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Settings fetch timeout')), 10000)
        );

        const { data: aiSettings, error: settingsError } = await Promise.race([
          settingsPromise,
          settingsTimeoutPromise
        ]) as any;

        console.log('GeneralSettings: AI settings result:', { aiSettings, settingsError });

        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error("GeneralSettings: Error loading AI settings:", settingsError);
        }

        if (aiSettings) {
          console.log('GeneralSettings: Applying AI settings to state');
          if (aiSettings.openai_api_key) setApiKey(aiSettings.openai_api_key);
          if (aiSettings.model) setSelectedModel(aiSettings.model);
          if (aiSettings.temperature !== null) setTemperature(aiSettings.temperature);
          if (aiSettings.max_tokens) setMaxTokens(aiSettings.max_tokens);
        }
        
        console.log('GeneralSettings: Settings loaded successfully');
      } catch (error) {
        console.error("GeneralSettings: Timeout or unexpected error:", error);
        toast({
          title: "Loading timeout",
          description: "Please refresh and try again",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndLoadSettings();
  }, [toast]);

  // Update parent component when settings change
  useEffect(() => {
    if (isAdmin) {
      onSettingsChange({ apiKey, model: selectedModel });
    }
  }, [apiKey, selectedModel, onSettingsChange, isAdmin]);

  const testApiKey = async (keyToTest: string) => {
    try {
      console.log('Testing API key format and validity...');
      
      // First validate format
      if (!validateApiKey(keyToTest)) {
        console.log('API key failed format validation');
        return false;
      }
      
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('API key test successful');
        return true;
      } else {
        const errorText = await response.text();
        console.error('API key test failed:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('API key test error:', error);
      return false;
    }
  };

  const handleSaveSettings = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to save settings",
        variant: "destructive",
      });
      return;
    }

    const trimmedApiKey = apiKey.trim();

    if (!trimmedApiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      });
      return;
    }

    if (!validateApiKey(trimmedApiKey)) {
      toast({
        title: "Invalid API Key Format",
        description: "OpenAI API keys should start with 'sk-' and be at least 20 characters long",
        variant: "destructive",
      });
      return;
    }

    setLocalIsSaving(true);
    try {
      console.log('GeneralSettings: Testing API key before saving...');
      
      // Test the API key before saving
      const isValidKey = await testApiKey(trimmedApiKey);
      if (!isValidKey) {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is not valid or has been rejected by OpenAI. Please check your key and try again.",
          variant: "destructive",
        });
        setLocalIsSaving(false);
        return;
      }

      console.log('GeneralSettings: API key is valid, saving settings...');
      
      // Check if settings exist
      const { data: existingSettings, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      console.log('GeneralSettings: Existing settings check:', { existingSettings, fetchError });

      const settingsData = {
        openai_api_key: trimmedApiKey,
        model: selectedModel,
        temperature: temperature,
        max_tokens: maxTokens,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existingSettings && !fetchError) {
        // Update existing record
        console.log('GeneralSettings: Updating existing AI settings');
        result = await supabase
          .from('ai_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select();
      } else {
        // Insert new record
        console.log('GeneralSettings: Creating new AI settings record');
        result = await supabase
          .from('ai_settings')
          .insert([{
            ...settingsData,
            created_at: new Date().toISOString()
          }])
          .select();
      }

      console.log('GeneralSettings: Save result:', result);

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Settings saved successfully",
        description: "AI assistant configuration has been updated and API key validated",
      });

      onSave?.();
    } catch (error) {
      console.error("GeneralSettings: Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Please try again or check your connection",
        variant: "destructive",
      });
    } finally {
      setLocalIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-32 flex flex-col items-center justify-center space-y-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Access denied: Admin privileges required</p>
        <p className="text-sm text-gray-500 mt-2">
          Please contact an administrator to access these settings.
        </p>
      </div>
    );
  }

  const isApiKeyInvalid = apiKey.trim() && !validateApiKey(apiKey.trim());

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="relative">
              <Input 
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className={`pr-10 ${isApiKeyInvalid ? 'border-red-500' : ''}`}
                disabled={isSaving || localIsSaving}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
                disabled={isSaving || localIsSaving}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {isApiKeyInvalid && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-3 w-3" />
                <span>API key should start with 'sk-' and be at least 20 characters</span>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Your OpenAI API key. Get one from{" "}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">AI Model</Label>
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
              disabled={isSaving || localIsSaving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input 
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={isSaving || localIsSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input 
                id="max-tokens"
                type="number"
                min="1"
                max="4000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                disabled={isSaving || localIsSaving}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSaveSettings}
        disabled={isSaving || localIsSaving || isApiKeyInvalid || !apiKey.trim()}
        className="flex gap-2 items-center"
      >
        <Save size={16} />
        {(isSaving || localIsSaving) ? "Testing & Saving..." : "Test & Save Settings"}
      </Button>
    </div>
  );
};
