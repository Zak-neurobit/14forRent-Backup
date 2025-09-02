
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { propertyService } from "@/services/propertyService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCardAdapter from "@/components/PropertyCardAdapter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, AlertCircle, Edit, Trash2, MoreVertical, DollarSign, Archive } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useSoldPropertyNotification } from "@/hooks/useSoldPropertyNotification";
import { useLoadingBarOnFetch } from "@/hooks/useLoadingBarOnFetch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MyListings = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Show loading bar when fetching listings
  useLoadingBarOnFetch(loading);
  const [soldDialog, setSoldDialog] = useState({ open: false, listingId: '', title: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, listingId: '', title: '', step: 1 });
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use the notification hook
  useSoldPropertyNotification();

  useEffect(() => {
    const fetchUserListings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'sold') // Exclude sold properties
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        const formattedListings = data.map(listing => ({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          address: listing.location,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          location: listing.location,
          images: listing.images,
          featured: listing.featured || false,
          description: listing.description,
          status: listing.status || 'available'
        }));
        
        setListings(formattedListings);
      } catch (error: any) {
        console.error('Error fetching listings:', error.message);
        toast.error("Failed to load your listings");
      } finally {
        setLoading(false);
      }
    };

    fetchUserListings();
  }, [user]);

  const handleEdit = (listingId: string) => {
    navigate(`/list/${listingId}`);
  };

  const handleMarkAsSold = async (listingId: string, title: string) => {
    setSoldDialog({ open: true, listingId, title });
  };

  const handleSoldConfirm = async () => {
    try {
      console.log("Owner marking listing as sold:", soldDialog.listingId);
      
      const { error } = await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', soldDialog.listingId);

      if (error) {
        console.error("Error marking listing as sold:", error);
        throw error;
      }

      toast.success("Listing marked as sold successfully");
      setListings(prevListings => 
        prevListings.filter(listing => listing.id !== soldDialog.listingId)
      );
    } catch (error: any) {
      console.error('Error marking listing as sold:', error);
      toast.error("Failed to mark listing as sold: " + (error.message || "Unknown error"));
    } finally {
      setSoldDialog({ open: false, listingId: '', title: '' });
    }
  };

  const handleDeleteClick = (listingId: string, title: string) => {
    setDeleteDialog({ open: true, listingId, title, step: 1 });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.step === 1) {
      // Move to second confirmation step
      setDeleteDialog({ ...deleteDialog, step: 2 });
      return;
    }

    try {
      console.log("Permanently deleting listing:", deleteDialog.listingId);
      
      // Use the property service to delete listing and images
      const result = await propertyService.deleteListing(deleteDialog.listingId);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete listing");
      }

      toast.success("Listing permanently deleted");
      setListings(prevListings => 
        prevListings.filter(listing => listing.id !== deleteDialog.listingId)
      );
    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast.error("Failed to delete listing: " + (error.message || "Unknown error"));
    } finally {
      setDeleteDialog({ open: false, listingId: '', title: '', step: 1 });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-forrent-gray py-8">
        <div className="forrent-container">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-forrent-navy">My Listings</h1>
            <Button asChild className="bg-forrent-orange hover:bg-forrent-lightOrange text-white">
              <Link to="/list">
                <Plus className="mr-2 h-4 w-4" /> Add New Listing
              </Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-forrent-navy/20 mb-4"></div>
                <div className="h-4 w-36 bg-forrent-navy/20 rounded"></div>
              </div>
            </div>
          ) : listings.length > 0 ? (
            <div>
              <p className="text-gray-600 mb-4">You have {listings.length} active listings</p>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                {listings.map(property => (
                  <div key={property.id} className="relative">
                    <PropertyCardAdapter 
                      property={property} 
                      manageable={false}
                    />
                    {/* Custom action buttons */}
                    <div className="mt-4 flex justify-between items-center">
                      <Button 
                        asChild 
                        variant="outline" 
                        className="text-forrent-navy border-forrent-navy hover:bg-forrent-navy hover:text-white"
                      >
                        <Link to={`/property/${property.id}`}>
                          View Details
                        </Link>
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                          onClick={() => handleEdit(property.id)}
                          title="Edit listing"
                        >
                          <Edit size={16} />
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="text-gray-500 border-gray-500 hover:bg-gray-500 hover:text-white"
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleMarkAsSold(property.id, property.title)}
                              className="text-green-600"
                            >
                              <DollarSign className="mr-2 h-4 w-4" />
                              Mark as Sold
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(property.id, property.title)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <AlertCircle className="mx-auto h-12 w-12 text-forrent-orange mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">No active listings found</h3>
              <p className="text-gray-500 mb-6">You haven't created any property listings yet, or all your listings have been sold.</p>
              <Button asChild className="bg-forrent-orange hover:bg-forrent-lightOrange text-white">
                <Link to="/list">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Listing
                </Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />

      {/* Mark as Sold Confirmation Dialog */}
      <AlertDialog open={soldDialog.open} onOpenChange={(open) => setSoldDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Listing as Sold</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark "{soldDialog.title}" as sold? This will hide it from active listings but keep it visible in favorites as sold.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSoldConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark as Sold
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteDialog.step === 1 ? "Delete Listing Permanently" : "⚠️ Final Confirmation"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {deleteDialog.step === 1 ? (
                <>
                  <p>Are you sure you want to permanently delete "{deleteDialog.title}"?</p>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                    <p className="font-semibold text-red-800 mb-2">This action will:</p>
                    <ul className="list-disc list-inside text-red-700 space-y-1 text-sm">
                      <li>Permanently delete the listing from the database</li>
                      <li>Remove all associated images from storage</li>
                      <li>Delete all favorites, views, and notifications</li>
                      <li>Cancel any scheduled showings</li>
                    </ul>
                  </div>
                  <p className="font-semibold text-gray-900 mt-3">This action cannot be undone!</p>
                </>
              ) : (
                <>
                  <p className="text-red-600 font-bold">
                    ⚠️ FINAL WARNING: This is your last chance to cancel!
                  </p>
                  <p>
                    You are about to permanently delete "{deleteDialog.title}" and all associated data.
                  </p>
                  <p className="font-semibold">
                    Type "DELETE" below to confirm:
                  </p>
                  <input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    onChange={(e) => {
                      const confirmButton = document.getElementById('confirm-delete-btn');
                      if (confirmButton) {
                        (confirmButton as HTMLButtonElement).disabled = e.target.value !== 'DELETE';
                      }
                    }}
                  />
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialog({ open: false, listingId: '', title: '', step: 1 })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              id="confirm-delete-btn"
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDialog.step === 2}
            >
              {deleteDialog.step === 1 ? "Continue to Delete" : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyListings;
