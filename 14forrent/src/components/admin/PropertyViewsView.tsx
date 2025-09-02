
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, Calendar, User, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PropertyView {
  id: string;
  listing_id: string;
  viewer_id: string | null;
  viewed_at: string;
  listing_title?: string;
  listing_location?: string;
  viewer_email?: string;
  viewer_name?: string;
}

interface PropertyViewsViewProps {
  onBack: () => void;
  totalViews: number;
}

export const PropertyViewsView: React.FC<PropertyViewsViewProps> = ({ onBack, totalViews }) => {
  const [views, setViews] = useState<PropertyView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPropertyViews = async () => {
      try {
        setLoading(true);
        
        // Fetch views with listing and user details
        const { data: viewsData, error } = await supabase
          .from('listing_views')
          .select(`
            id,
            listing_id,
            viewer_id,
            viewed_at,
            listings!inner(title, location)
          `)
          .order('viewed_at', { ascending: false });

        if (error) throw error;

        // Get user details for viewers
        const viewerIds = viewsData
          ?.filter(view => view.viewer_id)
          .map(view => view.viewer_id)
          .filter((id, index, self) => self.indexOf(id) === index) || [];

        let profiles = [];
        if (viewerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', viewerIds);

          if (!profilesError) {
            profiles = profilesData || [];
          }
        }

        // Get auth users for email addresses
        let authUsers = [];
        try {
          const { data: authUsersData, error: authError } = await supabase.rpc('admin_get_users');
          if (!authError) {
            authUsers = authUsersData || [];
          }
        } catch (err) {
          console.error("Error fetching auth users:", err);
        }

        // Combine data
        const formattedViews = viewsData?.map(view => ({
          id: view.id,
          listing_id: view.listing_id,
          viewer_id: view.viewer_id,
          viewed_at: view.viewed_at,
          listing_title: view.listings?.title || 'Unknown Property',
          listing_location: view.listings?.location || 'Unknown Location',
          viewer_email: view.viewer_id ? 
            authUsers.find(user => user.id === view.viewer_id)?.email || 'Unknown' : 
            'Guest',
          viewer_name: view.viewer_id ? 
            profiles.find(profile => profile.id === view.viewer_id)?.display_name || 'Unknown User' : 
            'Guest User'
        })) || [];

        setViews(formattedViews);
      } catch (error) {
        console.error("Error fetching property views:", error);
        toast.error("Failed to load property views");
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyViews();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          <h2 className="text-2xl font-bold">Property Views</h2>
        </div>
        <div className="text-center py-8">Loading property views...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold">Property Views ({totalViews} total views)</h2>
      </div>

      <div className="grid gap-4">
        {views.map((view) => (
          <Card key={view.id}>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Home size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">{view.listing_title}</p>
                    <p className="text-sm text-gray-500">{view.listing_location}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">{view.viewer_name}</p>
                    <p className="text-sm text-gray-600">{view.viewer_email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Viewed At</p>
                    <p className="text-sm text-gray-600">{formatDate(view.viewed_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Viewer Type</p>
                    <p className="text-sm text-gray-600">{view.viewer_id ? 'Registered User' : 'Guest'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {views.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Eye className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No property views found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
