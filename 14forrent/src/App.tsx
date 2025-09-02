
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoadingBarProvider } from "@/contexts/LoadingBarContext";
import LoadingBar from "@/components/LoadingBar";
import RouteChangeListener from "@/components/RouteChangeListener";
import AIChat from "@/components/chat/AIChat";
import ScrollToTop from "@/components/ScrollToTop";
import { initializeAnalytics } from "@/services/analyticsService";
import { Loader2 } from "lucide-react";
import AppWithLoadingBar from "@/components/AppWithLoadingBar";

// Critical pages - load immediately for best performance
import Index from "./pages/Index";
import Search from "./pages/Search";
import Favorites from "./pages/Favorites";

// Lazy load PropertyDetail with the optimized version
const PropertyDetail = lazy(() => import("./pages/PropertyDetailFast"));

// Preload critical components that are used in many pages
import("./pages/Login");
import("./pages/Signup");

// Lazy load with prefetch for better performance
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Contact = lazy(() => import(/* webpackPrefetch: true */ "./pages/Contact"));
const ListProperty = lazy(() => import("./pages/ListProperty"));
const EditListing = lazy(() => import("./pages/EditListing"));
const MyListings = lazy(() => import("./pages/MyListings"));
const AvailableUnits = lazy(() => import(/* webpackPrefetch: true */ "./pages/AvailableUnits"));
const AvailableUnitsRedirect = lazy(() => import("./pages/AvailableUnitsRedirect"));
const Admin = lazy(() => import(/* webpackPrefetch: true */ "./pages/Admin"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const Blog = lazy(() => import(/* webpackPrefetch: true */ "./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const TermsAndConditions = lazy(() => import(/* webpackPrefetch: true */ "./pages/TermsAndConditions"));
const FairHousing = lazy(() => import(/* webpackPrefetch: true */ "./pages/FairHousing"));
const GetPreapproved = lazy(() => import(/* webpackPrefetch: true */ "./pages/GetPreapproved"));
const WelcomeBack = lazy(() => import("./pages/WelcomeBack"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Neighborhood pages
const BeverlyHills = lazy(() => import("./pages/neighborhoods/BeverlyHills"));
const SantaMonica = lazy(() => import("./pages/neighborhoods/SantaMonica"));
const DowntownLA = lazy(() => import(/* webpackPrefetch: true */ "./pages/neighborhoods/DowntownLA"));

import "./App.css";

// Simple loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-forrent-navy mx-auto mb-2" />
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 mins
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 mins
      retry: 1, // Only retry once on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: 'always', // Always refetch on reconnect
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

function App() {
  // Initialize analytics tracking with cleanup
  // TEMPORARILY DISABLED - causing performance issues when logged in
  // React.useEffect(() => {
  //   const cleanup = initializeAnalytics();
  //   return cleanup; // Clean up on unmount
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <LoadingBarProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter>
                <AppWithLoadingBar>
                  <ScrollToTop />
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                {/* Critical routes - loaded immediately */}
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/property/:id" element={
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center">
                      <Loader2 className="h-12 w-12 animate-spin text-[#1A2953]" />
                    </div>
                  }>
                    <PropertyDetail />
                  </Suspense>
                } />
                <Route path="/favorites" element={<Favorites />} />
                
                {/* Auth pages - preloaded but lazy */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                
                {/* Lazy loaded routes */}
                <Route path="/contact" element={<Contact />} />
                <Route path="/list" element={<ListProperty />} />
                <Route path="/list/:id" element={<EditListing />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/available-units" element={<AvailableUnits />} />
                <Route path="/available" element={<AvailableUnitsRedirect />} />
                <Route path="/get-preapproved" element={<GetPreapproved />} />
                <Route path="/welcome-back" element={<WelcomeBack />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/owner-dashboard" element={<OwnerDashboard />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/fair-housing" element={<FairHousing />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Neighborhood pages */}
                <Route path="/neighborhoods/beverly-hills" element={<BeverlyHills />} />
                <Route path="/neighborhoods/santa-monica" element={<SantaMonica />} />
                <Route path="/neighborhoods/downtown-la" element={<DowntownLA />} />
                
                <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <AIChat />
                </AppWithLoadingBar>
              </BrowserRouter>
            </TooltipProvider>
          </LoadingBarProvider>
        </AuthProvider>
    </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
