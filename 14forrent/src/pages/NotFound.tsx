
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Add noindex meta tag dynamically for 404 pages
    const metaRobots = document.querySelector('meta[name="robots"]');
    if (metaRobots) {
      metaRobots.setAttribute('content', 'noindex, nofollow');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'robots';
      meta.content = 'noindex, nofollow';
      document.head.appendChild(meta);
    }

    // Log error for monitoring
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Send 404 event to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_not_found', {
        page_path: location.pathname,
        page_location: window.location.href
      });
    }

    // Clean up on unmount
    return () => {
      const metaRobots = document.querySelector('meta[name="robots"]');
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    };
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found | 14ForRent</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="The page you are looking for could not be found. Browse our available rental properties or return to the homepage." />
        <meta property="og:title" content="404 - Page Not Found | 14ForRent" />
        <meta property="og:description" content="The page you are looking for could not be found." />
        <meta name="prerender-status-code" content="404" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex items-center justify-center bg-forrent-gray py-16">
          <div className="text-center px-4">
            <div className="mb-6 inline-block">
              <div className="relative">
                <div className="text-9xl font-bold text-forrent-navy">404</div>
                <div className="absolute -top-2 -right-2 w-16 h-16 bg-forrent-orange rounded-full opacity-50"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-forrent-navy mb-4">Page Not Found</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
              Sorry, the rental property you're looking for doesn't exist or has been leased.
            </p>
            <Button 
              className="bg-forrent-navy hover:bg-forrent-lightNavy text-white"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" /> Return to Home
            </Button>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
};

export default NotFound;
