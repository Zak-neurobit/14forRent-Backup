
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";

// This MUST match the DEFAULT_SYSTEM_PROMPT in the chatbot edge function
const CHATBOT_DEFAULT_SYSTEM_PROMPT = `You are a customer support agent for 14forRent. You help users find rental properties, answer questions about listings, and schedule property tours. Be conversational, helpful, and proactive in suggesting relevant properties based on user queries. Your tone should be warm, friendly and professional.

Contact Information:
- Phone: +1 323-774-4700
- Email: info@14forrent.com
- Available 24/7 for urgent matters

When users ask for contact information, provide the phone number and email above. You can help with property inquiries, scheduling tours, and general questions about our rental services.`;

interface SystemPromptSettingsProps {
  isSaving: boolean;
  onSettingsChange: (settings: {
    systemPrompt?: string;
  }) => void;
  onSave?: () => void;
}

export const SystemPromptSettings = ({ isSaving, onSettingsChange, onSave }: SystemPromptSettingsProps) => {
  const { toast } = useToast();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [localIsSaving, setLocalIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  // Check admin status and fetch settings
  useEffect(() => {
    const checkAdminAndGetSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('SystemPromptSettings - Current user:', user);
        
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        setUser(user);
        
        const { data: adminRole, error: rolesError } = await supabase
          .from('admin_roles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
          
        console.log('SystemPromptSettings - Admin role:', adminRole);
        
        if (rolesError && rolesError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Error fetching admin role:', rolesError);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        const hasAdminRole = adminRole !== null;
        setIsAdmin(hasAdminRole);
        
        if (!hasAdminRole) {
          setIsLoading(false);
          return;
        }
        
        // Fetch system prompt if user is admin
        console.log('Fetching AI settings for admin user...');
        const { data: aiSettings, error } = await supabase
          .from('ai_settings')
          .select('system_prompt')
          .limit(1)
          .single();
          
        console.log('AI settings fetch result:', { aiSettings, error });
        
        if (error && error.code !== 'PGRST116') {
          console.error("Error fetching system prompt:", error);
          toast({
            title: "Error loading system prompt",
            description: "Could not load current system prompt. Using default.",
            variant: "destructive",
          });
        }
        
        if (aiSettings?.system_prompt) {
          console.log('Setting system prompt from database');
          setSystemPrompt(aiSettings.system_prompt);
        } else {
          console.log('No system prompt found, using chatbot default and saving to DB');
          setSystemPrompt(CHATBOT_DEFAULT_SYSTEM_PROMPT);
          
          // Initialize database with default if no settings exist
          try {
            await supabase
              .from('ai_settings')
              .insert([{ 
                system_prompt: CHATBOT_DEFAULT_SYSTEM_PROMPT,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }]);
            console.log('Initialized database with default system prompt');
          } catch (initError) {
            console.log('Could not initialize database with default:', initError);
          }
        }
      } catch (error) {
        console.error("Error in checkAdminAndGetSettings:", error);
        toast({
          title: "Error loading settings",
          description: "Please try again or check your connection",
          variant: "destructive",
        });
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAndGetSettings();
  }, [toast]);

  // Update settings in parent component when changed
  useEffect(() => {
    if (isAdmin) {
      onSettingsChange({ systemPrompt });
    }
  }, [systemPrompt, onSettingsChange, isAdmin]);

  const resetSystemPrompt = () => {
    setSystemPrompt(CHATBOT_DEFAULT_SYSTEM_PROMPT);
  };

  const handleSaveSystemPrompt = async () => {
    if (!isAdmin || !user) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required to save system prompt",
        variant: "destructive",
      });
      return;
    }
    
    setLocalIsSaving(true);
    try {
      console.log('Attempting to save system prompt:', systemPrompt);
      
      // First, try to get existing settings
      const { data: existingSettings, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .single();
      
      console.log('Existing settings check:', { existingSettings, fetchError });
      
      let result;
      if (existingSettings && !fetchError) {
        // Update existing record
        console.log('Updating existing AI settings record with ID:', existingSettings.id);
        result = await supabase
          .from('ai_settings')
          .update({ 
            system_prompt: systemPrompt,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select();
      } else {
        // Insert new record
        console.log('Creating new AI settings record');
        result = await supabase
          .from('ai_settings')
          .insert([{ 
            system_prompt: systemPrompt,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select();
      }
      
      console.log('Save result:', result);
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "System prompt saved",
        description: "Support agent will now use the new system prompt",
      });
      
      onSave?.();
    } catch (error) {
      console.error("Error saving system prompt:", error);
      toast({
        title: "Error saving system prompt",
        description: error.message || "Please try again or check your connection",
        variant: "destructive",
      });
    } finally {
      setLocalIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-32 flex items-center justify-center">Loading settings...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-10">
        <p className="text-red-600">Access denied: Admin privileges required</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="system-prompt">Support Agent Guidelines</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetSystemPrompt}
          disabled={isSaving || localIsSaving}
          className="text-xs"
        >
          Reset to Default
        </Button>
      </div>
      <Textarea 
        id="system-prompt"
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="Enter system instructions for support agent..."
        className="min-h-[200px] font-mono text-sm"
        disabled={isSaving || localIsSaving}
      />
      <p className="text-sm text-gray-500">
        This prompt defines the support agent's personality, capabilities, and response style. 
        Changes will affect how the support agent interacts with users. The contact information is included so the agent can provide it when asked.
      </p>
      
      {/* Save Button */}
      <Button 
        onClick={handleSaveSystemPrompt}
        disabled={isSaving || localIsSaving}
        className="flex gap-2 items-center mt-4"
      >
        <Save size={16} />
        {(isSaving || localIsSaving) ? "Saving..." : "Save System Prompt"}
      </Button>
    </div>
  );
};
