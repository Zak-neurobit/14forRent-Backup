
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Heart, Building, MessageSquare, Shield, LayoutDashboard, CheckCircle, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationPopover from "./NotificationPopover";
import HotDealsGradientText from "./HotDealsGradientText";
import { supabase } from "@/integrations/supabase/client";

// Cache for user listings check to avoid repeated queries
const USER_LISTINGS_CACHE = new Map<string, { hasListings: boolean; timestamp: number }>();
const USER_LISTINGS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes - significantly reduce queries

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasListings, setHasListings] = useState(false);
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Check if user has listings with caching
    const checkUserListings = async () => {
      if (user) {
        // Check cache first
        const cached = USER_LISTINGS_CACHE.get(user.id);
        if (cached && Date.now() - cached.timestamp < USER_LISTINGS_CACHE_TTL) {
          setHasListings(cached.hasListings);
          return;
        }
        
        // Use requestIdleCallback for truly non-blocking check
        const checkListings = async () => {
          try {
            const {
              count,
              error
            } = await supabase.from('listings').select('id', {
              count: 'exact'
            }).eq('user_id', user.id).limit(1);
            
            const hasUserListings = !error && count && count > 0;
            setHasListings(hasUserListings);
            
            // Cache the result
            USER_LISTINGS_CACHE.set(user.id, { 
              hasListings: hasUserListings, 
              timestamp: Date.now() 
            });
          } catch (error) {
            console.error("Error checking user listings:", error);
          }
        };
        
        if ('requestIdleCallback' in window) {
          requestIdleCallback(checkListings, { timeout: 5000 });
        } else {
          // Fallback with delay for older browsers
          setTimeout(checkListings, 1000);
        }
      }
    };
    if (user) {
      checkUserListings();
    } else {
      setHasListings(false);
    }
  }, [user]);
  
  const handleLogout = async () => {
    try {
      // Clear chat history on logout
      sessionStorage.removeItem('14ForRent-chat-history');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handlePreapprovalClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/get-preapproved');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#1A2954] text-white shadow-sm">
      <nav className="container mx-auto px-4 py-3">
        {/* Desktop Navigation - unchanged */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/632119a9-1f68-4586-addd-cef01c77dcc4.png" 
                alt="14forRent Logo" 
                className="h-16 w-auto object-contain"
                onError={(e) => {
                  console.error('Logo failed to load, trying fallback');
                  e.currentTarget.src = "/8ea6f0a3-c771-40fc-8eef-653ab9af47a2-removebg-preview (1) (1).png";
                }}
              />
            </Link>
          </div>

          {/* Desktop Navigation Items */}
          <div className="flex items-center space-x-6">
          <Link to="/available-units" className="text-white hover:text-gray-200 font-medium transition-colors">
            <HotDealsGradientText />
          </Link>
          
          <a href="/get-preapproved" onClick={handlePreapprovalClick} className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1 cursor-pointer">
            <CheckCircle size={16} />
            Get Pre-approved
          </a>
          
          <Link to="/contact" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1">
            <MessageSquare size={16} />
            Contact Us
          </Link>
          
          {user && (
            <>
              <Link to="/my-listings" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1">
                <Building size={16} />
                My Listings
              </Link>
              {hasListings && (
                <Link to="/owner-dashboard" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              )}
              <Link to="/favorites" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1">
                <Heart size={16} />
                Favorites
              </Link>
              {isAdmin && (
                <Link to="/admin" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1">
                  <Shield size={16} />
                  Admin
                </Link>
              )}
              <NotificationPopover />
              <Link to="/profile" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1">
                <User size={16} />
              </Link>
            </>
          )}
          
          {!user ? (
            <>
              <Button asChild className="bg-white text-[rgba(26,41,84,255)] hover:bg-gray-200">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-forrent-orange hover:bg-forrent-lightOrange text-white">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild className="bg-forrent-orange hover:bg-forrent-lightOrange text-white">
                <Link to="/list">List Property</Link>
              </Button>
              <Button onClick={handleLogout} variant="outline" className="border-white bg-white text-[#1A2954] hover:bg-gray-100">
                Log Out
              </Button>
            </>
          )}
        </div>
        </div>

        {/* Mobile Navigation - 3 column grid layout */}
        <div className="md:hidden grid grid-cols-3 items-center">
          {/* Left side items */}
          <div className="flex items-center gap-2">
            {!user ? (
              <Link to="/available-units" className="text-sm">
                <HotDealsGradientText />
              </Link>
            ) : (
              <>
                <Link to="/available-units" className="text-xs">
                  <HotDealsGradientText />
                </Link>
                <a href="/get-preapproved" onClick={handlePreapprovalClick} className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1 cursor-pointer text-xs">
                  <CheckCircle size={14} />
                  <span className="hidden sm:inline">Pre-approved</span>
                </a>
              </>
            )}
          </div>

          {/* Center - Logo */}
          <div className="flex justify-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/lovable-uploads/632119a9-1f68-4586-addd-cef01c77dcc4.png" 
                alt="14forRent Logo" 
                className="h-20 md:h-16 w-auto object-contain"
                onError={(e) => {
                  console.error('Logo failed to load, trying fallback');
                  e.currentTarget.src = "/8ea6f0a3-c771-40fc-8eef-653ab9af47a2-removebg-preview (1) (1).png";
                }}
              />
            </Link>
          </div>

          {/* Right side items */}
          <div className="flex items-center justify-end gap-2">
            {!user ? (
              <>
                <Link to="/contact" className="text-sm font-medium text-white hover:text-gray-200">
                  Contact
                </Link>
                <Button asChild size="sm" className="bg-white text-[#1A2954] hover:bg-gray-100 text-xs px-2 py-1">
                  <Link to="/login">Log In</Link>
                </Button>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Link to="/admin" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1 text-xs">
                    <Shield size={14} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link to="/favorites" className="text-white hover:text-gray-200 font-medium transition-colors flex items-center gap-1 text-xs">
                  <Heart size={14} />
                  <span className="hidden sm:inline">Favorites</span>
                </Link>
                <NotificationPopover />
              </>
            )}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2" aria-label="Toggle menu">
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1A2954] shadow-lg border-t border-white/10">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            {!user && (
              <>
                <Link to="/available-units" className="text-white hover:text-gray-200 font-medium py-2 transition-colors" onClick={() => setIsMenuOpen(false)}>
                  <HotDealsGradientText />
                </Link>
                
                <a href="/get-preapproved" onClick={(e) => {
                  handlePreapprovalClick(e);
                  setIsMenuOpen(false);
                }} className="text-white hover:text-gray-200 font-medium py-2 transition-colors flex items-center gap-1 cursor-pointer">
                  <CheckCircle size={16} />
                  Get Pre-approved
                </a>
              </>
            )}
            
            <Link to="/contact" className="text-white hover:text-gray-200 font-medium py-2 transition-colors flex items-center gap-1" onClick={() => setIsMenuOpen(false)}>
              <MessageSquare size={16} />
              Contact Us
            </Link>
            
            {user && (
              <>
                {/* Additional menu items for logged-in users - Profile and Admin access */}
                <Link to="/profile" className="text-white hover:text-gray-200 font-medium py-2 transition-colors flex items-center gap-1" onClick={() => setIsMenuOpen(false)}>
                  <User size={16} />
                  Profile
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-white hover:text-gray-200 font-medium py-2 transition-colors flex items-center gap-1" onClick={() => setIsMenuOpen(false)}>
                    <Shield size={16} />
                    Admin
                  </Link>
                )}
              </>
            )}
            
            <div className="flex flex-col space-y-2 pt-4 border-t border-white/10">
              {!user ? (
                <>
                  <Button asChild className="bg-white text-[#1A2954] hover:bg-gray-100 w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/login">Log In</Link>
                  </Button>
                  <Button asChild className="bg-forrent-orange hover:bg-forrent-lightOrange text-white w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="bg-forrent-orange hover:bg-forrent-lightOrange text-white w-full" onClick={() => setIsMenuOpen(false)}>
                    <Link to="/list">List Property</Link>
                  </Button>
                  <Button onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }} variant="outline" className="border-white bg-white text-[#1A2954] hover:bg-gray-100 w-full">
                    Log Out
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
