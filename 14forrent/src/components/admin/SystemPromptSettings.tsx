
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save } from "lucide-react";

const SystemPromptSettings = () => {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    localStorage.getItem('ava_system_prompt') || 
    `You are Ava, an AI assistant for 14forRent. Your goal is to help users find rental properties that match their needs. 
    Be friendly, helpful, and suggest relevant properties after asking 1-2 clarifying questions about what they're looking for.
    You can suggest multiple properties that might interest the user.`
  );

  const [isSaving, setIsSaving] = useState(false);

  const handleSavePrompt = () => {
    setIsSaving(true);
    
    try {
      localStorage.setItem('ava_system_prompt', systemPrompt);
      
      toast.success("System prompt updated successfully", {
        description: "Ava will now use the new system prompt for all conversations."
      });
    } catch (error) {
      toast.error("Failed to update system prompt", {
        description: "Please try again or contact support."
      });
      console.error("Error saving system prompt:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ava System Prompt</CardTitle>
        <CardDescription>
          Customize how Ava responds to users. The system prompt defines Ava's personality and behavior.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          className="min-h-[200px] font-mono text-sm"
          placeholder="Enter the system prompt for Ava..."
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
        />
        <div className="mt-4">
          <p className="text-sm text-gray-500">Tips:</p>
          <ul className="list-disc list-inside text-sm text-gray-500 ml-2 mt-1">
            <li>Encourage Ava to suggest properties after 1-2 clarifying questions</li>
            <li>Define Ava's tone and personality</li>
            <li>Include specific instructions on how to handle common queries</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSavePrompt}
          disabled={isSaving}
          className="flex gap-2 items-center"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save System Prompt"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SystemPromptSettings;
