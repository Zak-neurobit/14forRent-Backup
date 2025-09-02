
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import AIChat from "@/components/chat/AIChat";
import ScrollToTop from "@/components/ScrollToTop";
import { initializeAnalytics } from "@/services/analyticsService";
import { Loader2 } from "lucide-react";

// Critical pages - load immediately for best performance
import Index from "./pages/Index";
import Search from "./pages/Search";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Favorites from "./pages/Favorites";

// Lazy load less critical and heavy pages
const Contact = lazy(() => import("./pages/Contact"));
const ListProperty = lazy(() => import("./pages/ListProperty"));
const EditListing = lazy(() => import("./pages/EditListing"));
const MyListings = lazy(() => import("./pages/MyListings"));
const AvailableUnits = lazy(() => import("./pages/AvailableUnits"));
const AvailableUnitsRedirect = lazy(() => import("./pages/AvailableUnitsRedirect"));
const Admin = lazy(() => import("./pages/Admin"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const FairHousing = lazy(() => import("./pages/FairHousing"));
const GetPreapproved = lazy(() => import("./pages/GetPreapproved"));
const WelcomeBack = lazy(() => import("./pages/WelcomeBack"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

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

const queryClient = new QueryClient();

function App() {
  // Initialize analytics tracking
  React.useEffect(() => {
    initializeAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Critical routes - loaded immediately */}
                <Route path="/" element={<Index />} />
                <Route path="/search" element={<Search />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/favorites" element={<Favorites />} />
                
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <AIChat />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
