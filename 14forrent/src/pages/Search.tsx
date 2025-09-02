
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import PropertyCardAdapter from "@/components/PropertyCardAdapter";
import PropertyFilters, { FilterState } from "@/components/PropertyFilters";
import SidebarFilters from "@/components/SidebarFilters"; 
import { searchListingsWithAI } from "@/services/ai/search";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";
import { toast } from "sonner";
import Breadcrumb, { BreadcrumbItem } from "@/components/Breadcrumb";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [filteredListings, setFilteredListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Show loading bar when fetching data
  useLoadingBarOnFetch(isLoading || isAiSearching);

  // Fetch all listings on component mount
  useEffect(() => {
    const query = searchParams.get('query');
    
    if (query) {
      // If there's a search query, try AI search first
      performAiSearch(query);
    } else {
      // Otherwise just load all listings
      fetchAllListings();
    }
  }, [searchParams]);

  const performAiSearch = async (query: string) => {
    setIsLoading(true);
    setIsAiSearching(true);
    
    try {
      console.log("Performing AI search for:", query);
      const result = await searchListingsWithAI(query);
      
      if (result.matches && result.matches.length > 0) {
        console.log("AI search found results:", result.matches.length);
        
        // Format listings for the PropertyCard component
        const aiListings = result.matches.map(listing => ({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          address: listing.location,
          location: listing.location,
          beds: listing.bedrooms,
          bedrooms: listing.bedrooms,
          baths: listing.bathrooms,
          bathrooms: listing.bathrooms,
          amenities: listing.amenities || [],
          tags: listing.amenities || [],
          images: listing.images || [],
          description: listing.description,
          similarity: listing.similarity
        }));
        
        setListings(aiListings);
        setFilteredListings(aiListings);
        
        toast.success("AI Search completed", {
          description: `Found ${aiListings.length} properties matching "${query}"`
        });
      } else {
        console.log("AI search found no results, falling back to regular search");
        await fetchAllListings(query);
      }
    } catch (error) {
      console.error("AI search error:", error);
      toast.error("AI search failed", {
        description: "Falling back to standard search"
      });
      await fetchAllListings(query);
    } finally {
      setIsAiSearching(false);
      setIsLoading(false);
    }
  };

  const fetchAllListings = async (query?: string) => {
    if (!isAiSearching) setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .neq('status', 'sold') // Exclude sold listings
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Format listings for the PropertyCard component
      const formattedListings = data.map(listing => ({
        id: listing.id,
        title: listing.title,
        price: listing.price,
        address: listing.location,
        location: listing.location,
        beds: listing.bedrooms,
        bedrooms: listing.bedrooms, 
        baths: listing.bathrooms,
        bathrooms: listing.bathrooms,
        amenities: listing.amenities || [],
        tags: listing.amenities || [],
        images: listing.images || [],
        featured: listing.featured || false,
        description: listing.description
      }));
      
      setListings(formattedListings);
      
      // Apply initial filter if search query exists
      if (query) {
        filterListings({
          priceRange: [0, 10000],
          bedrooms: 0,
          bathrooms: 0,
          amenities: {},
          location: query
        });
      } else {
        setFilteredListings(formattedListings);
      }
    } catch (error: any) {
      console.error("Error fetching listings:", error.message);
      toast.error("Error loading listings");
    } finally {
      setIsLoading(false);
    }
  };

  const filterListings = (filters: FilterState) => {
    // Remove artificial delay for instant filtering
    let filtered = [...listings];
    
    // Filter by location
    if (filters.location) {
      const searchTerm = filters.location.toLowerCase();
      filtered = filtered.filter(
        listing => 
          listing.address?.toLowerCase().includes(searchTerm) || 
            listing.title?.toLowerCase().includes(searchTerm) ||
            listing.description?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filter by price
      if (filters.priceRange && filters.priceRange.length === 2) {
        filtered = filtered.filter(listing => {
          const price = typeof listing.price === 'number' 
            ? listing.price 
            : parseInt((listing.price || '0').toString().replace(/[^\d]/g, ''));
          return price >= filters.priceRange[0] && price <= filters.priceRange[1];
        });
      }
      
      // Filter by bedrooms
      if (filters.bedrooms > 0) {
        filtered = filtered.filter(listing => listing.beds >= filters.bedrooms);
      }
      
      // Filter by bathrooms
      if (filters.bathrooms > 0) {
        filtered = filtered.filter(listing => listing.baths >= filters.bathrooms);
      }
      
      // Filter by amenities
      const selectedAmenities = Object.entries(filters.amenities)
        .filter(([_, selected]) => selected)
        .map(([amenity]) => amenity.toLowerCase());
      
      if (selectedAmenities.length > 0) {
        filtered = filtered.filter(listing => 
          selectedAmenities.every(amenity => 
            (listing.tags || []).some(tag => 
              tag.toLowerCase().includes(amenity.toLowerCase())
            )
          )
        );
      }
      
      // Sort listings to put featured ones first
      filtered.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // If both are featured or not featured, sort by similarity if available
        if (a.similarity !== undefined && b.similarity !== undefined) {
          return b.similarity - a.similarity;
        }
        return 0;
      });
      
    setFilteredListings(filtered);
    
    // Update URL with search query
    if (filters.location) {
      setSearchParams({ query: filters.location });
    } else {
      searchParams.delete('query');
      setSearchParams(searchParams);
    }
  };

  const resetFilters = () => {
    // Sort listings to put featured ones first when resetting
    const sortedListings = [...listings].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return 0;
    });
    setFilteredListings(sortedListings);
    searchParams.delete('query');
    setSearchParams(searchParams);
  };

  const query = searchParams.get('query');
  const location = searchParams.get('location');
  
  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Search Properties", current: !query && !location },
    ...(location ? [{ label: `Properties in ${location}`, current: !query }] : []),
    ...(query ? [{ label: `Results for "${query}"`, current: true }] : [])
  ].filter(item => !item.current || item.label !== "Search Properties");

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta 
        title="Search Apartments for Rent in Los Angeles | Filter by Neighborhood"
        description="Search thousands of LA rental listings. Filter by price, bedrooms, pet-friendly options. Find apartments in Hollywood, Venice Beach, Silver Lake, Westwood & 100+ LA neighborhoods."
        keywords="search apartments los angeles, LA rental search, find apartments LA, hollywood apartments, venice beach rentals, silver lake apartments, westwood rentals, los feliz apartments, echo park rentals, culver city apartments, marina del rey rentals, playa vista apartments"
        url="https://14forrent.com/search"
        type="website"
        canonical="https://14forrent.com/search"
      />
      <Navbar />
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="forrent-container py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>
      
      <main className="flex-1 bg-forrent-gray py-8">
        <div className="forrent-container">
          <h1 className="text-3xl font-bold text-forrent-navy mb-6">Find Rentals</h1>
          
          {/* Mobile Filters */}
          <div className="block md:hidden mb-6">
            <PropertyFilters onFiltersChange={filterListings} currentFilters={{}} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar Filters - Desktop Only */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <SidebarFilters onFiltersChange={filterListings} currentFilters={{}} />
            </div>
            
            {/* Listings */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-forrent-navy/20 mb-4"></div>
                    <div className="h-4 w-36 bg-forrent-navy/20 rounded"></div>
                  </div>
                </div>
              ) : filteredListings.length > 0 ? (
                <div>
                  <p className="text-gray-600 mb-4">Showing {filteredListings.length} results</p>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                    {filteredListings.map(property => (
                      <PropertyCardAdapter 
                        key={property.id} 
                        property={property}
                        manageable={false}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No properties found matching your criteria</h3>
                  <p className="text-gray-500">Try adjusting your filters or searching for a different location</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Search;
