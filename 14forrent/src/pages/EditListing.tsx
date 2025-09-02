
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LoadingView, NotFoundView, UnauthorizedView } from "@/components/listing/ListingStatusViews";
import EditListingForm from "@/components/listing/EditListingForm";
import { useEditListing } from "@/hooks/useEditListing";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EditListing = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    isLoading,
    authLoading,
    notFound,
    unauthorized,
    listing,
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
    handleSubmit,
    descriptionRef,
    isSubmitting
  } = useEditListing();
  
  if (authLoading || isLoading) {
    return <LoadingView />;
  }
  
  if (notFound) {
    return <NotFoundView />;
  }
  
  if (unauthorized) {
    return <UnauthorizedView />;
  }

  // Check if admin is editing someone else's listing
  const isAdminEditingOthers = isAdmin && listing && listing.user_id !== user?.id;

  return (
    <>
      <Navbar />
      <div className="forrent-container py-8 md:py-16">
        {/* Admin Context Header */}
        {isAdminEditingOthers && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin Mode
                </Badge>
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Editing listing by:</span> Owner ID {listing.user_id}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
            </div>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-forrent-navy mb-6">
          {isAdminEditingOthers ? "Edit Property Listing (Admin)" : "Edit Your Property Listing"}
        </h1>
        <p className="text-gray-600 mb-8">
          Update the details of your property listing below. All fields marked with * are required.
        </p>

        <EditListingForm
          form={form}
          imageFiles={imageFiles}
          setImageFiles={setImageFiles}
          imageUrls={imageUrls}
          setImageUrls={setImageUrls}
          thumbnailIndex={thumbnailIndex}
          setThumbnailIndex={setThumbnailIndex}
          videoFile={videoFile}
          setVideoFile={setVideoFile}
          videoUrl={videoUrl}
          setVideoUrl={setVideoUrl}
          generatingDescription={generatingDescription}
          generateAIDescription={generateAIDescription}
          descriptionRef={descriptionRef}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          listingId={id || ''}
        />
      </div>
      <Footer />
    </>
  );
};

export default EditListing;
