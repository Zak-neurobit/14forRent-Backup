import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import PropertyCardAdapter from "@/components/PropertyCardAdapter";
import SidebarFilters from "@/components/SidebarFilters";
import { useProperties } from "@/hooks/useProperties";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";
import { Loader2, MapPin, DollarSign, Home, Car, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const BeverlyHills = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilters, setCurrentFilters] = useState({
    location: "Beverly Hills"
  });

  // Use the optimized hook with Beverly Hills filter
  const {
    properties: listings,
    loading: isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
    total
  } = useProperties({
    type: 'available',
    limit: 20,
    filters: currentFilters
  });

  // Show loading bar when fetching properties
  useLoadingBarOnFetch(isLoading);

  // Filter listings based on Beverly Hills location
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const location = listing.location?.toLowerCase() || '';
      const address = listing.address?.toLowerCase() || '';
      const title = listing.title?.toLowerCase() || '';
      
      // Check if property is in Beverly Hills
      const isBeverlyHills = 
        location.includes('beverly hills') ||
        address.includes('beverly hills') ||
        location.includes('90210') ||
        location.includes('90211') ||
        location.includes('90212') ||
        title.includes('beverly hills');
      
      // Apply search term if exists
      if (searchTerm && isBeverlyHills) {
        const search = searchTerm.toLowerCase();
        return title.includes(search) || location.includes(search) || address.includes(search);
      }
      
      return isBeverlyHills;
    });
  }, [listings, searchTerm]);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters({ ...filters, location: "Beverly Hills" });
  };

  // Beverly Hills neighborhood stats
  const neighborhoodInfo = {
    avgRent: "$4,500 - $15,000+",
    walkScore: 70,
    transitScore: 65,
    bikeScore: 77,
    population: "32,000",
    medianIncome: "$110,000"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta 
        title="Beverly Hills Apartments for Rent | Luxury Rentals in Beverly Hills, CA"
        description="Find luxury apartments and houses for rent in Beverly Hills, CA. Browse high-end rentals near Rodeo Drive, Century City. Studios from $3,500, luxury estates available."
        keywords="beverly hills apartments for rent, beverly hills rentals, luxury apartments beverly hills, 90210 apartments, rodeo drive apartments, beverly hills houses for rent, century city rentals, beverly hills condos"
        url="https://14forrent.com/neighborhoods/beverly-hills"
        type="website"
        canonical="https://14forrent.com/neighborhoods/beverly-hills"
      />
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white py-12">
          <div className="forrent-container">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Los Angeles County</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Beverly Hills Rentals</h1>
            <p className="text-xl opacity-90 mb-6">
              Discover luxury living in one of LA's most prestigious neighborhoods
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 rounded-lg p-4">
                <DollarSign className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.avgRent}</div>
                <div className="text-sm opacity-75">Avg Monthly Rent</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Home className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{filteredListings.length}</div>
                <div className="text-sm opacity-75">Available Properties</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Car className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.walkScore}</div>
                <div className="text-sm opacity-75">Walk Score</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <School className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">A+</div>
                <div className="text-sm opacity-75">School Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Beverly Hills Section */}
        <div className="bg-white py-8 border-b">
          <div className="forrent-container">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">About Beverly Hills</h2>
              <p className="text-gray-600 mb-4">
                Beverly Hills is synonymous with luxury and glamour. Home to world-famous Rodeo Drive, 
                this iconic neighborhood offers upscale shopping, fine dining, and some of the most 
                prestigious residential addresses in Los Angeles. The area features tree-lined streets, 
                manicured gardens, and architectural masterpieces ranging from Mediterranean villas to 
                modern estates.
              </p>
              
              {/* Highlights */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Neighborhood Highlights</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Walking distance to Rodeo Drive shopping</li>
                    <li>• Near Century City business district</li>
                    <li>• Excellent Beverly Hills school district</li>
                    <li>• 24/7 security in many buildings</li>
                    <li>• Close to UCLA Medical Center</li>
                  </ul>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Popular Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Luxury Pools</Badge>
                    <Badge variant="secondary">Valet Parking</Badge>
                    <Badge variant="secondary">Concierge</Badge>
                    <Badge variant="secondary">Fitness Centers</Badge>
                    <Badge variant="secondary">Rooftop Terraces</Badge>
                    <Badge variant="secondary">Private Gardens</Badge>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="forrent-container py-8">
          <div className="flex gap-8">
            {/* Sidebar Filters */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-4">
                <h3 className="font-semibold mb-4">Refine Your Search</h3>
                <SidebarFilters 
                  onFiltersChange={handleFiltersChange} 
                  currentFilters={currentFilters} 
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  Available Properties in Beverly Hills
                </h2>
                <p className="text-gray-600">
                  {filteredListings.length} luxury rentals available
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#1A2953] mb-4" />
                    <p className="text-gray-600">Loading Beverly Hills properties...</p>
                  </div>
                </div>
              ) : filteredListings.length === 0 ? (
                <Card className="p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Beverly Hills Properties Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Check back soon for new luxury listings in Beverly Hills.
                  </p>
                  <p className="text-sm text-gray-500">
                    Consider expanding your search to nearby areas like West Hollywood or Century City.
                  </p>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredListings.map((listing) => (
                      <PropertyCardAdapter key={listing.id} property={listing} />
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="px-6 py-3 bg-[#1A2953] text-white rounded-lg hover:bg-[#2A3963] disabled:opacity-50"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          `Load More Properties`
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BeverlyHills;