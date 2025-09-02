import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { updateListingsWithoutUserIds, checkListingsUserIdStatus } from "@/utils/updateListingsUserIds";
import { Loader2, Database, Users, AlertTriangle } from "lucide-react";

const ListingMigration = () => {
  const { isAdmin } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    try {
      const result = await checkListingsUserIdStatus();
      if (result.success) {
        setStatus(result);
        toast.success("Status check completed");
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      toast.error("Failed to check status");
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdateListings = async () => {
    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateListingsWithoutUserIds();
      if (result.success) {
        toast.success(result.message);
        // Refresh status after update
        setTimeout(handleCheckStatus, 1000);
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      toast.error("Failed to update listings");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2" />
              Access Denied
            </CardTitle>
            <CardDescription>
              This page is only accessible to administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2" />
            Listing User ID Migration
          </CardTitle>
          <CardDescription>
            Update existing listings to ensure they have proper user_id associations for contact information display.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Status Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Current Status</h3>
              <Button 
                onClick={handleCheckStatus} 
                disabled={isChecking}
                variant="outline"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Check Status
                  </>
                )}
              </Button>
            </div>

            {status && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{status.total}</div>
                      <div className="text-sm text-gray-600">Total Listings</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{status.withUserId}</div>
                      <div className="text-sm text-gray-600">With User ID</div>
                      <Badge className="mt-1" variant="secondary">Good</Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{status.withoutUserId}</div>
                      <div className="text-sm text-gray-600">Missing User ID</div>
                      {status.withoutUserId > 0 && (
                        <Badge className="mt-1" variant="destructive">Needs Update</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Migration Section */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold">Migration Actions</h3>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Update Listings Without User ID</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will assign all listings without a user_id to be owned by the current admin user. 
                      This ensures contact information displays correctly on property pages.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleUpdateListings}
                disabled={isUpdating || (status && status.withoutUserId === 0)}
                size="lg"
                className="w-full"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Listings...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Update Listings User IDs
                    {status && status.withoutUserId > 0 && (
                      <Badge className="ml-2" variant="destructive">
                        {status.withoutUserId} need update
                      </Badge>
                    )}
                  </>
                )}
              </Button>

              {status && status.withoutUserId === 0 && (
                <p className="text-center text-green-600 font-medium">
                  ✅ All listings have proper user_id associations!
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingMigration;