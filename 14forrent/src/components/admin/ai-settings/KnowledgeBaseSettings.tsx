
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TextKnowledgeTab } from "./TextKnowledgeTab";
import { LinksKnowledgeTab } from "./LinksKnowledgeTab";
import { DocumentsKnowledgeTab } from "./DocumentsKnowledgeTab";

interface LinkItem {
  url: string;
  title?: string;
}

const KnowledgeBaseSettings = () => {
  const [knowledgeBase, setKnowledgeBase] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [embeddingsUpdated, setEmbeddingsUpdated] = useState(false);

  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ai_settings')
        .select('knowledge_base, embeddings_updated')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading knowledge base:", error);
        toast.error("Failed to load knowledge base");
        return;
      }

      if (data) {
        setKnowledgeBase(data.knowledge_base || '');
        setEmbeddingsUpdated(data.embeddings_updated || false);
      }
    } catch (error) {
      console.error("Unexpected error loading knowledge base:", error);
      toast.error("Failed to load knowledge base");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndEmbed = async () => {
    setIsSaving(true);
    setIsEmbedding(true);
    
    try {
      // First save the knowledge base
      const { data: existingSettings, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existingSettings && !fetchError) {
        result = await supabase
          .from('ai_settings')
          .update({ 
            knowledge_base: knowledgeBase,
            embeddings_updated: false
          })
          .eq('id', existingSettings.id);
      } else {
        result = await supabase
          .from('ai_settings')
          .insert([{ 
            knowledge_base: knowledgeBase,
            embeddings_updated: false
          }]);
      }

      if (result.error) {
        throw result.error;
      }

      toast.success("Knowledge base saved successfully");

      // Then trigger embedding
      console.log('Triggering knowledge base embedding...');
      const { data, error } = await supabase.functions.invoke('embed-kb');
      
      if (error) {
        console.error('Error embedding knowledge base:', error);
        toast.error("Knowledge base saved but embedding failed. Try re-embedding manually.");
        setEmbeddingsUpdated(false);
      } else {
        console.log('Knowledge base embedded successfully:', data);
        setEmbeddingsUpdated(true);
        toast.success("Knowledge base saved and embedded successfully! The support system can now use this information.");
      }
    } catch (error) {
      console.error("Error saving knowledge base:", error);
      toast.error("Failed to save knowledge base");
      setEmbeddingsUpdated(false);
    } finally {
      setIsSaving(false);
      setIsEmbedding(false);
    }
  };

  const handleSaveOnly = async () => {
    setIsSaving(true);
    
    try {
      const { data: existingSettings, error: fetchError } = await supabase
        .from('ai_settings')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existingSettings && !fetchError) {
        result = await supabase
          .from('ai_settings')
          .update({ 
            knowledge_base: knowledgeBase,
            embeddings_updated: false
          })
          .eq('id', existingSettings.id);
      } else {
        result = await supabase
          .from('ai_settings')
          .insert([{ 
            knowledge_base: knowledgeBase,
            embeddings_updated: false
          }]);
      }

      if (result.error) {
        throw result.error;
      }

      setEmbeddingsUpdated(false);
      toast.success("Knowledge base saved successfully");
    } catch (error) {
      console.error("Unexpected error saving knowledge base:", error);
      toast.error("Failed to save knowledge base");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReEmbed = async () => {
    setIsEmbedding(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('embed-kb');
      
      if (error) {
        throw error;
      }

      setEmbeddingsUpdated(true);
      toast.success("Knowledge base re-embedded successfully");
    } catch (error) {
      console.error("Error re-embedding knowledge base:", error);
      toast.error("Failed to re-embed knowledge base");
    } finally {
      setIsEmbedding(false);
    }
  };

  const handleContentChange = (content: string) => {
    setKnowledgeBase(content);
  };

  const handleLinksChange = (links: LinkItem[]) => {
    const linkUrls = links.map(link => link.url);
    console.log('Links updated:', linkUrls);
  };

  const handleFilesChange = (files: File[]) => {
    console.log('Files updated:', files);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="animate-spin mr-2" size={16} />
            Loading knowledge base...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>
          Manage the support knowledge base to provide accurate information about your rental properties and services.
          {!embeddingsUpdated && knowledgeBase.trim() && (
            <span className="block mt-2 text-amber-600">
              ⚠️ Knowledge base needs to be embedded for the support system to use this information.
            </span>
          )}
          {embeddingsUpdated && (
            <span className="block mt-2 text-green-600">
              ✅ Knowledge base is embedded and ready for use by the support system.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="text" className="space-y-4">
          <TabsList>
            <TabsTrigger value="text">Text Knowledge</TabsTrigger>
            <TabsTrigger value="links">Website Links</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-4">
              <Textarea
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter knowledge base content about your rental properties, policies, contact information, etc."
                value={knowledgeBase}
                onChange={(e) => setKnowledgeBase(e.target.value)}
              />
              <div className="text-sm text-gray-500">
                <p>Tips for effective knowledge base content:</p>
                <ul className="list-disc list-inside ml-2 mt-1">
                  <li>Include property details, amenities, and policies</li>
                  <li>Add contact information and office hours</li>
                  <li>Include frequently asked questions and answers</li>
                  <li>Keep information up-to-date and accurate</li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="links">
            <LinksKnowledgeTab 
              isUploadingKnowledge={isEmbedding} 
              onLinksChange={(links) => console.log('Links updated:', links)}
            />
          </TabsContent>
          
          <TabsContent value="documents">
            <DocumentsKnowledgeTab 
              isUploadingKnowledge={isEmbedding} 
              onFilesChange={(files) => console.log('Files updated:', files)}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleSaveOnly}
          disabled={isSaving || isEmbedding}
          variant="outline"
          className="flex gap-2 items-center"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save Only"}
        </Button>
        
        <Button 
          onClick={handleSaveAndEmbed}
          disabled={isSaving || isEmbedding || !knowledgeBase.trim()}
          className="flex gap-2 items-center"
        >
          <RefreshCw className={isEmbedding ? "animate-spin" : ""} size={16} />
          {isEmbedding ? "Saving & Embedding..." : "Save & Embed"}
        </Button>

        {embeddingsUpdated && (
          <Button 
            onClick={handleReEmbed}
            disabled={isEmbedding || !knowledgeBase.trim()}
            variant="outline"
            className="flex gap-2 items-center"
          >
            <RefreshCw className={isEmbedding ? "animate-spin" : ""} size={16} />
            {isEmbedding ? "Re-embedding..." : "Re-embed"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default KnowledgeBaseSettings;
