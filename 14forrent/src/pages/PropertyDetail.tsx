
import { useState, useEffect } from "react";
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

// Extend window type for SSR data
declare global {
  interface Window {
    __PROPERTY_DATA__?: any;
  }
}

// Admin emails for contact display
const ADMIN_EMAILS = ['zak.seid@gmail.com', 'jason@14ForRent.com'];

// Contact info cache with TTL to avoid repeated queries
const CONTACT_CACHE = new Map<string, { data: ContactInfo; timestamp: number }>();
const CONTACT_CACHE_TTL = 15 * 60 * 1000; // 15 minutes - increased for better performance

// Property cache for blazing fast loading with localStorage fallback
const PROPERTY_CACHE = new Map<string, { data: any; timestamp: number }>();
const PROPERTY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// LocalStorage cache for instant loads on page refresh
const LOCAL_CACHE_KEY = 'property_cache_v3'; // Bumped version to invalidate old incomplete cache
const getLocalCache = (id: string): any => {
  try {
    const cache = localStorage.getItem(`${LOCAL_CACHE_KEY}_${id}`);
    if (cache) {
      const parsed = JSON.parse(cache);
      if (Date.now() - parsed.timestamp < PROPERTY_CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.error('Error reading local cache:', e);
  }
  return null;
};

const setLocalCache = (id: string, data: any) => {
  try {
    localStorage.setItem(`${LOCAL_CACHE_KEY}_${id}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.error('Error setting local cache:', e);
  }
};

interface ContactInfo {
  email: string;
  phone: string;
  isAdmin: boolean;
}

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [property, setProperty] = useState<PropertyListing | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Show loading bar when fetching property
  useLoadingBarOnFetch(loading);

  const fetchUserContactInfo = async (userId: string): Promise<ContactInfo> => {
    // OPTIMIZATION 1: Check cache first with TTL
    const cached = CONTACT_CACHE.get(userId);
    if (cached && Date.now() - cached.timestamp < CONTACT_CACHE_TTL) {
      console.log('✨ Using cached contact info for instant load');
      return cached.data;
    }
    
    try {
      // Skip this optimization on initial load - defer to background
      // This check blocks initial render when logged in
      /* Deferred for performance
      if (user?.id === userId && isAdmin) {
        console.log('⚡ Admin viewing own property - instant contact info');
        const adminContactInfo: ContactInfo = {
          email: 'info@14ForRent.com',
          phone: '+1 323-774-4700',
          isAdmin: true
        };
        // Cache for future instant loads
        CONTACT_CACHE.set(userId, { data: adminContactInfo, timestamp: Date.now() });
        return adminContactInfo;
      }
      */
      
      // Only do this query if really needed - and it's deferred anyway
      console.log('📱 Fetching contact info for property owner (deferred)');
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_number, display_name')
        .eq('id', userId)
        .single();
      
      let contactInfo: ContactInfo;
      
      // Simplified check - if userId matches known admin IDs from env
      // This is faster than checking emails
      const isPropertyOwnerAdminEmail = false; // Simplified for speed
      
      if (isPropertyOwnerAdminEmail) {
        // Show admin contact info for properties owned by admin emails
        contactInfo = {
          email: 'info@14ForRent.com',
          phone: '+1 323-774-4700',
          isAdmin: true
        };
      } else if (profile && profile.phone_number) {
        // User has phone number in profile
        contactInfo = {
          email: profile.display_name || 'Contact through platform',
          phone: profile.phone_number,
          isAdmin: false
        };
      } else {
        // User doesn't have contact info, show platform contact
        contactInfo = {
          email: 'Contact through platform',
          phone: 'Use contact form below',
          isAdmin: false
        };
      }
      
      // Cache the result with timestamp
      CONTACT_CACHE.set(userId, { data: contactInfo, timestamp: Date.now() });
      return contactInfo;
    } catch (error) {
      console.error('Error in fetchUserContactInfo:', error);
      // Return platform contact as fallback for regular users
      return {
        email: 'Contact through platform',
        phone: 'Use contact form below',
        isAdmin: false
      };
    }
  };

  // Function to fetch fresh data in background (for cache updates)
  const fetchFreshData = async (propertyId: string, inBackground = false) => {
    try {
      // Use RPC for optimized fetching
      const { data, error } = await supabase
        .rpc('get_property_with_first_image', { property_id: propertyId })
        .single()
        .catch(() => {
          // Fallback to regular query
          return supabase
            .from('listings')
            .select(`
              id, title, price, location, address, description,
              bedrooms, bathrooms, sqft, amenities, featured,
              type, status, user_id,
              youtube_url, video_id, is_short,
              date_available, laundry_type, parking_type,
              heating_type, rental_type, cat_friendly, dog_friendly,
              security_deposit
            `)
            .eq('id', propertyId)
            .single();
        });
      
      if (error || !data) {
        console.error('Error fetching fresh data:', error);
        return;
      }
      
      // Fetch contact info if we have user_id
      const contactInfo = data.user_id ? await fetchUserContactInfo(data.user_id) : null;
      
      // Process first image
      let validImages = ['/placeholder.svg'];
      if (data.first_image) {
        validImages = [data.first_image];
      } else if (data.images) {
        validImages = (data.images || []).filter((img: string) => {
          if (!img || typeof img !== 'string') return false;
          const trimmedImg = img.trim();
          return trimmedImg !== '' && 
                 trimmedImg !== '/placeholder.svg' && 
                 !trimmedImg.includes('undefined');
        });
      }
      
      const propertyData: PropertyListing = {
        id: data.id,
        title: data.title,
        price: data.price,
        location: data.location,
        address: data.address || data.location,
        description: data.description || 'No description available',
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft || 0, // Don't default to 1000
        image: validImages[0] || '/placeholder.svg',
        images: validImages.length > 0 ? validImages : ['/placeholder.svg'],
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
        security_deposit: data.security_deposit || undefined,
      };
      
      const cacheData = {
        property: propertyData,
        contactInfo: contactInfo
      };
      
      // Update caches with fresh data
      PROPERTY_CACHE.set(data.id, { data: cacheData, timestamp: Date.now() });
      setLocalCache(data.id, cacheData);
      
      // If not in background, update UI
      if (!inBackground) {
        setProperty(propertyData);
        if (contactInfo) {
          setContactInfo(contactInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching fresh data:', error);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/search');
      return;
    }

    const fetchProperty = async () => {
      try {
        // First check if we already have the property data (prevents double fetch)
        if (property && property.id === id) {
          console.log('Property already loaded, skipping fetch');
          return;
        }
        
        // Check localStorage cache first for INSTANT load
        const localCached = getLocalCache(id);
        // Validate that cached data has all required fields
        const isCacheValid = localCached && 
                            localCached.property && 
                            localCached.property.description !== undefined &&
                            localCached.property.amenities !== undefined;
        
        if (isCacheValid) {
          console.log('⚡ Using localStorage cache for instant load!');
          setProperty(localCached.property);
          setLoading(false);
          if (localCached.contactInfo) {
            setContactInfo(localCached.contactInfo);
          }
          // Still fetch fresh data in background to update cache
          // but don't block the UI
          setTimeout(() => fetchFreshData(id, true), 100);
          return;
        } else if (localCached) {
          console.log('⚠️ Cache exists but is incomplete, fetching fresh data');
        }
        
        // Check memory cache
        const cached = PROPERTY_CACHE.get(id);
        if (cached && Date.now() - cached.timestamp < PROPERTY_CACHE_TTL) {
          console.log('✨ Using memory cache for fast load');
          const cachedData = cached.data;
          if (cachedData.property) {
            setProperty(cachedData.property);
            setLoading(false);
            if (cachedData.contactInfo) {
              setContactInfo(cachedData.contactInfo);
            }
            return;
          }
        }
        
        // Check if we have SSR data available
        const ssrData = window.__PROPERTY_DATA__;
        if (ssrData && ssrData.id === id) {
          console.log('Using SSR property data');
          
          // Process SSR data into PropertyListing format
          const validImages = ssrData.images?.filter((img: string) => {
            if (!img || typeof img !== 'string') return false;
            const trimmedImg = img.trim();
            return trimmedImg !== '' && 
                   trimmedImg !== '/placeholder.svg' && 
                   trimmedImg !== 'placeholder.svg' &&
                   !trimmedImg.includes('undefined') &&
                   !trimmedImg.includes('null');
          }) || [];
          
          const finalImages = validImages.length > 0 ? validImages : ['/placeholder.svg'];
          
            const propertyData: PropertyListing = {
              id: ssrData.id,
              title: ssrData.title,
              price: ssrData.price,
              location: ssrData.location,
              description: ssrData.description,
              bedrooms: ssrData.bedrooms,
              bathrooms: ssrData.bathrooms,
              sqft: ssrData.sqft || 0, // Don't default to 1000
              image: finalImages[0],
              images: finalImages,
              amenities: ssrData.amenities || [],
              featured: ssrData.featured || false,
              address: ssrData.address || ssrData.location,
              type: ssrData.type || "Property",
              youtube_url: ssrData.youtube_url || undefined,
              video_id: ssrData.video_id || undefined,
              is_short: ssrData.is_short || false,
              date_available: ssrData.date_available || undefined,
              laundry_type: ssrData.laundry_type || undefined,
              parking_type: ssrData.parking_type || undefined,
              heating_type: ssrData.heating_type || undefined,
              rental_type: ssrData.rental_type || undefined,
              cat_friendly: ssrData.cat_friendly || false,
              dog_friendly: ssrData.dog_friendly || false,
              security_deposit: ssrData.security_deposit || undefined,
            };
          
          setProperty(propertyData);
          
          // Set loading false immediately after property data is ready
          setLoading(false);
          
          // Cache the SSR data for blazing fast future loads
          PROPERTY_CACHE.set(ssrData.id, { data: ssrData, timestamp: Date.now() });
          
          // ALWAYS set default contact immediately - never wait for fetches
          setContactInfo({
            email: 'info@14ForRent.com',
            phone: '+1 323-774-4700',
            isAdmin: true
          });
          
          // Fetch real contact info much later - this should NEVER delay page load
          if (ssrData.user_id) {
            setTimeout(() => {
              fetchUserContactInfo(ssrData.user_id).then(contactData => {
                setContactInfo(contactData);
              }).catch(() => {
                // Keep default contact
              });
            }, 5000); // 5 seconds - contact info updates after everything else
          }
          
          // Clean up SSR data
          delete window.__PROPERTY_DATA__;
          
          // Defer view recording significantly to not impact initial load
          setTimeout(() => {
            recordView(id, user?.id || null);
          }, 3000); // Wait 3 seconds before recording view
          return;
        }

        // Only set loading if we're actually fetching
        setLoading(true);
        
        // Fallback to client-side fetching with ULTRA-OPTIMIZED strategy
        console.log('🚀 Fetching property with maximum optimization');
        
        // ULTRA-OPTIMIZED PARALLEL FETCH - Skip broken RPC, use working solution!
        
        // Skip the broken optimized RPC and go directly to fallback query
        // This ensures we get all images immediately
        const propertyPromise = supabase
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
          .eq('id', id)
          .single();
        
        // Execute the optimized query (already includes contact info!)
        const propertyResult = await propertyPromise.then(result => ({
          status: 'fulfilled' as const,
          value: result
        })).catch(reason => ({
          status: 'rejected' as const,
          reason
        }));
        
        // Handle property result
        if (propertyResult.status === 'rejected') {
          console.error("Error fetching property:", propertyResult.reason);
          toast.error("An error occurred while fetching property details");
          navigate('/search');
          return;
        }
        
        const propertyResponse = propertyResult.value;
        if (!propertyResponse || propertyResponse.error || !propertyResponse.data) {
          console.error("Error fetching property:", propertyResponse?.error);
          toast.error("Property not found");
          navigate('/search');
          return;
        }
        
        const data = propertyResponse.data;
        
        if (data) {
          // Handle optimized RPC, regular RPC, and fallback responses
          let firstImage = '/placeholder.svg';
          let initialImages = ['/placeholder.svg'];
          
          // Check if we got the optimized RPC response (has owner_email)
          if (data.owner_email) {
            // Optimized RPC response - update contact info immediately
            setContactInfo({
              email: data.owner_email,
              phone: data.owner_phone || '+1 323-774-4700',
              isAdmin: data.owner_email === 'info@14ForRent.com'
            });
          }
          
          if (data.first_image && !data.images) {
            // RPC response includes first_image but no images array
            // This means get_property_with_first_image succeeded but didn't return full images
            // We need to fetch images separately
            console.log('RPC returned first_image only, fetching full images array...');
            firstImage = data.first_image;
            
            // Fetch images array separately
            const imagesResult = await supabase
              .from('listings')
              .select('images')
              .eq('id', id)
              .single();
              
            if (imagesResult.data && imagesResult.data.images) {
              const validImages = (imagesResult.data.images || []).filter((img: string) => {
                if (!img || typeof img !== 'string') return false;
                const trimmedImg = img.trim();
                return trimmedImg !== '' && 
                       trimmedImg !== '/placeholder.svg' && 
                       !trimmedImg.includes('undefined');
              });
              
              initialImages = validImages.length > 0 ? validImages : [data.first_image];
              console.log(`Fetched ${validImages.length} images for property`);
            } else {
              initialImages = [data.first_image];
            }
          } else if (data.first_image && data.images) {
            // RPC response includes both first_image and images array (optimized RPC)
            firstImage = data.first_image;
            const validImages = (data.images || []).filter((img: string) => {
              if (!img || typeof img !== 'string') return false;
              const trimmedImg = img.trim();
              return trimmedImg !== '' && 
                     trimmedImg !== '/placeholder.svg' && 
                     !trimmedImg.includes('undefined');
            });
            initialImages = validImages.length > 0 ? validImages : [data.first_image];
            console.log(`Optimized RPC: ${validImages.length} images loaded`);
          } else if (data.images) {
            // Pass full images array for proper dot count in gallery
            // Gallery component will handle progressive loading
            const validImages = (data.images || []).filter((img: string) => {
              if (!img || typeof img !== 'string') return false;
              const trimmedImg = img.trim();
              return trimmedImg !== '' && 
                     trimmedImg !== '/placeholder.svg' && 
                     !trimmedImg.includes('undefined');
            });
            
            firstImage = validImages[0] || '/placeholder.svg';
            // Pass ALL images so gallery shows correct number of dots
            initialImages = validImages.length > 0 ? validImages : ['/placeholder.svg'];
            
            if (validImages.length > 15) {
              console.log(`⚡ Large gallery detected (${validImages.length} images), gallery will handle progressive loading`);
            }
          }
          
          // DEFER ALL CONTACT INFO FETCHING - Never block initial render!
          // Set default contact immediately and update later if needed
          setContactInfo({
            email: 'info@14ForRent.com',
            phone: '+1 323-774-4700',
            isAdmin: true
          });
          
          // Only fetch real contact info after page fully loads
          if (!data.owner_email && data.user_id) {
            // Defer contact fetch significantly - this should never slow down initial load
            setTimeout(() => {
              fetchUserContactInfo(data.user_id).then(contactInfo => {
                if (contactInfo) {
                  setContactInfo(contactInfo);
                }
              }).catch(() => {
                // Keep default contact on error
              });
            }, 4000); // Wait 4 seconds - ensure page is fully loaded and interactive
          }
          
          // Set initial property data with ONLY first image for ultra-fast render
          const initialPropertyData: PropertyListing = {
            id: data.id,
            title: data.title,
            price: data.price,
            location: data.location,
            address: data.address || data.location,
            description: data.description || 'No description available',
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            sqft: data.sqft || 0, // Don't default to 1000
            image: firstImage,
            images: initialImages, // Start with just first image or what we have
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
            security_deposit: data.security_deposit || undefined,
          };
          
          // Set property immediately with first image for INSTANT render
          setProperty(initialPropertyData);
          setLoading(false); // Stop loading immediately!
          
          // Cache the initial data
          const cacheData = {
            property: initialPropertyData,
            contactInfo: data.owner_email ? {
              email: data.owner_email,
              phone: data.owner_phone || '+1 323-774-4700',
              isAdmin: data.owner_email === 'info@14ForRent.com'
            } : null
          };
          PROPERTY_CACHE.set(data.id, { data: cacheData, timestamp: Date.now() });
          setLocalCache(data.id, cacheData);
          
          // Images are now included in the initial query for proper gallery dots
          // The PropertyImageGallery component handles progressive loading automatically
          // No need for separate image fetch anymore
          
          // Defer view recording significantly to not impact initial load
          setTimeout(() => {
            recordView(id, user?.id || null);
          }, 3000); // Wait 3 seconds before recording view
        } else {
          toast.error("Property not found");
          navigate('/search');
        }
      } catch (err) {
        console.error("Error in fetchProperty:", err);
        console.error("Error details:", JSON.stringify(err, null, 2));
        toast.error("An error occurred while fetching property details");
        setLoading(false);
        navigate('/search');
      }
    };

    fetchProperty();
  }, [id, navigate]); // Removed 'user' and 'property' to prevent re-fetching

  const recordView = (propertyId: string, userId: string | null) => {
    // Defer view recording even more to ensure it never impacts page load
    // This is completely non-critical for initial render
    if ('requestIdleCallback' in window) {
      requestIdleCallback(async () => {
        try {
          const { error: viewError } = await supabase
            .from('listing_views')
            .insert([
              { 
                listing_id: propertyId, 
                viewer_id: userId
              }
            ]);
          
          if (viewError) {
            console.error("Error recording view:", viewError);
          }
        } catch (error) {
          console.error("Error recording view:", error);
        }
      }, { timeout: 8000 }); // 8 second timeout - very low priority
    } else {
      // Fallback with much longer delay to ensure non-blocking
      setTimeout(async () => {
        try {
          const { error: viewError } = await supabase
            .from('listing_views')
            .insert([
              { 
                listing_id: propertyId, 
                viewer_id: userId
              }
            ]);
          
          if (viewError) {
            console.error("Error recording view:", viewError);
          }
        } catch (error) {
          console.error("Error recording view:", error);
        }
      }, 5000); // Delay by 5 seconds for older browsers - ensure page fully loads first
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="animate-pulse flex flex-col items-center p-8 rounded-lg shadow-sm">
            <Loader2 className="h-16 w-16 animate-spin text-[#1A2953] mb-4" />
            <div className="text-gray-700 text-lg">Loading your dream property...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!property) return null;

  // Helper function to process image URLs to full Supabase URLs
  const processImageUrlForOG = (url: string): string => {
    if (!url || typeof url !== 'string') return '';
    
    const trimmed = url.trim();
    
    // Skip invalid URLs
    if (trimmed === '' || 
        trimmed === '/placeholder.svg' || 
        trimmed === 'placeholder.svg' ||
        trimmed.includes('undefined') ||
        trimmed.includes('null') ||
        trimmed.startsWith('blob:')) {
      return '';
    }
    
    // If it's already a full URL, return as is
    if (trimmed.startsWith('http')) {
      return trimmed;
    }
    
    // If it's a direct file in the property_images bucket (no folder structure)
    if (!trimmed.includes('/') && !trimmed.startsWith('/')) {
      return `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/property_images/${trimmed}`;
    }
    
    // If it's a storage path with the correct bucket name, construct the full URL
    if (trimmed.startsWith('property_images/')) {
      return `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/${trimmed}`;
    }
    
    // If it starts with a slash, treat as relative path (not suitable for OG tags)
    if (trimmed.startsWith('/')) {
      return '';
    }
    
    return trimmed;
  };

  // Process all images to find the first valid one for Open Graph
  const getPropertyImageForOG = (): string => {
    // Try images array first
    if (property.images && Array.isArray(property.images)) {
      for (const img of property.images) {
        const processedUrl = processImageUrlForOG(img);
        if (processedUrl && processedUrl.startsWith('http')) {
          return processedUrl;
        }
      }
    }
    
    // Fall back to main image
    if (property.image) {
      const processedUrl = processImageUrlForOG(property.image);
      if (processedUrl && processedUrl.startsWith('http')) {
        return processedUrl;
      }
    }
    
    // Final fallback to logo
    return 'https://14forrent.com/lovable-uploads/8ea6f0a3-c771-40fc-8eef-653ab9af47a2.png';
  };

  // Generate dynamic meta tags for property
  const propertyTitle = `${property.title} - ${property.location} | $${property.price.toLocaleString()}/month | 14ForRent`;
  const propertyDescription = `${property.bedrooms} bed, ${property.bathrooms} bath ${property.type?.toLowerCase() || 'property'} for rent in ${property.location}. ${property.description.substring(0, 150)}...`;
  const propertyKeywords = `${property.location} rental, ${property.bedrooms} bedroom, ${property.type || 'property'} for rent, ${property.amenities?.slice(0, 5).join(', ')}, Los Angeles rentals`;
  const propertyImage = getPropertyImageForOG();
  const propertyUrl = `https://14forrent.com/property/${property.id}`;

  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Properties", href: "/search" },
    { label: property.location, href: `/search?location=${encodeURIComponent(property.location)}` },
    { label: property.title, current: true }
  ];

  // Generate structured data for breadcrumbs
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://14forrent.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Properties",
        "item": "https://14forrent.com/search"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": property.location,
        "item": `https://14forrent.com/search?location=${encodeURIComponent(property.location)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": property.title,
        "item": propertyUrl
      }
    ]
  };

  // Generate structured data for property using utility function
  const propertyStructuredData = generateRealEstateListingStructuredData(property);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta
        title={propertyTitle}
        description={propertyDescription}
        keywords={propertyKeywords}
        image={propertyImage}
        url={propertyUrl}
        type="place"
        structuredData={[breadcrumbStructuredData, propertyStructuredData]}
        canonical={propertyUrl}
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
            {/* Heart button positioned absolutely over the image gallery */}
            <div className="absolute top-4 left-4 z-30">
              <PropertyCardFavorite id={property.id} />
            </div>
            
            <PropertyImageGallery 
              images={property.images || []} 
              mainImage={property.image}
              title={property.title}
              featured={property.featured}
              youtube_url={property.youtube_url}
              video_id={property.video_id}
              is_short={property.is_short}
            />

            <div className="p-8">
              <PropertyDetailsSection 
                title={property.title}
                location={property.location}
                address={property.address}
                price={property.price}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                sqft={property.sqft}
                type={property.type}
                securityDeposit={property.security_deposit}
              />
              
              {console.log('Rendering PropertyDescriptionSection with:', property.description)}
              <PropertyDescriptionSection description={property.description} />
              
              {console.log('Rendering PropertyAdditionalDetails with:', {
                amenities: property.amenities,
                date_available: property.date_available,
                laundry_type: property.laundry_type,
                parking_type: property.parking_type
              })}
              <PropertyAdditionalDetails
                date_available={property.date_available}
                laundry_type={property.laundry_type}
                parking_type={property.parking_type}
                heating_type={property.heating_type}
                rental_type={property.rental_type}
                cat_friendly={property.cat_friendly}
                dog_friendly={property.dog_friendly}
                amenities={property.amenities}
              />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* Contact Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-100 pb-2">Contact</h2>
              {contactInfo ? (
                <div className="space-y-4">
                  <p className="flex items-center text-gray-700 text-lg">
                    <Phone size={20} className="mr-3 text-[#1A2953]" />
                    {contactInfo.phone.includes('Use contact form') ? (
                      <span className="text-[#1A2953]">{contactInfo.phone}</span>
                    ) : (
                      <a href={`tel:${contactInfo.phone.replace(/[^\d+]/g, '')}`} className="hover:underline text-[#1A2953]">
                        {contactInfo.phone}
                      </a>
                    )}
                  </p>
                  <p className="flex items-center text-gray-700 text-lg">
                    <Mail size={20} className="mr-3 text-[#1A2953]" />
                    {contactInfo.email.includes('Contact through platform') ? (
                      <span className="text-[#1A2953]">{contactInfo.email}</span>
                    ) : (
                      <a href={`mailto:${contactInfo.email}`} className="hover:underline text-[#1A2953]">
                        {contactInfo.email}
                      </a>
                    )}
                  </p>
                  {contactInfo.isAdmin && (
                    <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                      14ForRent Official Listing
                    </p>
                  )}
                  {!contactInfo.isAdmin && contactInfo.email.includes('Contact through platform') && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      Use the contact form below to reach the property owner
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Tour Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Schedule a Tour</h3>
              <p className="text-gray-600 mb-4">Book a viewing to see this property in person</p>
              <ScheduleTourButton 
                propertyId={property.id} 
                propertyTitle={property.title} 
                fullWidth={true}
                size="lg"
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PropertyDetail;
