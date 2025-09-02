
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Upload, Youtube, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Control } from "react-hook-form";
import { toast } from "sonner";
import { parseYouTube } from "@/lib/youtube";
import VideoEmbed from "@/components/property/VideoEmbed";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VideoUploaderProps {
  videoFile: File | null;
  setVideoFile: (file: File | null) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  control: Control<any>;
}

const VideoUploader = ({ videoFile, setVideoFile, videoUrl, setVideoUrl, control }: VideoUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const isValidType = file.type.startsWith('video/');
    const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
    
    if (!isValidType) {
      toast.error(`${file.name} is not a valid video file`);
      return;
    }
    
    if (!isValidSize) {
      toast.error(`${file.name} is too large. Maximum size is 50MB`);
      return;
    }

    if (!user) {
      toast.error("Please log in to upload videos");
      return;
    }

    // Upload video to Supabase
    await uploadVideoToSupabase(file);
  };

  const uploadVideoToSupabase = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      console.log(`Uploading video: ${fileName}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Simulate progress for better UX (since Supabase doesn't provide real-time progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until upload completes
          return prev + Math.random() * 20;
        });
      }, 200);

      // Upload with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('property_videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        console.error('Video upload error:', uploadError);
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property_videos')
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        setVideoFile(file);
        setVideoUrl(urlData.publicUrl);
        console.log('Successfully uploaded video:', urlData.publicUrl);
        toast.success(`Successfully uploaded video: ${file.name}`);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    handleFiles(files);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoUrl(null);
  };

  return (
    <div className="space-y-6">
      {/* YouTube URL Input */}
      <FormField
        control={control}
        name="youtube_url"
        render={({ field }) => {
          const parsedYT = field.value ? parseYouTube(field.value) : null;
          const isValidYouTube = !field.value || parsedYT !== null;
          
          return (
            <FormItem>
              <FormLabel>YouTube Video URL (Optional)</FormLabel>
              <FormControl>
                <div className="relative">
                  <Youtube className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/shorts/..." 
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
              {field.value && !isValidYouTube && (
                <p className="text-sm text-red-600">Please enter a valid YouTube URL (regular videos, shorts, or embeds)</p>
              )}
              {field.value && isValidYouTube && parsedYT && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Preview: {parsedYT.isShort ? 'YouTube Short' : 'YouTube Video'}
                  </p>
                  <div className="w-full max-w-md">
                    <VideoEmbed 
                      id={parsedYT.id} 
                      isShort={parsedYT.isShort}
                      title="YouTube Preview"
                    />
                  </div>
                </div>
              )}
            </FormItem>
          );
        }}
      />

      {/* OR Divider */}
      <div className="flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-4 text-sm text-gray-500">OR</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Video File Upload */}
      <div className="space-y-4">
        <FormLabel>Upload Video File (Optional)</FormLabel>
        
        {!videoFile && !videoUrl && !uploading && (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-forrent-navy bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-700">
                {dragActive ? 'Drop video here' : 'Upload a property video'}
              </p>
              <p className="text-sm text-gray-500">
                {dragActive ? 'Release to upload' : 'Drag and drop video here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">MP4, MOV, AVI up to 50MB</p>
            </div>
            <div className="mt-4">
              <label htmlFor="video-upload" className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-forrent-navy hover:bg-forrent-darkBlue transition-colors">
                  Choose Video
                </span>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>
        )}

        {/* Video Upload Progress */}
        {uploading && (
          <div className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-blue-700">Uploading video...</p>
                <p className="text-sm text-blue-600">Please wait while we process your video</p>
              </div>
              <div className="w-full max-w-md">
                <Progress value={uploadProgress} className="h-3" />
                <div className="text-sm text-blue-600 mt-2 text-center">
                  {Math.round(uploadProgress)}% complete
                </div>
              </div>
            </div>
          </div>
        )}

        {(videoFile || videoUrl) && (
          <div className="space-y-4">
            <div className="relative">
              <video 
                src={videoUrl || undefined}
                controls 
                className="w-full max-w-md h-64 object-cover rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={removeVideo}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {videoFile && (
              <p className="text-sm text-gray-600">
                File: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
