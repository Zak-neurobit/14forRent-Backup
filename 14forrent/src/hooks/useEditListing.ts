
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePropertyForm } from "@/hooks/usePropertyForm";
import { parseYouTube } from "@/lib/youtube";
import { normalizeImageUrls } from "@/utils/imageUrl";

export const useEditListing = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  console.log("useEditListing - id from useParams:", id);
  
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
  } = usePropertyForm(id); // Pass listing ID for update mode

  useEffect(() => {
    fetchListing();
  }, [id, user]);

  const fetchListing = async () => {
    if (!user || !id) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error fetching listing:", error);
        setNotFound(true);
        toast.error("Failed to load listing details");
        return;
      }
      
      // Allow admins to edit any listing, regular users can only edit their own
      if (data.user_id !== user.id && !isAdmin) {
        setUnauthorized(true);
        toast.error("You don't have permission to edit this listing");
        return;
      }
      
      setListing(data);
      
      form.reset({
        title: data.title,
        location: data.location,
        description: data.description,
        price: data.price,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        amenities: data.amenities || [],
        images: null,
        sqft: data.sqft || 0, // Don't default to 1000
        address: data.address || data.location || "",
        type: data.type || "Apartment",
        youtube_url: data.youtube_url || "",
        securityDeposit: data.security_deposit || 0,
        dateAvailable: data.date_available || "",
        laundryType: data.laundry_type || "",
        parkingType: data.parking_type || "",
        heatingType: data.heating_type || "",
        rentalType: data.rental_type || "",
        catFriendly: data.cat_friendly || false,
        dogFriendly: data.dog_friendly || false
      });
      
      // Process image URLs to ensure they're full URLs
      const processedImages = normalizeImageUrls(data.images);
      
      console.log('Loaded images for editing:', processedImages);
      setImageUrls(processedImages);
      
      // Set video URL if it exists
      if (data.youtube_url) {
        setVideoUrl(data.youtube_url);
      }
      
    } catch (error) {
      console.error("Error in fetchListing:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    if (!authLoading && !user) {
      toast.info("Please sign in to edit a listing", {
        description: "You need to be logged in to edit your listings",
        action: {
          label: "Sign In",
          onClick: () => navigate("/login", { state: { from: `/list/${id}` } })
        }
      });
      navigate("/login", { state: { from: `/list/${id}` } });
    }
  }, [user, authLoading, navigate, id]);

  return {
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
    handleSubmit: onSubmit,
    descriptionRef,
    isSubmitting
  };
};
