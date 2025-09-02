
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Loader2, Home, Eye, Calendar, Heart, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useSoldPropertyNotification } from "@/hooks/useSoldPropertyNotification";

interface PropertyStats {
  id: string;
  title: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  viewCount: number;
  favoriteCount: number;
  showingCount: number;
  featured: boolean;
  status: string;
}

const UserPropertyStats = () => {
  const [properties, setProperties] = useState<PropertyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalViews: 0,
    totalFavorites: 0,
    totalShowings: 0
  });
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Use the notification hook
  useSoldPropertyNotification();

  useEffect(() => {
    if (user) {
      fetchUserProperties();
    }
  }, [user]);

  const fetchUserProperties = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch user's properties (including sold ones for dashboard view)
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      if (listings && listings.length > 0) {
        const listingIds = listings.map(l => l.id);

        // Fetch view counts for each property (including guest views)
        const { data: viewCounts, error: viewError } = await supabase
          .from('listing_views')
          .select('listing_id')
          .in('listing_id', listingIds);

        // Fetch favorite counts for each property
        const { data: favoriteCounts, error: favoriteError } = await supabase
          .from('favorites')
          .select('listing_id')
          .in('listing_id', listingIds);

        // Fetch showing counts for each property (including guest showings)
        const { data: showingCounts, error: showingError } = await supabase
          .from('scheduled_showings')
          .select('listing_id')
          .in('listing_id', listingIds);

        if (viewError || favoriteError || showingError) {
          console.error("Error fetching counts:", { viewError, favoriteError, showingError });
        }

        // Calculate counts for each property
        const propertiesWithStats = listings.map(listing => {
          const viewCount = viewCounts?.filter(v => v.listing_id === listing.id).length || 0;
          const favoriteCount = favoriteCounts?.filter(f => f.listing_id === listing.id).length || 0;
          const showingCount = showingCounts?.filter(s => s.listing_id === listing.id).length || 0;

          return {
            id: listing.id,
            title: listing.title,
            location: listing.location,
            price: listing.price,
            bedrooms: listing.bedrooms,
            bathrooms: listing.bathrooms,
            created_at: listing.created_at,
            viewCount,
            favoriteCount,
            showingCount,
            featured: listing.featured || false,
            status: listing.status || 'available'
          };
        });

        // Calculate total stats (only for active properties)
        const activeListings = listings.filter(l => l.status !== 'sold');
        const activeListingIds = activeListings.map(l => l.id);
        
        const totalStats = {
          totalProperties: activeListings.length,
          totalViews: viewCounts?.filter(v => activeListingIds.includes(v.listing_id)).length || 0,
          totalFavorites: favoriteCounts?.filter(f => activeListingIds.includes(f.listing_id)).length || 0,
          totalShowings: showingCounts?.filter(s => activeListingIds.includes(s.listing_id)).length || 0
        };

        setProperties(propertiesWithStats);
        setStats(totalStats);
      } else {
        setProperties([]);
        setStats({
          totalProperties: 0,
          totalViews: 0,
          totalFavorites: 0,
          totalShowings: 0
        });
      }
    } catch (error) {
      console.error("Error fetching user properties:", error);
      toast.error("Error loading your property statistics");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/Los_Angeles'
    });
  };

  const handleEditProperty = (propertyId: string) => {
    navigate(`/list/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats - only show active properties */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Properties</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalProperties}</p>
              </div>
              <Home className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalViews}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Favorites</p>
                <p className="text-3xl font-bold text-red-600">{stats.totalFavorites}</p>
              </div>
              <Heart className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Showings</p>
                <p className="text-3xl font-bold text-green-600">{stats.totalShowings}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table - show all properties with status indication */}
      <Card>
        <CardHeader>
          <CardTitle>Your Properties Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>You haven't listed any properties yet.</p>
              <p className="mt-2">
                <Button onClick={() => navigate('/list')} className="mt-4">
                  List Your First Property
                </Button>
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Favorites</TableHead>
                    <TableHead>Showings</TableHead>
                    <TableHead>Listed Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property) => (
                    <TableRow key={property.id} className={`hover:bg-gray-50 ${property.status === 'sold' ? 'opacity-60' : ''}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{property.title}</p>
                          <p className="text-sm text-gray-500">{property.location}</p>
                          <p className="text-sm text-gray-500">
                            {property.bedrooms} bed, {property.bathrooms} bath
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">${property.price.toLocaleString()}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-purple-600" />
                          <span>{property.viewCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4 text-red-600" />
                          <span>{property.favoriteCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-green-600" />
                          <span>{property.showingCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{formatDate(property.created_at)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {property.status === 'sold' ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Sold
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Active
                            </Badge>
                          )}
                          {property.featured && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Featured
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {property.status !== 'sold' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProperty(property.id)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPropertyStats;
