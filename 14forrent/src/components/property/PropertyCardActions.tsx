
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PropertyCardActionsProps {
  manageable?: boolean;
  propertyId?: string;
}

const PropertyCardActions = ({ manageable = false, propertyId }: PropertyCardActionsProps) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/list/${propertyId}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!propertyId) {
      toast.error("Cannot delete property - no property ID provided");
      return;
    }

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', propertyId);

      if (error) throw error;
      toast.success("Property successfully deleted");
      
      // Refresh the page after a small delay to show the toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error("Failed to delete property");
      console.error("Error deleting property:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mt-4 flex justify-between items-center">
      <Button asChild variant="outline" className="text-forrent-navy border-forrent-navy hover:bg-forrent-navy hover:text-white">
        <Link to={`/property/${propertyId}`}>
          View Details
        </Link>
      </Button>
      
      {manageable ? (
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="text-amber-500 border-amber-500 hover:bg-amber-500 hover:text-white" onClick={handleEdit}>
            <Edit size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default PropertyCardActions;
