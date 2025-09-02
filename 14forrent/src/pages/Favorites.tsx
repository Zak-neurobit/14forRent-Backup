
import PropertyCardAdapter from '@/components/PropertyCardAdapter';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PropertyListing } from "@/data/propertyListings";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Show loading bar when fetching favorites
  useLoadingBarOnFetch(loading);

  // Format property data for the PropertyCardAdapter
  const formatPropertyForAdapter = (property: PropertyListing & { status?: string }) => {
    return {
      id: property.id,
      title: property.title,
      price: typeof property.price === 'string' ? parseFloat(property.price.replace(/[^0-9.-]+/g, "")) : property.price,
      images: property.images,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      location: property.address,
      featured: property.featured,
      status: property.status
    };
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get favorite listings through the join query, but exclude sold ones
        // Only select the fields we actually need for performance
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            listing_id,
            listings(
              id, title, price, location,
              bedrooms, bathrooms, images,
              featured, status
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error("Error fetching favorites:", error);
          toast.error("Failed to load your favorites");
          setLoading(false);
          return;
        }

        if (data && data.length > 0) {
          // Transform the data to match PropertyListing type and filter out sold listings
          const propertyData: PropertyListing[] = data
            .filter(item => item.listings && item.listings.status !== 'sold') // Filter out sold listings
            .map(item => ({
              id: item.listings.id,
              title: item.listings.title,
              price: item.listings.price,
              location: item.listings.location,
              description: '', // Not fetched for performance
              bedrooms: item.listings.bedrooms,
              bathrooms: item.listings.bathrooms,
              sqft: 0, // Not available in the database, using default
              image: item.listings.images && item.listings.images.length > 0 
                ? item.listings.images[0] 
                : '/placeholder.svg',
              images: item.listings.images || [],
              amenities: [], // Not fetched for performance
              featured: item.listings.featured || false,
              address: item.listings.location, // Use location as address
              status: item.listings.status || 'available'
            }));
            
          setFavorites(propertyData);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error("Unexpected error fetching favorites:", error);
        toast.error("Something went wrong while loading your favorites");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-forrent-navy mb-4" />
            <div className="text-forrent-navy">Loading favorites...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-forrent-gray py-8">
        <div className="forrent-container">
          <h1 className="text-3xl font-bold text-forrent-navy mb-6">My Favorites</h1>

          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-600 mb-4">You have no favorite properties available.</div>
              <Link to="/search" className="text-forrent-orange hover:underline">
                Browse properties
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
              {favorites.map(property => (
                <PropertyCardAdapter 
                  key={property.id}
                  property={formatPropertyForAdapter(property)} 
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Favorites;
