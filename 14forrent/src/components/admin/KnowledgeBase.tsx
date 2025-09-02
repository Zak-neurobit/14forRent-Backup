
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Upload, X, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export const KnowledgeBase = () => {
  const [activeTab, setActiveTab] = useState("text");
  const [textContent, setTextContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Filter for PDF files only
      const pdfFiles = newFiles.filter(file => 
        file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')
      );
      
      if (pdfFiles.length !== newFiles.length) {
        toast.warning("Only PDF files are supported");
      }
      
      setFiles(prev => [...prev, ...pdfFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const saveKnowledgeBase = async () => {
    setIsUploading(true);
    
    try {
      // In a real app, you would upload files to storage and save links and text to database
      
      // Mock API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Knowledge base updated successfully");
      // In a real implementation, we would update the backend with this knowledge
    } catch (error) {
      console.error("Error saving knowledge base:", error);
      toast.error("Failed to update knowledge base");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const pdfFiles = droppedFiles.filter(file => 
        file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')
      );
      
      if (pdfFiles.length !== droppedFiles.length) {
        toast.warning("Only PDF files are supported");
      }
      
      setFiles(prev => [...prev, ...pdfFiles]);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Support Knowledge Base</h2>
        <Button 
          onClick={saveKnowledgeBase} 
          disabled={isUploading}
          className="flex items-center gap-2 bg-[rgba(26,41,84,255)]"
        >
          {isUploading ? "Saving..." : "Save Knowledge Base"}
          <Save size={16} />
        </Button>
      </div>
      
      <p className="text-gray-600 mb-6">
        Add information that the support team can use to answer questions about 14forRent. 
        The support system will automatically have access to all active property listings.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="text">Text Knowledge</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="knowledge-text">Add Text Knowledge</Label>
            <Textarea
              id="knowledge-text"
              placeholder="Enter important information about 14forRent policies, features, benefits, etc."
              className="min-h-[300px]"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Text knowledge helps answer general questions about the platform, policies, and services.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".pdf"
                multiple
                id="document-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="document-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <Upload className="h-12 w-12 text-forrent-orange mb-2" />
                <span className="text-[rgba(26,41,84,255)] font-medium">
                  Click to upload or drag and drop
                </span>
                <span className="text-gray-500 text-sm mt-1">
                  Upload PDF documents (max 10MB each)
                </span>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center flex-1 truncate">
                        <FileText size={16} className="text-red-500 mr-2" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({(file.size / 1024).toFixed(1)}KB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 ml-2"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
