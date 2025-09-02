
import { useState, useEffect, useCallback, useMemo } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Listing {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  user_id: string;
  featured: boolean;
  images: string[];
  status: string;
}

interface DeleteListingResponse {
  success: boolean;
  error?: string;
  deleted_images_count?: number;
  failed_images_count?: number;
  message?: string;
}

// Cache configuration
const LISTINGS_CACHE_KEY = 'admin_listings_cache';
const LISTINGS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const ListingManagement = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, listingId: '', title: '' });
  const [processing, setProcessing] = useState(false);
  const [expandedListing, setExpandedListing] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const ITEMS_PER_PAGE = 20;

  // Get cached listings
  const getCachedListings = useCallback(() => {
    try {
      const cached = localStorage.getItem(LISTINGS_CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < LISTINGS_CACHE_TTL) {
          console.log('ListingManagement: Using cached listings');
          return data;
        }
      }
    } catch (err) {
      console.error('Error reading listings cache:', err);
    }
    return null;
  }, []);
  
  // Save listings to cache
  const setCachedListings = useCallback((data: Listing[]) => {
    try {
      localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('Error saving listings to cache:', err);
    }
  }, []);

  useEffect(() => {
    // Try to load from cache first
    const cachedListings = getCachedListings();
    if (cachedListings) {
      setListings(cachedListings);
      setLoading(false);
      // Fetch fresh data in background
      fetchListings(true);
    } else {
      fetchListings(false);
    }
  }, [getCachedListings]);

  const fetchListings = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    
    try {
      // Fetch only essential fields for ultra-fast performance
      const { data, error } = await supabase
        .from('listings')
        .select('id, title, location, price, bedrooms, bathrooms, created_at, featured, status')
        .order('created_at', { ascending: false })
        .limit(50); // Reduced limit for faster initial load
      
      if (error) {
        console.error("Error fetching listings:", error);
        if (!isBackgroundRefresh) {
          toast.error("Error loading listings");
        }
      } else {
        setListings(data || []);
        setCachedListings(data || []); // Save to cache
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      if (!isBackgroundRefresh) {
        toast.error("An unexpected error occurred");
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  };
  
  // Filter listings based on search term
  const filteredListings = useMemo(() => {
    if (!searchTerm) return listings;
    
    const term = searchTerm.toLowerCase();
    return listings.filter(listing => 
      listing.title.toLowerCase().includes(term) ||
      listing.location.toLowerCase().includes(term) ||
      listing.id.toLowerCase().includes(term)
    );
  }, [listings, searchTerm]);
  
  // Paginate filtered listings
  const paginatedListings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredListings.slice(startIndex, endIndex);
  }, [filteredListings, currentPage]);
  
  const totalPages = Math.ceil(filteredListings.length / ITEMS_PER_PAGE);

  const handleDeleteClick = (listingId: string, title: string) => {
    setDeleteDialog({ open: true, listingId, title });
    setConfirmationText('');
  };

  const confirmDeleteListing = async () => {
    if (!deleteDialog.listingId || confirmationText !== 'DELETE') {
      toast.error("Please type DELETE to confirm");
      return;
    }
    
    setProcessing(true);
    try {
      console.log("Deleting listing completely:", deleteDialog.listingId);
      
      // Use the new database function that handles cascading deletes
      const { data, error } = await supabase.rpc('delete_listing_completely', {
        listing_id_param: deleteDialog.listingId
      });
      
      if (error) {
        console.error("Error calling delete function:", error);
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.error || "Failed to delete listing");
      }

      // Delete images from storage if they exist
      let deletedImagesCount = 0;
      if (data.listing_images && Array.isArray(data.listing_images)) {
        for (const imagePath of data.listing_images) {
          try {
            const { error: deleteError } = await supabase.storage
              .from('property_images')
              .remove([imagePath]);
            
            if (!deleteError) {
              deletedImagesCount++;
            } else {
              console.warn(`Failed to delete image ${imagePath}:`, deleteError);
            }
          } catch (imageError) {
            console.warn(`Error deleting image ${imagePath}:`, imageError);
          }
        }
      }

      toast.success(`Listing deleted successfully! ${deletedImagesCount} images removed.`);
      
      // Remove from local state
      setListings(prevListings => 
        prevListings.filter(listing => listing.id !== deleteDialog.listingId)
      );

    } catch (error: any) {
      console.error('Error deleting listing:', error);
      toast.error("Failed to delete listing: " + (error.message || "Unknown error"));
    } finally {
      setProcessing(false);
      setDeleteDialog({ open: false, listingId: '', title: '' });
      setConfirmationText('');
    }
  };

  const handleEdit = (listing: Listing) => {
    navigate(`/list/${listing.id}`);
  };

  const toggleExpand = (id: string) => {
    setExpandedListing(expandedListing === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'sold') {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          Sold
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Available
      </Badge>
    );
  };

  // Enhanced image URL processing - ensuring property_images bucket usage
  const processImageUrl = (url: string) => {
    if (!url || url === '/placeholder.svg') {
      return '/placeholder.svg';
    }
    
    // If it's a blob URL, it's problematic - return placeholder
    if (url.startsWith('blob:')) {
      console.warn('Found blob URL in database, this should be a storage URL:', url);
      return '/placeholder.svg';
    }

    // If it's already a full URL (http/https), return as is
    if (url.startsWith('http')) {
      return url;
    }

    // If it's a storage path for property_images, construct the full Supabase storage URL
    if (url.startsWith('property_images/')) {
      return `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/${url}`;
    }

    // Handle legacy listing_images paths by converting them to property_images
    if (url.startsWith('listing_images/')) {
      const newPath = url.replace('listing_images/', 'property_images/');
      return `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/${newPath}`;
    }

    // Default case - treat as relative path under property_images
    return `https://hdigtojmeagwaqdknblj.supabase.co/storage/v1/object/public/property_images/${url}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Listing Management</h2>
        <button 
          onClick={fetchListings}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Refresh
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <>
                  <TableRow key={listing.id} className="hover:bg-gray-50">
                    <TableCell className="w-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 h-6 w-6" 
                        onClick={() => toggleExpand(listing.id)}
                      >
                        {expandedListing === listing.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell>{listing.location}</TableCell>
                    <TableCell>{formatCurrency(listing.price)}</TableCell>
                    <TableCell>{listing.bedrooms} bed, {listing.bathrooms} bath</TableCell>
                    <TableCell>
                      {getStatusBadge(listing.status || 'available')}
                    </TableCell>
                    <TableCell>{formatDate(listing.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-blue-500 border-blue-300 hover:bg-blue-50"
                          onClick={() => handleEdit(listing)}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="text-red-500 border-red-300 hover:bg-red-50"
                          onClick={() => handleDeleteClick(listing.id, listing.title)}
                          title="Delete property permanently"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedListing === listing.id && (
                    <TableRow>
                      <TableCell colSpan={8} className="bg-gray-50 p-4">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-2">Images</h3>
                            <div className="flex overflow-x-auto space-x-2 pb-2">
                              {listing.images && listing.images.length > 0 ? (
                                listing.images.map((img, idx) => {
                                  const processedUrl = processImageUrl(img);
                                  console.log(`Processing image ${idx}:`, img, '-> ', processedUrl);
                                  return (
                                    <div key={idx} className="relative">
                                      <img 
                                        src={processedUrl} 
                                        alt={`${listing.title} image ${idx + 1}`} 
                                        className="h-24 w-36 object-contain bg-gray-50 rounded-md border border-gray-200"
                                        onError={(e) => {
                                          console.log(`Image failed to load: ${processedUrl}`);
                                          e.currentTarget.onerror = null;
                                          e.currentTarget.src = '/placeholder.svg';
                                        }}
                                        onLoad={() => {
                                          console.log(`Image loaded successfully: ${processedUrl}`);
                                        }}
                                      />
                                      {img.startsWith('blob:') && (
                                        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded">
                                          BLOB
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <p className="text-gray-500 italic">No images</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Property ID</h3>
                            <p className="text-gray-700">{listing.id}</p>
                          </div>
                          <div>
                            <h3 className="font-medium mb-1">Owner ID</h3>
                            <p className="text-gray-700">{listing.user_id}</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Property Permanently</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>Are you sure you want to permanently delete "{deleteDialog.title}"?</p>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-medium">⚠️ This action cannot be undone!</p>
                <p className="text-red-700 text-sm mt-1">This will permanently delete:</p>
                <ul className="text-red-700 text-sm mt-1 ml-4 list-disc">
                  <li>The property listing</li>
                  <li>All associated images</li>
                  <li>All favorites, views, and showings</li>
                  <li>All related notifications</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Type <strong>DELETE</strong> to confirm:</p>
                <Input
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="font-mono"
                />
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDeleteDialog({ open: false, listingId: '', title: '' });
                setConfirmationText('');
              }} 
              disabled={processing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteListing}
              disabled={processing || confirmationText !== 'DELETE'}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
