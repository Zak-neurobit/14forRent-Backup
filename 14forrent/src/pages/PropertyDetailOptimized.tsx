import { useState, useEffect, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Bath,
  BedDouble,
  SquareCode,
  MapPin,
  Phone,
  Mail,
  Loader2,
  Tag,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { PropertyListing } from "@/data/propertyListings";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ScheduleTourButton from "@/components/property/ScheduleTourButton";
import PropertyImageGallery from "@/components/property/PropertyImageGallery";
import PropertyDetailsSection from "@/components/property/PropertyDetailsSection";
import PropertyDescriptionSection from "@/components/property/PropertyDescriptionSection";
import PropertyAdditionalDetails from "@/components/property/PropertyAdditionalDetails";
import YouTubeEmbed from "@/components/property/YouTubeEmbed";
import PropertyCardFavorite from "@/components/property/PropertyCardFavorite";
import SEOMeta from "@/components/SEOMeta";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";
import { generateRealEstateListingStructuredData } from "@/utils/structuredData";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";

// Enhanced cache with IndexedDB for large data
const CACHE_VERSION = 'v3';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface ContactInfo {
  email: string;
  phone: string;
  name: string;
  isAdmin: boolean;
}

interface OptimizedPropertyData {
  property: PropertyListing;
  contactInfo: ContactInfo;
  imageCount: number;
  timestamp: number;
}

// IndexedDB helper for better caching
class PropertyCache {
  private dbName = 'propertyCache';
  private storeName = 'properties';
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async get(id: string): Promise<OptimizedPropertyData | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const data = request.result;
        if (data && Date.now() - data.timestamp < CACHE_TTL) {
          resolve(data);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set(id: string, data: OptimizedPropertyData) {
    if (!this.db) await this.init();
    
    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ ...data, id });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const propertyCache = new PropertyCache();

// Memoized components for better performance
const MemoizedPropertyImageGallery = memo(PropertyImageGallery);
const MemoizedPropertyDetailsSection = memo(PropertyDetailsSection);
const MemoizedPropertyDescriptionSection = memo(PropertyDescriptionSection);

const PropertyDetailOptimized = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageCount, setImageCount] = useState(0);
  const [allImages, setAllImages] = useState<string[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  
  // Use loading bar
  useLoadingBarOnFetch(loading);

  // Optimized fetch with single RPC call
  const fetchPropertyOptimized = useCallback(async (propertyId: string) => {
    try {
      console.log('Fetching property with ID:', propertyId);
      
      // Check IndexedDB cache first
      try {
        const cached = await propertyCache.get(propertyId);
        if (cached) {
          console.log('⚡ Using IndexedDB cache - instant load!');
          setProperty(cached.property);
          setContactInfo(cached.contactInfo);
          setImageCount(cached.imageCount);
          setLoading(false);
          
          // Still load full images in background
          loadRemainingImages(propertyId, cached.imageCount);
          return;
        }
      } catch (cacheError) {
        console.log('Cache error (non-blocking):', cacheError);
        // Continue without cache
      }

      // Try optimized RPC first, fallback to regular query if it fails
      console.log('🚀 Fetching property data...');
      let data: any;
      let error: any;
      
      // Try the optimized RPC
      const rpcResult = await supabase
        .rpc('get_property_optimized', { property_id: propertyId })
        .single();
      
      if (rpcResult.error) {
        console.log('RPC not available, using fallback query...');
        // Fallback to regular query
        const fallbackResult = await supabase
          .from('listings')
          .select(`
            id, title, price, location, address, description,
            bedrooms, bathrooms, sqft, amenities, featured,
            type, status, user_id, images,
            youtube_url, video_id, is_short,
            date_available, laundry_type, parking_type,
            heating_type, rental_type, cat_friendly, dog_friendly,
            created_at, updated_at
          `)
          .eq('id', propertyId)
          .single();
        
        if (fallbackResult.error || !fallbackResult.data) {
          console.error('Error fetching property:', fallbackResult.error);
          toast.error("Property not found");
          navigate('/search');
          return;
        }
        
        // Transform fallback data to match RPC format
        const images = fallbackResult.data.images || [];
        const validImages = images.filter((img: string) => 
          img && typeof img === 'string' && img.trim() !== ''
        );
        
        data = {
          ...fallbackResult.data,
          first_image: validImages[0] || null,
          image_count: validImages.length,
          owner_email: 'info@14ForRent.com',
          owner_phone: '+1 323-774-4700',
          owner_name: 'Property Manager',
          images: validImages // Include the images array
        };
      } else {
        data = rpcResult.data;
      }

      if (!data) {
        console.error('No property data found');
        toast.error("Property not found");
        navigate('/search');
        return;
      }

      // Process the optimized response
      const propertyData: PropertyListing = {
        id: data.id,
        title: data.title,
        price: data.price,
        location: data.location,
        address: data.address || data.location,
        description: data.description || 'No description available',
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft || 0,
        image: data.first_image || '/placeholder.svg',
        images: data.first_image ? [data.first_image] : ['/placeholder.svg'],
        amenities: data.amenities || [],
        featured: data.featured || false,
        type: data.type || "Property",
        youtube_url: data.youtube_url || undefined,
        video_id: data.video_id || undefined,
        is_short: data.is_short || false,
        date_available: data.date_available || undefined,
        laundry_type: data.laundry_type || undefined,
        parking_type: data.parking_type || undefined,
        heating_type: data.heating_type || undefined,
        rental_type: data.rental_type || undefined,
        cat_friendly: data.cat_friendly || false,
        dog_friendly: data.dog_friendly || false,
      };

      const contact: ContactInfo = {
        email: data.owner_email || 'info@14ForRent.com',
        phone: data.owner_phone || '+1 323-774-4700',
        name: data.owner_name || 'Property Manager',
        isAdmin: data.owner_email === 'info@14ForRent.com'
      };

      // Set data immediately
      setProperty(propertyData);
      setContactInfo(contact);
      setImageCount(data.image_count || 0);
      setLoading(false);

      // Cache in IndexedDB
      await propertyCache.set(propertyId, {
        property: propertyData,
        contactInfo: contact,
        imageCount: data.image_count || 0,
        timestamp: Date.now()
      });

      // Load remaining images if there are more
      if (data.image_count > 1) {
        loadRemainingImages(propertyId, data.image_count);
      }

      // Record view in background
      recordView(propertyId);

    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred while fetching property details");
      setLoading(false);
    }
  }, [navigate]);

  // Progressive image loading
  const loadRemainingImages = useCallback(async (propertyId: string, totalImages: number) => {
    if (totalImages <= 1) return;

    setImagesLoading(true);
    
    // Use requestIdleCallback for non-blocking load
    const loadImages = async () => {
      try {
        console.log(`📸 Loading ${totalImages} images progressively...`);
        
        // First load preview images (first 3)
        const { data: preview } = await supabase
          .rpc('get_property_images_preview', { 
            property_id: propertyId,
            limit_count: 3 
          });

        if (preview && preview.length > 1) {
          setAllImages(preview);
          setProperty(prev => prev ? { ...prev, images: preview } : null);
        }

        // Then load all images if more than 3
        if (totalImages > 3) {
          const { data: allImagesData } = await supabase
            .rpc('get_property_images_optimized', { property_id: propertyId });

          if (allImagesData) {
            const images = Array.isArray(allImagesData) ? allImagesData : 
                          allImagesData.images || [];
            const validImages = images.filter((img: string) => 
              img && typeof img === 'string' && img.trim() !== ''
            );
            
            if (validImages.length > 0) {
              setAllImages(validImages);
              setProperty(prev => prev ? { ...prev, images: validImages } : null);
            }
          }
        }
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setImagesLoading(false);
      }
    };

    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loadImages());
    } else {
      setTimeout(loadImages, 100);
    }
  }, []);

  // Non-blocking view recording
  const recordView = useCallback(async (propertyId: string) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        try {
          await supabase.from('listing_views').insert([
            { listing_id: propertyId, viewer_id: user?.id || null }
          ]);
        } catch (error) {
          console.error("Error recording view:", error);
        }
      });
    } else {
      setTimeout(async () => {
        try {
          await supabase.from('listing_views').insert([
            { listing_id: propertyId, viewer_id: user?.id || null }
          ]);
        } catch (error) {
          console.error("Error recording view:", error);
        }
      }, 2000);
    }
  }, [user]);

  useEffect(() => {
    if (!id) {
      navigate('/search');
      return;
    }

    // Prevent double fetching
    if (property && property.id === id) {
      return;
    }

    fetchPropertyOptimized(id);
  }, [id, fetchPropertyOptimized, navigate, property]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading property...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p>Property not found</p>
        </div>
        <Footer />
      </div>
    );
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Search", href: "/search" },
    { label: property.title, href: `/property/${property.id}` },
  ];

  const structuredData = generateRealEstateListingStructuredData(property);

  return (
    <>
      <SEOMeta
        title={`${property.title} - ${property.location} | 14ForRent`}
        description={`${property.bedrooms} bed, ${property.bathrooms} bath property in ${property.location}. ${property.description?.substring(0, 150)}...`}
        image={property.images?.[0] || property.image}
        structuredData={structuredData}
      />
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <div className="container mx-auto px-4 pb-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery with progressive loading */}
              <MemoizedPropertyImageGallery 
                images={property.images || [property.image]} 
                title={property.title}
                isLoading={imagesLoading}
                totalImages={imageCount}
              />

              {/* Title and Price */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {property.title}
                    </h1>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-5 h-5 mr-2" />
                      {property.address || property.location}
                    </div>
                  </div>
                  <PropertyCardFavorite listingId={property.id} />
                </div>

                {/* Price */}
                <div className="text-3xl font-bold text-blue-600 mb-6">
                  ${property.price.toLocaleString()}/mo
                </div>

                {/* Quick Details */}
                <MemoizedPropertyDetailsSection
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  sqft={property.sqft}
                  type={property.type}
                />
              </div>

              {/* Description */}
              <MemoizedPropertyDescriptionSection description={property.description} />

              {/* Additional Details */}
              <PropertyAdditionalDetails
                dateAvailable={property.date_available}
                laundryType={property.laundry_type}
                parkingType={property.parking_type}
                heatingType={property.heating_type}
                rentalType={property.rental_type}
                catFriendly={property.cat_friendly}
                dogFriendly={property.dog_friendly}
              />

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Tag className="w-5 h-5 mr-2" />
                    Amenities
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {property.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Video */}
              {property.youtube_url && (
                <YouTubeEmbed 
                  url={property.youtube_url} 
                  isShort={property.is_short || false}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Contact Information */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  {contactInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-600">
                        <Phone className="w-5 h-5 mr-3 text-gray-400" />
                        <span>{contactInfo.phone}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-5 h-5 mr-3 text-gray-400" />
                        <span>{contactInfo.email}</span>
                      </div>
                      {contactInfo.name && (
                        <div className="flex items-center text-gray-600">
                          <Building className="w-5 h-5 mr-3 text-gray-400" />
                          <span>{contactInfo.name}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p>Contact information is being loaded...</p>
                    </div>
                  )}
                </div>

                {/* Schedule Tour Button */}
                <ScheduleTourButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                  propertyAddress={property.address || property.location}
                />

                {/* Property Type Badge */}
                {property.type && (
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Property Type</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Home className="w-3 h-3" />
                        {property.type}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Featured Badge */}
                {property.featured && (
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center">
                      <Badge className="bg-white text-blue-600">Featured</Badge>
                      <span className="ml-3 text-sm">Premium Listing</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default PropertyDetailOptimized;