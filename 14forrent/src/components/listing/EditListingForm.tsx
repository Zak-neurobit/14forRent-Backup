
import { useNavigate } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/listing/ImageUploader";
import VideoUploader from "@/components/listing/VideoUploader";
import PropertyDetailsForm from "@/components/listing/PropertyDetailsForm";
import AmenitiesForm from "@/components/listing/AmenitiesForm";
import PropertyDescriptionForm from "@/components/listing/PropertyDescriptionForm";

interface EditListingFormProps {
  form: any;
  imageFiles: File[];
  setImageFiles: (files: File[]) => void;
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
  thumbnailIndex: number;
  setThumbnailIndex: (index: number) => void;
  videoFile: File | null;
  setVideoFile: (file: File | null) => void;
  videoUrl: string | null;
  setVideoUrl: (url: string | null) => void;
  generatingDescription: boolean;
  generateAIDescription: () => Promise<void>;
  descriptionRef: React.RefObject<HTMLTextAreaElement>;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  listingId: string;
}

const EditListingForm = ({
  form,
  imageFiles,
  setImageFiles,
  imageUrls,
  setImageUrls,
  thumbnailIndex,
  setThumbnailIndex,
  videoFile,
  setVideoFile,
  videoUrl,
  setVideoUrl,
  generatingDescription,
  generateAIDescription,
  descriptionRef,
  onSubmit,
  isSubmitting,
  listingId
}: EditListingFormProps) => {
  const navigate = useNavigate();
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ImageUploader 
          images={imageUrls}
          onImagesChange={setImageUrls}
          thumbnailIndex={thumbnailIndex}
          onThumbnailChange={setThumbnailIndex}
        />

        <VideoUploader
          videoFile={videoFile}
          setVideoFile={setVideoFile}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          control={form.control}
        />

        <PropertyDetailsForm control={form.control} />

        <AmenitiesForm control={form.control} />

        <PropertyDescriptionForm 
          control={form.control}
          generateAIDescription={generateAIDescription}
          generatingDescription={generatingDescription}
          ref={descriptionRef}
        />

        <div className="pt-6 flex flex-col sm:flex-row gap-4">
          <Button 
            type="submit" 
            className="bg-forrent-orange hover:bg-forrent-lightOrange text-white py-2 px-6 rounded-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          
          <Button 
            type="button"
            variant="outline" 
            onClick={() => navigate(`/property/${listingId}`)}
            className="border-forrent-navy text-forrent-navy hover:bg-forrent-navy hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditListingForm;
