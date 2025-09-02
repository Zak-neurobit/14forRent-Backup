
import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import PropertyCardAdapter from "@/components/PropertyCardAdapter";
import SidebarFilters from "@/components/SidebarFilters";
import { useProperties } from "@/hooks/useProperties";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";
import { Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const AvailableUnits = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentFilters, setCurrentFilters] = useState({});
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Use the optimized hook with pagination
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

  // Filter listings based on search term
  const filteredListings = useMemo(() => {
    if (!searchTerm) return listings;
    
    return listings.filter(listing =>
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (listing.address && listing.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [listings, searchTerm]);

  const handleFiltersChange = (filters: any) => {
    setCurrentFilters(filters);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta 
        title="Available Apartments & Houses for Rent in LA Today | Hot Deals"
        description="View all available rentals in Los Angeles updated daily. New listings, move-in specials, no broker fees. Studios from $1,500, 1BR from $2,200, luxury rentals available."
        keywords="available apartments los angeles, LA rentals today, new listings los angeles, move in specials LA, no broker fee apartments, studio apartments LA under 2000, cheap apartments los angeles, luxury apartments for rent LA, furnished apartments los angeles, short term rentals LA"
        url="https://14forrent.com/available-units"
        type="website"
        canonical="https://14forrent.com/available-units"
      />
      <Navbar />
      
      <main className="flex-1 bg-gray-50">
        <div className="forrent-container py-4 sm:py-8">
          <div className="text-center mb-6 sm:mb-8 px-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1A2953] mb-2 sm:mb-4">Available Units</h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">
              Find your perfect rental from our available properties
            </p>
          </div>

          {/* Search Bar and Mobile Filter Button */}
          <div className="mb-6 sm:mb-8 px-4">
            <div className="flex gap-2 justify-center max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search properties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full text-sm sm:text-base"
                />
              </div>
              <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden flex-shrink-0 h-10 w-10">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <SidebarFilters 
                      onFiltersChange={(filters) => {
                        handleFiltersChange(filters);
                        setIsMobileFiltersOpen(false);
                      }} 
                      currentFilters={currentFilters} 
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-4 lg:gap-8">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0 px-4">
              <SidebarFilters onFiltersChange={handleFiltersChange} currentFilters={currentFilters} />
            </aside>

            <div className="flex-1 px-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 sm:py-16">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-[#1A2953] mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base">Loading available units...</p>
                  </div>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No units found</h3>
                  <p className="text-gray-600 text-sm sm:text-base">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4 sm:mb-6">
                    <p className="text-gray-600 text-sm sm:text-base">
                      {filteredListings.length} available unit{filteredListings.length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                    {filteredListings.map((listing) => (
                      <PropertyCardAdapter key={listing.id} property={listing} />
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {hasMore && !searchTerm && (
                    <div className="mt-8 text-center">
                      <Button
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="lg"
                        className="min-w-[200px]"
                      >
                        {isLoadingMore ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          `Load More (${total - filteredListings.length} remaining)`
                        )}
                      </Button>
                    </div>
                  )}
                  
                  {/* Loading indicator for infinite scroll */}
                  {isLoadingMore && (
                    <div className="mt-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
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

export default AvailableUnits;
