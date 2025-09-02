import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import PropertyCardAdapter from "@/components/PropertyCardAdapter";
import SidebarFilters from "@/components/SidebarFilters";
import { useProperties } from "@/hooks/useProperties";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";
import { Loader2, MapPin, DollarSign, Building2, Train, Coffee, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const DowntownLA = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilters, setCurrentFilters] = useState({
    location: "Downtown Los Angeles"
  });

  // Use the optimized hook with Downtown LA filter
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

  // Filter listings based on Downtown LA location
  const filteredListings = useMemo(() => {
    return listings.filter(listing => {
      const location = listing.location?.toLowerCase() || '';
      const address = listing.address?.toLowerCase() || '';
      const title = listing.title?.toLowerCase() || '';
      
      // Check if property is in Downtown LA
      const isDowntown = 
        location.includes('downtown') ||
        location.includes('dtla') ||
        address.includes('downtown') ||
        location.includes('90012') ||
        location.includes('90013') ||
        location.includes('90014') ||
        location.includes('90015') ||
        location.includes('90017') ||
        location.includes('90021') ||
        location.includes('bunker hill') ||
        location.includes('little tokyo') ||
        location.includes('arts district') ||
        location.includes('financial district') ||
        title.includes('downtown') ||
        title.includes('dtla');
      
      // Apply search term if exists
      if (searchTerm && isDowntown) {
        const search = searchTerm.toLowerCase();
        return title.includes(search) || location.includes(search) || address.includes(search);
      }
      
      return isDowntown;
    });
  }, [listings, searchTerm]);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters({ ...filters, location: "Downtown Los Angeles" });
  };

  // Downtown LA neighborhood stats
  const neighborhoodInfo = {
    avgRent: "$2,500 - $6,000+",
    walkScore: 91,
    transitScore: 89,
    bikeScore: 67,
    population: "85,000",
    metroLines: "6+ Lines"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta 
        title="Downtown LA Apartments for Rent | DTLA Lofts & High-Rise Rentals"
        description="Find modern lofts and luxury high-rise apartments in Downtown Los Angeles. Walk to work, metro access, nightlife. Studios from $2,200, penthouses available."
        keywords="downtown la apartments for rent, dtla lofts, downtown los angeles rentals, arts district apartments, little tokyo rentals, bunker hill apartments, financial district rentals, south park dtla, downtown la high rise apartments"
        url="https://14forrent.com/neighborhoods/downtown-la"
        type="website"
        canonical="https://14forrent.com/neighborhoods/downtown-la"
      />
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-purple-900 text-white py-12">
          <div className="forrent-container">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Central Los Angeles • Urban Core</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Downtown LA (DTLA) Rentals</h1>
            <p className="text-xl opacity-90 mb-6">
              Urban living at its finest in LA's vibrant city center
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-white/10 rounded-lg p-4">
                <DollarSign className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.avgRent}</div>
                <div className="text-sm opacity-75">Avg Monthly Rent</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Train className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.metroLines}</div>
                <div className="text-sm opacity-75">Metro Access</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Building2 className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">{neighborhoodInfo.walkScore}</div>
                <div className="text-sm opacity-75">Walk Score</div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <Music className="h-6 w-6 mb-2" />
                <div className="text-2xl font-bold">100+</div>
                <div className="text-sm opacity-75">Bars & Venues</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Downtown LA Section */}
        <div className="bg-white py-8 border-b">
          <div className="forrent-container">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold mb-4">About Downtown Los Angeles</h2>
              <p className="text-gray-600 mb-4">
                Downtown Los Angeles has transformed into one of the city's most exciting neighborhoods, 
                offering a true urban lifestyle with converted lofts, modern high-rises, and historic 
                buildings. DTLA is home to world-class dining, vibrant nightlife, cultural institutions 
                like The Broad and Walt Disney Concert Hall, and the bustling Grand Central Market. With 
                excellent public transit connections and walkable streets, it's perfect for those who 
                want to live car-free or car-lite.
              </p>
              
              {/* Districts */}
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Arts District</h3>
                  <p className="text-sm text-gray-600">
                    Trendy galleries, breweries, and converted warehouse lofts
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Little Tokyo</h3>
                  <p className="text-sm text-gray-600">
                    Authentic Japanese dining, shops, and modern apartments
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">South Park</h3>
                  <p className="text-sm text-gray-600">
                    Luxury high-rises near Staples Center and LA Live
                  </p>
                </Card>
              </div>
              
              {/* Highlights */}
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Neighborhood Highlights</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Metro Red, Purple, Blue, Expo, Gold Lines</li>
                    <li>• Walk to Grand Central Market</li>
                    <li>• Near Staples Center/Crypto.com Arena</li>
                    <li>• The Broad & MOCA museums</li>
                    <li>• Historic Broadway Theatre District</li>
                    <li>• Whole Foods & Trader Joe's nearby</li>
                  </ul>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Popular Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">City Views</Badge>
                    <Badge variant="secondary">Rooftop Pools</Badge>
                    <Badge variant="secondary">24/7 Gyms</Badge>
                    <Badge variant="secondary">Co-Working Spaces</Badge>
                    <Badge variant="secondary">Pet Parks</Badge>
                    <Badge variant="secondary">Concierge</Badge>
                    <Badge variant="secondary">Parking Included</Badge>
                  </div>
                </Card>
              </div>

              {/* Transit Info */}
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold mb-2">
                  <Train className="inline h-5 w-5 mr-2" />
                  Metro Connectivity
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Downtown LA is the hub of LA Metro with access to:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>• Union Station</div>
                  <div>• 7th St/Metro Center</div>
                  <div>• Pershing Square</div>
                  <div>• Civic Center</div>
                  <div>• Grand Park</div>
                  <div>• Pico Station</div>
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
                  Available Properties in Downtown LA
                </h2>
                <p className="text-gray-600">
                  {filteredListings.length} urban rentals available
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#1A2953] mb-4" />
                    <p className="text-gray-600">Loading Downtown LA properties...</p>
                  </div>
                </div>
              ) : filteredListings.length === 0 ? (
                <Card className="p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Downtown LA Properties Available
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Check back soon for new urban listings in DTLA.
                  </p>
                  <p className="text-sm text-gray-500">
                    Consider expanding your search to nearby Koreatown or Silver Lake.
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

export default DowntownLA;