
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Loader2, Calendar, Edit, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Showing } from "@/types/showing";
import { ShowingDialog } from "./ShowingDialog";
import { createNotification } from "@/services/notificationService";

// Helper function to send tour update email notifications
const sendTourUpdateEmail = async (updatedShowing: Showing, originalShowing: Showing, message: string) => {
  try {
    // Get user's email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', updatedShowing.user_id)
      .single();

    if (userError || !user?.email) {
      console.error('Error fetching user email:', userError);
      return;
    }

    // Format time for display
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    // Send email notification
    await supabase.functions.invoke('send-email', {
      body: {
        to: user.email,
        subject: `Tour Update - ${updatedShowing.listingTitle}`,
        template: 'user_tour_update',
        type: 'user_tour_update',
        data: {
          guest_name: updatedShowing.guest_name,
          property_title: updatedShowing.listingTitle,
          property_location: updatedShowing.listingAddress,
          status: updatedShowing.status,
          scheduled_date: updatedShowing.scheduled_date,
          scheduled_time: formatTime(updatedShowing.scheduled_time),
          admin_message: message,
          original_date: originalShowing.scheduled_date,
          original_time: formatTime(originalShowing.scheduled_time)
        }
      }
    });

    console.log('Tour update email sent to user');
  } catch (error) {
    console.error('Error sending tour update email:', error);
    // Don't throw error to prevent breaking the main flow
  }
};

// Cache configuration
const CACHE_KEY = 'admin_showings_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const ShowingsManagement = () => {
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedShowing, setSelectedShowing] = useState<Showing | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    // Try to load from cache first
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setShowings(data);
          setLoading(false);
          // Still fetch fresh data in background
          fetchShowings(true);
          return;
        }
      } catch (err) {
        console.error('Error reading cache:', err);
      }
    }
    fetchShowings();
  }, []);

  const fetchShowings = async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) setLoading(true);
    try {
      // Fetch all fields (notes doesn't exist, use description instead)
      const { data, error, count } = await supabase
        .from('scheduled_showings')
        .select('*', { count: 'exact' })
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
      
      if (error) {
        console.error("Error fetching showings:", error);
        toast.error("Error loading scheduled showings");
      } else {
        console.log("Fetched showings data:", data);
        
        // Fetch listing details separately for better performance
        const listingIds = [...new Set(data.map(s => s.listing_id).filter(Boolean))];
        let listingsMap = new Map();
        
        if (listingIds.length > 0) {
          const { data: listings } = await supabase
            .from('listings')
            .select('id, title, location')
            .in('id', listingIds);
          
          if (listings) {
            listings.forEach(l => listingsMap.set(l.id, l));
          }
        }
        
        const formattedShowings = data.map(showing => {
          const listing = listingsMap.get(showing.listing_id);
          return {
            ...showing,
            listingTitle: listing?.title || "Unknown property",
            listingAddress: listing?.location || "Unknown location"
          };
        }) as Showing[];
        
        if (page === 0) {
          setShowings(formattedShowings);
          // Cache the first page
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: formattedShowings,
            timestamp: Date.now()
          }));
        } else {
          setShowings(prev => [...prev, ...formattedShowings]);
        }
        
        setHasMore((count || 0) > (page + 1) * ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      if (!isBackgroundRefresh) setLoading(false);
    }
  };
  
  const loadMore = () => {
    setPage(prev => prev + 1);
    fetchShowings();
  };

  const handleEdit = (showing: Showing) => {
    console.log("Opening edit dialog for showing:", showing);
    setSelectedShowing(showing);
    setDialogOpen(true);
  };

  const handleView = (showing: Showing) => {
    console.log("Viewing showing details:", showing);
    // You could open a read-only view dialog here if needed
  };

  const handleShowingUpdated = async (updatedShowing: Showing, wasRescheduled: boolean) => {
    try {
      // Send appropriate notification based on the status change
      if (selectedShowing?.user_id && updatedShowing.status !== selectedShowing.status) {
        let message = '';
        switch (updatedShowing.status) {
          case 'confirmed':
            message = `Your showing for "${selectedShowing.listingTitle}" has been confirmed.`;
            break;
          case 'cancelled':
            message = `Your showing for "${selectedShowing.listingTitle}" has been cancelled.`;
            break;
          case 'rescheduled':
            message = `Your showing for "${selectedShowing.listingTitle}" has been rescheduled to ${updatedShowing.scheduled_date} at ${formatTime(updatedShowing.scheduled_time)}.`;
            break;
          case 'completed':
            message = `Your showing for "${selectedShowing.listingTitle}" has been marked as completed.`;
            break;
          default:
            message = `Your showing for "${selectedShowing.listingTitle}" status has been updated.`;
        }

        await createNotification({
          user_id: selectedShowing.user_id,
          type: 'admin',
          message,
          listing_id: selectedShowing.listing_id
        });

        // Send email notification to user
        await sendTourUpdateEmail(updatedShowing, selectedShowing, message);
      }

      await fetchShowings();
      toast.success("Showing updated successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update showing");
    }
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return 'Unknown time';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period} PST`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    return new Date(dateString + 'T00:00:00-08:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'rescheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Rescheduled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Showings Management ({showings.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : showings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scheduled showings found.
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Guest Details</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {showings.map((showing) => (
                    <TableRow key={showing.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{showing.listingTitle}</p>
                          <p className="text-xs text-gray-500">{showing.listingAddress}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {showing.guest_name || showing.userName || 'Unknown Guest'}
                          </p>
                          {showing.guest_email && (
                            <p className="text-xs text-gray-600">📧 {showing.guest_email}</p>
                          )}
                          {showing.guest_phone && (
                            <p className="text-xs text-gray-600">📱 {showing.guest_phone}</p>
                          )}
                          <div className="flex items-center gap-1">
                            {showing.user_id ? (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                Registered User
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                Guest User
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{formatDate(showing.scheduled_date)}</p>
                          <p className="text-xs text-gray-500">{formatTime(showing.scheduled_time)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(showing.status)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {showing.description ? (
                            <p className="text-xs text-gray-600 truncate" title={showing.description}>
                              {showing.description}
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No notes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(showing)}
                            className="flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(showing)}
                            className="flex items-center gap-1 text-xs px-2 py-1"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedShowing && (
        <ShowingDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          showing={selectedShowing}
          onShowingUpdated={handleShowingUpdated}
        />
      )}
    </>
  );
};
