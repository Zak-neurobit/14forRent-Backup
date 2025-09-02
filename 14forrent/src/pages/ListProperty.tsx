
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ImageUploader } from "@/components/listing/ImageUploader";
import VideoUploader from "@/components/listing/VideoUploader";
import PropertyDetailsForm from "@/components/listing/PropertyDetailsForm";
import AmenitiesForm from "@/components/listing/AmenitiesForm";
import PropertyDescriptionForm from "@/components/listing/PropertyDescriptionForm";
import { usePropertyForm } from "@/hooks/usePropertyForm";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ListProperty = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { 
    form, 
    isSubmitting, 
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
    onSubmit,
    descriptionRef
  } = usePropertyForm();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast.info("Please sign in to list a property", {
        description: "You need to be logged in to create a listing",
        action: {
          label: "Sign In",
          onClick: () => navigate("/login", { state: { from: "/list" } })
        }
      });
      navigate("/login", { state: { from: "/list" } });
    }
  }, [user, isAuthLoading, navigate]);

  if (isAuthLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center p-8 rounded-lg">
            <Loader2 className="h-16 w-16 animate-spin text-[#1A2953] mb-4" />
            <p className="text-gray-700 text-lg">Checking authentication...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md w-full">
            <h1 className="text-3xl font-bold text-[#1A2953] mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">You need to be signed in to list a property.</p>
            <Button 
              onClick={() => navigate("/login", { state: { from: "/list" } })}
              className="bg-[#1A2953] hover:bg-[#2A3F70] text-white py-3 px-8 text-lg rounded-md transition-colors duration-200"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 py-8 md:py-16">
        <div className="forrent-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A2953] mb-4">
              List Your Property with Ease
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-3xl mx-auto">
              Fill out the details below to create your professional listing. Our AI will help optimize your property's description.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6">Property Media</h2>
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

              <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 pt-4">Property Details</h2>
              <PropertyDetailsForm control={form.control} />

              <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 pt-4">Amenities</h2>
              <AmenitiesForm control={form.control} />

              <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 mb-6 pt-4">Description</h2>
              <PropertyDescriptionForm 
                control={form.control}
                generateAIDescription={generateAIDescription}
                generatingDescription={generatingDescription}
                ref={descriptionRef}
              />

              <div className="pt-6 border-t border-gray-100 mt-8">
                <Button 
                  type="submit" 
                  className="w-full bg-[#1A2953] hover:bg-[#2A3F70] text-white py-3 px-8 text-lg font-semibold rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Create Listing"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ListProperty;
