
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";

interface DocumentsKnowledgeTabProps {
  isUploadingKnowledge: boolean;
  onFilesChange: (files: File[]) => void;
}

export const DocumentsKnowledgeTab = ({ isUploadingKnowledge, onFilesChange }: DocumentsKnowledgeTabProps) => {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      // Filter for PDF files only
      const pdfFiles = newFiles.filter(file => 
        file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')
      );
      
      const updatedFiles = [...files, ...pdfFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
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
      
      const updatedFiles = [...files, ...pdfFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  };

  return (
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
          disabled={isUploadingKnowledge}
        />
        <label
          htmlFor="document-upload"
          className={`cursor-pointer flex flex-col items-center justify-center ${isUploadingKnowledge ? 'opacity-50' : ''}`}
        >
          <Upload className="h-12 w-12 text-forrent-orange mb-2" />
          <span className="text-forrent-navy font-medium">
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
                  disabled={isUploadingKnowledge}
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
