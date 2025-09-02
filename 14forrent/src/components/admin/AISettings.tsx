
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettings } from "./ai-settings/GeneralSettings";
import { SystemPromptSettings } from "./ai-settings/SystemPromptSettings";
import { SettingsStatus } from "./ai-settings/SettingsStatus";

const AISettings = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSettingsUpdate = () => {
    console.log('AISettings: Settings updated, triggering refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSettingsChange = () => {
    console.log('AISettings: Settings changed');
    // Handle settings change
  };

  console.log('AISettings: Rendering with refreshTrigger:', refreshTrigger);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chat Support Settings</h2>
        <SettingsStatus key={refreshTrigger} />
      </div>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <GeneralSettings 
            isSaving={isSaving} 
            onSettingsChange={handleSettingsChange}
            onSave={handleSettingsUpdate}
          />
        </TabsContent>
        
        <TabsContent value="prompt" className="space-y-4">
          <SystemPromptSettings 
            isSaving={isSaving} 
            onSettingsChange={handleSettingsChange} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { AISettings };
