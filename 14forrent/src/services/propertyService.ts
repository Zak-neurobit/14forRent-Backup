import { supabase } from "@/integrations/supabase/client";
import { cache, cacheKeys, cacheTTL } from "@/utils/cache";
import { PropertyListing } from "@/data/propertyListings";

interface FetchOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  filters?: {
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    location?: string;
    featured?: boolean;
  };
  useCache?: boolean;
  cacheTtl?: number;
}

class PropertyService {
  private static instance: PropertyService;
  private fetchPromises: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  /**
   * Fetch hot deals (newest properties) with caching
   */
  async getHotDeals(limit: number = 8): Promise<PropertyListing[]> {
    const cacheKey = cacheKeys.listings.hotDeals(limit);
    
    // Check cache first
    const cached = cache.get<PropertyListing[]>(cacheKey);
    if (cached) {
      console.log('Returning cached hot deals');
      // Optionally refresh in background
      this.refreshHotDealsInBackground(limit);
      return cached;
    }

    // Prevent duplicate requests
    const existingPromise = this.fetchPromises.get(cacheKey);
    if (existingPromise) {
      return existingPromise;
    }

    const fetchPromise = this.fetchHotDealsFromDb(limit);
    this.fetchPromises.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      // Use longer cache for hot deals since they don't change frequently
      cache.set(cacheKey, result, cacheTTL.long);
      return result;
    } finally {
      this.fetchPromises.delete(cacheKey);
    }
  }

  private async fetchHotDealsFromDb(limit: number): Promise<PropertyListing[]> {
    console.log('Fetching hot deals from database - optimized without images array');
    
    // Fetch properties WITHOUT the heavy images array
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, price, location, address, description,
        bedrooms, bathrooms, sqft, images, amenities,
        featured, type, status, created_at, updated_at, security_deposit
      `)
      .neq('status', 'sold')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching hot deals:', error);
      throw error;
    }

    // For now, use the images array but we should optimize this in the future
    // by fetching only the first image
    return this.formatListings(data || []);
  }

  private async refreshHotDealsInBackground(limit: number): Promise<void> {
    // Refresh cache in background without blocking
    setTimeout(async () => {
      try {
        const fresh = await this.fetchHotDealsFromDb(limit);
        const cacheKey = cacheKeys.listings.hotDeals(limit);
        cache.set(cacheKey, fresh, cacheTTL.medium);
        console.log('Background refresh completed for hot deals');
      } catch (error) {
        console.error('Background refresh failed:', error);
      }
    }, 100);
  }

  /**
   * Fetch available properties with pagination and caching
   */
  async getAvailableProperties(options: FetchOptions = {}): Promise<{
    data: PropertyListing[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'created_at',
      ascending = false,
      filters = {},
      useCache = true,
      cacheTtl = cacheTTL.medium
    } = options;

    const cacheKey = cacheKeys.listings.filtered({ ...filters, limit, offset, orderBy, ascending });
    
    // Check cache if enabled
    if (useCache) {
      const cached = cache.get<{ data: PropertyListing[]; total: number; hasMore: boolean }>(cacheKey);
      if (cached) {
        console.log('Returning cached properties');
        return cached;
      }
    }

    console.log('Fetching properties from database with options:', options);
    
    // Build query - optimize by selecting only needed fields
    let query = supabase
      .from('listings')
      .select(`
        id, title, price, location, address,
        bedrooms, bathrooms, sqft, images,
        featured, type, status
      `, { count: 'exact' });

    // Apply filters
    if (filters.status !== undefined) {
      query = query.eq('status', filters.status);
    } else {
      query = query.neq('status', 'sold');
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
      query = query.eq('bedrooms', filters.bedrooms);
    }

    if (filters.bathrooms !== undefined && filters.bathrooms > 0) {
      query = query.eq('bathrooms', filters.bathrooms);
    }

    if (filters.location) {
      query = query.or(`location.ilike.%${filters.location}%,address.ilike.%${filters.location}%`);
    }

    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured);
    }

    // Apply ordering and pagination
    query = query
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }

    const result = {
      data: this.formatListings(data || []),
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    };

    // Cache the result with optimized TTL
    if (useCache) {
      // Use longer cache for filtered results since they're expensive to compute
      const optimizedTtl = filters && Object.keys(filters).length > 0 ? cacheTTL.long : cacheTtl;
      cache.set(cacheKey, result, optimizedTtl);
    }

    return result;
  }

  /**
   * Get a single property by ID with ULTRA-OPTIMIZED caching
   */
  async getPropertyById(id: string): Promise<PropertyListing | null> {
    const cacheKey = cacheKeys.listings.byId(id);
    
    // Check cache first
    const cached = cache.get<PropertyListing>(cacheKey);
    if (cached) {
      console.log('⚡ Returning cached property:', id);
      return cached;
    }

    console.log('🚀 Fetching property with optimization:', id);
    
    // Try RPC first for optimized fetching (only first image)
    let result = await supabase
      .rpc('get_property_with_first_image', { property_id: id })
      .single();
    
    // Fallback to regular query if RPC fails
    if (result.error) {
      console.log('RPC not available, using fallback query');
      result = await supabase
        .from('listings')
        .select(`
          id, title, price, location, address, description,
          bedrooms, bathrooms, sqft, amenities, featured,
          type, status, user_id, created_at, updated_at,
          youtube_url, video_id, is_short,
          date_available, laundry_type, parking_type,
          heating_type, rental_type, cat_friendly, dog_friendly, security_deposit
        `)
        .eq('id', id)
        .single();
    }

    if (result.error || !result.data) {
      console.error('Error fetching property:', result.error);
      return null;
    }
    
    const data = result.data;
    
    // Process first image
    let firstImage = '/placeholder.svg';
    let images = ['/placeholder.svg'];
    
    if (data.first_image) {
      // RPC response with first_image
      firstImage = data.first_image;
      images = [data.first_image];
    } else if (data.images) {
      // Fallback with full images array
      const validImages = (data.images || []).filter((img: string) => {
        if (!img || typeof img !== 'string') return false;
        const trimmedImg = img.trim();
        return trimmedImg !== '' && 
               trimmedImg !== '/placeholder.svg' && 
               !trimmedImg.includes('undefined');
      });
      firstImage = validImages[0] || '/placeholder.svg';
      images = validImages.length > 0 ? validImages : ['/placeholder.svg'];
    }
    
    // Format with optimized data
    const formatted: PropertyListing = {
      ...data,
      beds: data.bedrooms,
      baths: data.bathrooms,
      images: images,
      image: firstImage
    };
    
    // Cache for longer since individual properties don't change often
    cache.set(cacheKey, formatted, cacheTTL.long);
    
    return formatted;
  }

  /**
   * Search properties with text query
   */
  async searchProperties(query: string, limit: number = 20): Promise<PropertyListing[]> {
    const cacheKey = cacheKeys.listings.search(query);
    
    // Check cache first
    const cached = cache.get<PropertyListing[]>(cacheKey);
    if (cached) {
      console.log('Returning cached search results');
      return cached;
    }

    console.log('Searching properties:', query);
    
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, price, location, address, description,
        bedrooms, bathrooms, sqft, images, amenities,
        featured, type, status, created_at, updated_at, security_deposit
      `)
      .neq('status', 'sold')
      .or(`title.ilike.%${query}%,location.ilike.%${query}%,address.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching properties:', error);
      throw error;
    }

    const results = this.formatListings(data || []);
    
    // Cache search results for shorter time
    cache.set(cacheKey, results, cacheTTL.short);
    
    return results;
  }

  /**
   * Invalidate cache for properties
   */
  invalidateCache(type?: string, id?: string): void {
    if (type === 'listings') {
      // Clear all listing-related caches
      const keys = cache.keys();
      keys.forEach(key => {
        if (key.includes('listings') || key.includes('properties')) {
          cache.delete(key);
        }
      });
      console.log('Invalidated all listing caches');
    } else if (id) {
      // Clear specific property cache
      cache.delete(cacheKeys.listings.byId(id));
      // Also clear search and filter caches since they might contain this property
      const keys = cache.keys();
      keys.forEach(key => {
        if (key.includes('search') || key.includes('filtered')) {
          cache.delete(key);
        }
      });
      console.log(`Invalidated cache for property: ${id}`);
    } else {
      // Clear all caches
      cache.clear();
      console.log('Cleared entire cache');
    }
  }

  /**
   * Preload critical data for better performance
   */
  async preloadCriticalData(): Promise<void> {
    console.log('Preloading critical data...');
    
    // Preload hot deals in parallel
    await Promise.all([
      this.getHotDeals(8),
      this.getAvailableProperties({ limit: 20 })
    ]);
    
    console.log('Critical data preloaded');
  }

  /**
   * Delete listing images from storage
   */
  async deleteListingImages(listingId: string): Promise<void> {
    try {
      // First fetch the listing to get image paths
      const { data: listing, error: fetchError } = await supabase
        .from('listings')
        .select('images, user_id')
        .eq('id', listingId)
        .single();

      if (fetchError || !listing) {
        console.error('Error fetching listing for image deletion:', fetchError);
        return;
      }

      if (!listing.images || listing.images.length === 0) {
        console.log('No images to delete for listing:', listingId);
        return;
      }

      // Delete each image from storage
      const deletePromises = listing.images.map(async (imagePath: string) => {
        try {
          // Extract the file path from the full URL or use as-is if it's already a path
          let filePath = imagePath;
          
          if (imagePath.includes('property_images/')) {
            // Extract path after 'property_images/'
            const parts = imagePath.split('property_images/');
            filePath = parts[parts.length - 1];
          } else if (imagePath.startsWith('http')) {
            // Extract from full URL
            const url = new URL(imagePath);
            const pathParts = url.pathname.split('/property_images/');
            if (pathParts.length > 1) {
              filePath = pathParts[1];
            }
          }

          if (filePath && !filePath.startsWith('/placeholder')) {
            console.log('Deleting image from storage:', filePath);
            
            const { error } = await supabase.storage
              .from('property_images')
              .remove([filePath]);

            if (error) {
              console.error('Error deleting image:', filePath, error);
            } else {
              console.log('Successfully deleted image:', filePath);
            }
          }
        } catch (error) {
          console.error('Error processing image deletion:', imagePath, error);
        }
      });

      await Promise.all(deletePromises);
      console.log('Completed image deletion for listing:', listingId);
    } catch (error) {
      console.error('Error in deleteListingImages:', error);
    }
  }

  /**
   * Permanently delete a listing and all associated data
   */
  async deleteListing(listingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete images from storage first
      await this.deleteListingImages(listingId);

      // Delete the listing from database (will cascade to related tables)
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) {
        console.error('Error deleting listing:', error);
        return { success: false, error: error.message };
      }

      // Invalidate cache for this listing
      cache.delete(cacheKeys.listings.byId(listingId));
      this.invalidateCache('listings');

      console.log('Successfully deleted listing:', listingId);
      return { success: true };
    } catch (error) {
      console.error('Error in deleteListing:', error);
      return { success: false, error: 'Failed to delete listing' };
    }
  }

  /**
   * Format raw database listings to PropertyListing type
   */
  private formatListings(data: any[]): PropertyListing[] {
    return data.map(listing => ({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      location: listing.location,
      address: listing.address || listing.location,
      description: listing.description,
      bedrooms: listing.bedrooms,
      beds: listing.bedrooms,
      bathrooms: listing.bathrooms,
      baths: listing.bathrooms,
      sqft: listing.sqft,
      images: listing.images || [],
      image: listing.images?.[0] || '/placeholder.svg',
      amenities: listing.amenities || [],
      featured: listing.featured || false,
      type: listing.type,
      status: listing.status,
      created_at: listing.created_at,
      updated_at: listing.updated_at,
      user_id: listing.user_id,
      youtube_url: listing.youtube_url,
      video_id: listing.video_id,
      is_short: listing.is_short,
      date_available: listing.date_available,
      laundry_type: listing.laundry_type,
      parking_type: listing.parking_type,
      heating_type: listing.heating_type,
      rental_type: listing.rental_type,
      cat_friendly: listing.cat_friendly,
      dog_friendly: listing.dog_friendly,
      security_deposit: listing.security_deposit
    }));
  }
}

// Export singleton instance
export const propertyService = PropertyService.getInstance();