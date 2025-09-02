
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useSoldPropertyNotification = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Subscribe to changes in listings table for current user
    const channel = supabase
      .channel('property-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const { new: newRecord, old: oldRecord } = payload;
          
          // Check if status changed to 'sold'
          if (oldRecord.status !== 'sold' && newRecord.status === 'sold') {
            toast.success(
              `Your property "${newRecord.title}" has been marked as sold by an administrator.`,
              {
                duration: 8000,
                action: {
                  label: "View Dashboard",
                  onClick: () => window.location.href = "/owner-dashboard"
                }
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
