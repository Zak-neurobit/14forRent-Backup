
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Showing } from "@/types/showing";

const UserShowings = () => {
  const [showings, setShowings] = useState<Showing[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchShowings();
    }
  }, [user]);

  const fetchShowings = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('scheduled_showings')
        .select(`
          *,
          listings:listing_id (title, location)
        `)
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false });
      
      if (error) {
        console.error("Error fetching showings:", error);
        toast.error("Error loading your scheduled showings");
      } else {
        const formattedShowings = data.map(showing => ({
          ...showing,
          listingTitle: showing.listings?.title || "Unknown property",
          listingAddress: showing.listings?.location || "Unknown location"
        })) as Showing[];
        
        setShowings(formattedShowings);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    try {
      const date = new Date(dateString);
      return `${format(date, "PPP")} at ${timeString}`;
    } catch (error) {
      return `${dateString} at ${timeString}`;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Your Scheduled Showings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : showings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>You haven't scheduled any property showings yet.</p>
            <p className="mt-2">Browse properties and schedule a tour to see them listed here.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showings.map((showing) => (
                  <TableRow key={showing.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <a href={`/property/${showing.listing_id}`} className="hover:underline text-blue-600">
                        {showing.listingTitle}
                      </a>
                    </TableCell>
                    <TableCell>{showing.listingAddress}</TableCell>
                    <TableCell>{formatDateTime(showing.scheduled_date, showing.scheduled_time)}</TableCell>
                    <TableCell>
                      {getStatusBadge(showing.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserShowings;
