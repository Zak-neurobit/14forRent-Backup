
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TextKnowledgeTabProps {
  isUploadingKnowledge: boolean;
  onContentChange: (content: string) => void;
  initialContent?: string;
}

export const TextKnowledgeTab = ({ isUploadingKnowledge, onContentChange, initialContent = "" }: TextKnowledgeTabProps) => {
  const [textContent, setTextContent] = useState(initialContent);

  // Update content when initialContent changes
  useEffect(() => {
    setTextContent(initialContent);
  }, [initialContent]);

  // Update content in parent component when changed
  useEffect(() => {
    onContentChange(textContent);
  }, [textContent, onContentChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="knowledge-text">Add Text Knowledge</Label>
      <Textarea
        id="knowledge-text"
        placeholder="Enter important information about 14forRent policies, features, benefits, etc."
        className="min-h-[300px]"
        value={textContent}
        onChange={handleTextChange}
        disabled={isUploadingKnowledge}
      />
      <p className="text-xs text-gray-500">
        Text knowledge helps answer general questions about the platform, policies, and services.
      </p>
    </div>
  );
};
