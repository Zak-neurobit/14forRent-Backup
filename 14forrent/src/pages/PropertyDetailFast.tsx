import { useState, useEffect, useCallback, memo, Suspense, lazy } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PropertyListing } from "@/data/propertyListings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PropertyImageGalleryOptimized from "@/components/property/PropertyImageGalleryOptimized";
import PropertyDetailsSection from "@/components/property/PropertyDetailsSection";
import PropertyCardFavorite from "@/components/property/PropertyCardFavorite";
import SEOMeta from "@/components/SEOMeta";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { generateRealEstateListingStructuredData } from "@/utils/structuredData";
import { perfMark, perfMeasure, logPerformanceMetrics } from "@/utils/performanceMonitor";
import { detectAndRedirectBots } from "@/utils/botDetection";

// Lazy load non-critical components
const PropertyDescriptionSection = lazy(() => import("@/components/property/PropertyDescriptionSection"));
const PropertyAdditionalDetails = lazy(() => import("@/components/property/PropertyAdditionalDetails"));
const ScheduleTourButton = lazy(() => import("@/components/property/ScheduleTourButton"));


interface ContactInfo {
  email: string;
  phone: string;
  isAdmin: boolean;
}

// Optimized cache with smaller footprint
const PROPERTY_CACHE = new Map<string, { 
  critical: any; 
  allImages: string[];
  fullProperty: PropertyListing;
  timestamp: number;
}>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const PropertyDetailFast = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Split state into critical and non-critical
  const [criticalData, setCriticalData] = useState<{
    title: string;
    price: number;
    location: string;
    address: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    initialImages: string[];
    totalImageCount: number;
    type?: string;
  } | null>(null);
  
  const [fullProperty, setFullProperty] = useState<PropertyListing | null>(null);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch critical data first for ultra-fast initial render
  const fetchCriticalData = useCallback(async (propertyId: string) => {
    perfMark('fetch-critical-start');
    
    // Check cache first
    const cached = PROPERTY_CACHE.get(propertyId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCriticalData(cached.critical);
      setAllImages(cached.allImages); // Restore all images from cache
      setFullProperty(cached.fullProperty); // Restore full property from cache
      setLoading(false);
      perfMark('fetch-critical-cached');
      return cached.critical;
    }
    
    try {
      // Use optimized RPC to get critical data with first 3 images
      const { data, error } = await supabase
        .rpc('get_property_optimized', { 
          property_id: propertyId,
          image_limit: 3 
        })
        .single();
      
      if (error || !data) {
        // Fallback to regular query - fetch ALL fields needed for display
        const { data: fallback, error: fallbackError } = await supabase
          .from('listings')
          .select(`
            id, title, price, location, address, description,
            bedrooms, bathrooms, sqft, amenities, featured,
            type, status, user_id, images,
            youtube_url, video_id, is_short,
            date_available, laundry_type, parking_type,
            heating_type, rental_type, cat_friendly, dog_friendly,
            security_deposit
          `)
          .eq('id', propertyId)
          .single();
        
        if (fallbackError || !fallback) throw new Error('Property not found');
        
        const critical = {
          title: fallback.title,
          price: fallback.price,
          location: fallback.location,
          address: fallback.address || fallback.location,
          description: fallback.description || 'No description available',
          bedrooms: fallback.bedrooms,
          bathrooms: fallback.bathrooms,
          sqft: fallback.sqft || 0,
          initialImages: fallback.images?.slice(0, 3) || ['/placeholder.svg'],
          totalImageCount: fallback.images?.length || 0,
          type: fallback.type,
          amenities: fallback.amenities || [],
          featured: fallback.featured || false,
          date_available: fallback.date_available || undefined,
          laundry_type: fallback.laundry_type || undefined,
          parking_type: fallback.parking_type || undefined,
          heating_type: fallback.heating_type || undefined,
          rental_type: fallback.rental_type || undefined,
          cat_friendly: fallback.cat_friendly || false,
          dog_friendly: fallback.dog_friendly || false,
          security_deposit: fallback.security_deposit || undefined,
          youtube_url: fallback.youtube_url,
          video_id: fallback.video_id,
          is_short: fallback.is_short
        };
        
        setCriticalData(critical);
        // IMPORTANT: Set all images, not just the first 3
        setAllImages(fallback.images || ['/placeholder.svg']);
        setLoading(false);
        
        // Create full property data for rendering components
        const fullData: PropertyListing = {
          id: fallback.id,
          title: fallback.title,
          price: fallback.price,
          location: fallback.location,
          address: fallback.address || fallback.location,
          description: fallback.description || 'No description available',
          bedrooms: fallback.bedrooms,
          bathrooms: fallback.bathrooms,
          sqft: fallback.sqft || 0,
          image: critical.initialImages[0],
          images: fallback.images || critical.initialImages,
          amenities: fallback.amenities || [],
          featured: fallback.featured || false,
          type: fallback.type,
          youtube_url: fallback.youtube_url,
          video_id: fallback.video_id,
          is_short: fallback.is_short,
          date_available: fallback.date_available,
          laundry_type: fallback.laundry_type,
          parking_type: fallback.parking_type,
          heating_type: fallback.heating_type,
          rental_type: fallback.rental_type,
          cat_friendly: fallback.cat_friendly || false,
          dog_friendly: fallback.dog_friendly || false,
          security_deposit: fallback.security_deposit
        };
        
        setFullProperty(fullData);
        
        // Cache critical data with all images and full property
        PROPERTY_CACHE.set(propertyId, { 
          critical, 
          allImages: fallback.images || ['/placeholder.svg'],
          fullProperty: fullData,
          timestamp: Date.now() 
        });
        
        return critical;
      }
      
      const critical = {
        title: data.title,
        price: data.price,
        location: data.location,
        address: data.address || data.location,
        description: data.description || 'No description available',
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft || 0,
        initialImages: data.initial_images || ['/placeholder.svg'],
        totalImageCount: data.total_image_count || 0,
        type: data.type,
        amenities: data.amenities || [],
        featured: data.featured || false,
        date_available: data.date_available || undefined,
        laundry_type: data.laundry_type || undefined,
        parking_type: data.parking_type || undefined,
        heating_type: data.heating_type || undefined,
        rental_type: data.rental_type || undefined,
        cat_friendly: data.cat_friendly || false,
        dog_friendly: data.dog_friendly || false,
        security_deposit: data.security_deposit || undefined,
        youtube_url: data.youtube_url,
        video_id: data.video_id,
        is_short: data.is_short
      };
      
      setCriticalData(critical);
      // Use all_images from RPC if available, otherwise use initial_images
      setAllImages(data.all_images || data.initial_images || ['/placeholder.svg']);
      setLoading(false);
      
      perfMark('fetch-critical-complete');
      
      // Store full data for later
      const allImagesArray = data.all_images || data.initial_images || ['/placeholder.svg'];
      const fullData: PropertyListing = {
        id: data.id,
        title: data.title,
        price: data.price,
        location: data.location,
        address: data.address || data.location,
        description: data.description || '',
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft || 0,
        image: critical.initialImages[0],
        images: allImagesArray,
        amenities: data.amenities || [],
        featured: data.featured || false,
        type: data.type,
        youtube_url: data.youtube_url,
        video_id: data.video_id,
        is_short: data.is_short,
        date_available: data.date_available,
        laundry_type: data.laundry_type,
        parking_type: data.parking_type,
        heating_type: data.heating_type,
        rental_type: data.rental_type,
        cat_friendly: data.cat_friendly,
        dog_friendly: data.dog_friendly,
        security_deposit: data.security_deposit,
      };
      
      setFullProperty(fullData);
      
      // Cache critical data with all images and full property
      PROPERTY_CACHE.set(propertyId, { 
        critical, 
        allImages: allImagesArray,
        fullProperty: fullData,
        timestamp: Date.now() 
      });
      
      return critical;
    } catch (error) {
      console.error('Error fetching critical data:', error);
      toast.error('Failed to load property');
      navigate('/search');
      return null;
    }
  }, [navigate]);


  // Fetch contact info (low priority)
  const fetchContactInfo = useCallback(async () => {
    // Always set default contact immediately
    setContactInfo({
      email: 'info@14ForRent.com',
      phone: '+1 323-774-4700',
      isAdmin: true
    });
  }, []);

  // Initial critical data fetch
  useEffect(() => {
    if (!id) {
      navigate('/search');
      return;
    }
    
    // Check if this is a bot and redirect to SSR version
    if (detectAndRedirectBots(id)) {
      return; // Stop execution if redirecting
    }
    
    perfMark('page-start');
    fetchCriticalData(id);
  }, [id, navigate, fetchCriticalData]);

  // Fetch remaining data after critical render
  useEffect(() => {
    if (criticalData && id) {
      // Fetch contact info after a short delay
      const contactTimer = setTimeout(() => {
        fetchContactInfo();
      }, 500);
      
      return () => {
        clearTimeout(contactTimer);
      };
    }
  }, [criticalData, id, fetchContactInfo]);

  // Record view (very low priority)
  useEffect(() => {
    if (criticalData && id) {
      const timer = setTimeout(() => {
        supabase
          .from('listing_views')
          .insert([{ listing_id: id, viewer_id: user?.id || null }])
          .then(() => console.log('View recorded'))
          .catch(err => console.error('Failed to record view:', err));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [criticalData, id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <Loader2 className="h-12 w-12 animate-spin text-[#1A2953]" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!criticalData) return null;

  // Process image URL for Open Graph
  const getImageUrl = (imagePath: string): string => {
    if (!imagePath || imagePath === '/placeholder.svg') return '';
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http')) return imagePath;
    
    // Otherwise, get the public URL from Supabase
    const { data } = supabase.storage
      .from('property_images')
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  };

  // Generate meta tags
  const propertyTitle = `${criticalData.title} - ${criticalData.location} | $${criticalData.price.toLocaleString()}/month`;
  const propertyUrl = `https://14forrent.com/property/${id}`;
  const propertyImage = allImages[0] && allImages[0] !== '/placeholder.svg' 
    ? getImageUrl(allImages[0]) 
    : undefined;

  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Properties", href: "/search" },
    { label: criticalData.location, href: `/search?location=${encodeURIComponent(criticalData.location)}` },
    { label: criticalData.title, current: true }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={propertyTitle}
        description={`${criticalData.bedrooms} bed, ${criticalData.bathrooms} bath property for rent in ${criticalData.location}`}
        keywords={`${criticalData.location} rental, ${criticalData.bedrooms} bedroom`}
        image={propertyImage}
        url={propertyUrl}
        type="place"
      />
      <Navbar />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="forrent-container py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="forrent-container grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden relative">
            {/* Heart button */}
            <div className="absolute top-4 left-4 z-30">
              <PropertyCardFavorite id={id!} />
            </div>
            
            {/* Image Gallery - renders immediately with all images */}
            <PropertyImageGalleryOptimized 
              images={allImages}
              mainImage={allImages[0] || '/placeholder.svg'}
              title={criticalData.title}
              featured={fullProperty?.featured}
              youtube_url={fullProperty?.youtube_url}
              video_id={fullProperty?.video_id}
              is_short={fullProperty?.is_short}
            />

            <div className="p-8">
              {/* Critical details - render immediately */}
              <PropertyDetailsSection 
                title={criticalData.title}
                location={criticalData.location}
                address={criticalData.address}
                price={criticalData.price}
                bedrooms={criticalData.bedrooms}
                bathrooms={criticalData.bathrooms}
                sqft={criticalData.sqft}
                type={criticalData.type}
                securityDeposit={criticalData.security_deposit || fullProperty?.security_deposit}
              />
              
              {/* Non-critical sections - lazy loaded */}
              <Suspense fallback={
                <div className="animate-pulse space-y-4 mt-8">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              }>
                {fullProperty && (
                  <>
                    <PropertyDescriptionSection description={fullProperty.description} />
                    <PropertyAdditionalDetails
                      date_available={fullProperty.date_available}
                      laundry_type={fullProperty.laundry_type}
                      parking_type={fullProperty.parking_type}
                      heating_type={fullProperty.heating_type}
                      rental_type={fullProperty.rental_type}
                      cat_friendly={fullProperty.cat_friendly}
                      dog_friendly={fullProperty.dog_friendly}
                      amenities={fullProperty.amenities}
                    />
                  </>
                )}
              </Suspense>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Contact Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact</h2>
              {contactInfo && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    Phone: {contactInfo.phone}
                  </p>
                  <p className="text-gray-700">
                    Email: {contactInfo.email}
                  </p>
                </div>
              )}
            </div>

            {/* Schedule Tour Section */}
            <Suspense fallback={
              <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            }>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Schedule a Tour</h3>
                <ScheduleTourButton 
                  propertyId={id!} 
                  propertyTitle={criticalData.title} 
                  fullWidth={true}
                  size="lg"
                />
              </div>
            </Suspense>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default memo(PropertyDetailFast);