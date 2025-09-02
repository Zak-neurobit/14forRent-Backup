
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import AISearch from "@/components/AISearch";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import FireGradientText from "@/components/FireGradientText";
import SEOMeta from "@/components/SEOMeta";
import { Button } from "@/components/ui/button";
import { Building, Calendar, FileText, Tags } from "lucide-react";
import { Link } from "react-router-dom";
import PropertyCardAdapter from '@/components/PropertyCardAdapter';
import { useProperties } from "@/hooks/useProperties";
import { propertyService } from "@/services/propertyService";

const Index = () => {
  // Use the optimized hook for fetching hot deals
  const { properties: hotDealsListings, loading: isLoading } = useProperties({
    type: 'hotDeals',
    limit: 8
  });

  // Preload critical data on component mount
  useEffect(() => {
    propertyService.preloadCriticalData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOMeta 
        title="14ForRent - Home"
        description="Find apartments, houses & condos for rent in Los Angeles. Browse verified LA rentals in Beverly Hills, Santa Monica, Downtown LA & more. Pet-friendly options, virtual tours, instant pre-approval."
        keywords="los angeles apartments for rent, LA rentals, houses for rent los angeles, downtown la apartments, beverly hills rentals, santa monica apartments, west LA rentals, pet friendly apartments los angeles, luxury condos LA, studio apartments los angeles, 1 bedroom apartments LA, 2 bedroom houses for rent los angeles"
        url="https://14forrent.com/"
        type="website"
        canonical="https://14forrent.com/"
      />
      <Navbar />

      {/* Hero Section - With static image background */}
      <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/lovable-uploads/b42f7b08-e669-4d1e-97fc-782cc54692e9.png" alt="Modern urban apartment buildings and rental properties showcasing premium living spaces" className="w-full h-full object-cover" />
        </div>

        <div className="forrent-container relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-apple text-3xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-bold mb-4 text-zinc-50" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.7)' }}>
              Reinventing Renting
            </h1>
            <p className="text-2xl sm:text-2xl md:text-xl lg:text-2xl xl:text-3xl mb-6 md:mb-8 max-w-2xl mx-auto text-center font-bold text-forrent-gray" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.9)' }}>
              Faster than Zillow, Smarter than Craigslist
            </p>
            <div className="max-w-xl mx-auto">
              <AISearch />
            </div>
          </div>
        </div>
      </section>

      {/* HOT DEALS Section - Shows 8 newest listings */}
      {hotDealsListings.length > 0 && (
        <section id="hot-deals" className="py-12 md:py-16 bg-gray-50">
          <div className="forrent-container px-0 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center mb-6 md:mb-8 px-0 sm:px-4">
              <FireGradientText />
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-80 bg-gray-200 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : hotDealsListings.length > 0 ? (
              <>
                <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 mt-6 md:mt-8 px-4 sm:px-0">
                  {hotDealsListings.map(property => (
                    <div key={property.id} className="flex-shrink-0 w-72 snap-start md:w-auto md:flex-shrink">
                      <PropertyCardAdapter property={property} />
                    </div>
                  ))}
                </div>
                
                {/* View All Button */}
                <div className="text-center mt-8 md:mt-12">
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-forrent-orange hover:bg-forrent-lightOrange text-white font-semibold px-8 py-3 text-lg"
                  >
                    <Link to="/available-units">
                      View All Hot Deals
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No hot deals available right now.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* AI Features Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="forrent-container px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1A2953] mb-4">Enhanced Rental Experience</h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              Our advanced technology is revolutionizing how you find, rent, and manage properties
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <FeatureSection title="Advanced Search" description="Find exactly what you're looking for with precision" icon={<Building size={32} className="text-[#1A2953]" />}>
              <p className="text-gray-600">
                Find matching listings based on your specific requirements and preferences.
              </p>
            </FeatureSection>

            <FeatureSection title="24/7 Customer Support" description="Get instant help with all your rental questions" icon={<Calendar size={32} className="text-[#1A2953]" />}>
              <p className="text-gray-600">
                Get instant answers to property questions, schedule tours, and connect with agents.
              </p>
            </FeatureSection>

            <FeatureSection title="Professional Listing Creation" description="Create engaging property descriptions effortlessly" icon={<FileText size={32} className="text-[#1A2953]" />}>
              <p className="text-gray-600">
                Create optimized listing descriptions that highlight key features and attract quality tenants.
              </p>
            </FeatureSection>

            <FeatureSection title="Automated Screening" description="Faster tenant screening with advanced AI" icon={<Tags size={32} className="text-[#1A2953]" />}>
              <p className="text-gray-600">
                AI automates tenant screening, risk scoring, and fraud checks in minutes instead of days.
              </p>
            </FeatureSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-[#1A2953] to-[#2A3F70] text-white">
        <div className="forrent-container text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to experience the future of renting?</h2>
          <p className="text-lg md:text-xl mb-6 md:mb-8 max-w-2xl mx-auto">
            Join thousands of tenants and property owners who are already saving time and money with our AI-powered platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-[#1A2953] text-lg px-8">
              <Link to="/available-units">Find Your Next Home</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white hover:bg-white text-lg px-8 text-gray-900">
              <Link to="/list">List Your Property</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
