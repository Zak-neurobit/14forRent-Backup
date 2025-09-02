import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import PropertyCardAdapter from "@/components/PropertyCardAdapter";
import SidebarFilters from "@/components/SidebarFilters";
import { useProperties } from "@/hooks/useProperties";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";
import { Loader2, MapPin, DollarSign, Home, Waves, Bike, Sun } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const SantaMonica = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilters, setCurrentFilters] = useState({
    location: "Santa Monica"
  });

  // Use the optimized hook with Santa Monica filter
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

  // Filter listings based on Santa Monica location
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const location = listing.location?.toLowerCase() || '';
      const address = listing.address?.toLowerCase() || '';
      const title = listing.title?.toLowerCase() || '';
      
      // Check if property is in Santa Monica
      const isSantaMonica = 
        location.includes('santa monica') ||
        address.includes('santa monica') ||
        location.includes('90401') ||
        location.includes('90402') ||
        location.includes('90403') ||
        location.includes('90404') ||
        location.includes('90405') ||
        title.includes('santa monica');
      
      // Apply search term if exists
      if (searchTerm && isSantaMonica) {
        const search = searchTerm.toLowerCase();
        return title.includes(search) || location.includes(search) || address.includes(search);
      }
      
      return isSantaMonica;
    });
  }, [listings, searchTerm]);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters({ ...filters, location: "Santa Monica" });
  };

  // Santa Monica neighborhood stats
  const neighborhoodInfo = {
    avgRent: "$3,200 - $8,000+",
    walkScore: 83,
    transitScore: 64,
    bikeScore: 89,
    population: "92,000",
    beachDistance: "0-2 miles"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta 
        title="Santa Monica Apartments for Rent | Beach Rentals in Santa Monica, CA"
        description="Find beachside apartments and condos for rent in Santa Monica, CA. Ocean views, walk to beach & pier. Studios from $2,800, luxury beach rentals available."
        keywords="santa monica apartments for rent, santa monica beach rentals, ocean view apartments santa monica, santa monica pier apartments, venice beach rentals, main street santa monica apartments, third street promenade rentals, santa monica condos"
        url="https://14forrent.com/neighborhoods/santa-monica"
        type="website"
        canonical="https://14forrent.com/neighborhoods/santa-monica"
      />
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-12">
          <div className="forrent-container">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Los Angeles County • Westside</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Santa Monica Rentals</h1>
            <p className="text-xl opacity-90 mb-6">
              Beachside living with urban convenience in LA's premier coastal city
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 rounded-lg p-4">
                <DollarSign className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.avgRent}</div>
                <div className="text-sm opacity-75">Avg Monthly Rent</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Waves className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.beachDistance}</div>
                <div className="text-sm opacity-75">To Beach</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Bike className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.bikeScore}</div>
                <div className="text-sm opacity-75">Bike Score</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Sun className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">280+</div>
                <div className="text-sm opacity-75">Sunny Days/Year</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Santa Monica Section */}
        <div className="bg-white py-8 border-b">
          <div className="forrent-container">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">About Santa Monica</h2>
              <p className="text-gray-600 mb-4">
                Santa Monica offers the perfect blend of beach town charm and urban sophistication. 
                Home to the iconic Santa Monica Pier, Third Street Promenade, and miles of pristine 
                beaches, this coastal paradise provides residents with year-round outdoor activities, 
                world-class dining, and a thriving tech scene known as "Silicon Beach." The city's 
                excellent public transportation, including the Expo Line to Downtown LA, makes it 
                ideal for commuters.
              </p>
              
              {/* Highlights */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Neighborhood Highlights</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Walk/bike to Santa Monica Beach & Pier</li>
                    <li>• Expo Line access to Downtown LA</li>
                    <li>• Third Street Promenade shopping</li>
                    <li>• Montana Avenue boutiques & cafes</li>
                    <li>• Main Street nightlife & restaurants</li>
                    <li>• Bergamot Station Arts Center</li>
                  </ul>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Popular Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Ocean Views</Badge>
                    <Badge variant="secondary">Beach Access</Badge>
                    <Badge variant="secondary">Bike Storage</Badge>
                    <Badge variant="secondary">Rooftop Decks</Badge>
                    <Badge variant="secondary">Surfboard Storage</Badge>
                    <Badge variant="secondary">EV Charging</Badge>
                    <Badge variant="secondary">Pet Beach Nearby</Badge>
                  </div>
                </Card>
              </div>

              {/* Popular Streets */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Popular Rental Areas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>• Ocean Avenue (Beachfront)</div>
                  <div>• Main Street (Hip & Trendy)</div>
                  <div>• Montana Avenue (Upscale)</div>
                  <div>• Wilshire Boulevard (Transit)</div>
                  <div>• Downtown SM (Urban)</div>
                  <div>• Mid-City (Affordable)</div>
                </div>
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
                  Available Properties in Santa Monica
                </h2>
                <p className="text-gray-600">
                  {filteredListings.length} beach rentals available
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#1A2953] mb-4" />
                    <p className="text-gray-600">Loading Santa Monica properties...</p>
                  </div>
                </div>
              ) : filteredListings.length === 0 ? (
                <Card className="p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Santa Monica Properties Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Check back soon for new beachside listings in Santa Monica.
                  </p>
                  <p className="text-sm text-gray-500">
                    Consider expanding your search to nearby Venice Beach or Marina del Rey.
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

export default SantaMonica;