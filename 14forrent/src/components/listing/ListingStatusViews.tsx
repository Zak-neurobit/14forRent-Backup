
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const LoadingView = () => (
  <>
    <Navbar />
    <div className="forrent-container py-16 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto" />
      <h1 className="text-3xl font-bold text-forrent-navy mt-4">Loading...</h1>
    </div>
    <Footer />
  </>
);

export const NotFoundView = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Navbar />
      <div className="forrent-container py-16 text-center">
        <h1 className="text-3xl font-bold text-forrent-navy mb-4">Listing Not Found</h1>
        <p className="text-gray-600 mb-6">The listing you're trying to edit could not be found.</p>
        <Button 
          onClick={() => navigate("/my-listings")}
          className="bg-forrent-orange hover:bg-forrent-lightOrange text-white"
        >
          View My Listings
        </Button>
      </div>
      <Footer />
    </>
  );
};

export const UnauthorizedView = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Navbar />
      <div className="forrent-container py-16 text-center">
        <h1 className="text-3xl font-bold text-forrent-navy mb-4">Unauthorized</h1>
        <p className="text-gray-600 mb-6">You don't have permission to edit this listing.</p>
        <Button 
          onClick={() => navigate("/my-listings")}
          className="bg-forrent-orange hover:bg-forrent-lightOrange text-white"
        >
          View My Listings
        </Button>
      </div>
      <Footer />
    </>
  );
};
