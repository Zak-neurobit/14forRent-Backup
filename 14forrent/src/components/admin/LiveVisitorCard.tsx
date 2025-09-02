import React, { useState, useEffect } from "react";
import { StatCard } from "./StatCard";
import { AnalyticsService } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";

interface LiveVisitorCardProps {
  className?: string;
}

export const LiveVisitorCard: React.FC<LiveVisitorCardProps> = ({ className }) => {
  const [liveVisitors, setLiveVisitors] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchLiveVisitors = async () => {
      try {
        const count = await AnalyticsService.getLiveVisitorCount();
        if (mounted) {
          setLiveVisitors(count);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch live visitors:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initial fetch
    fetchLiveVisitors();

    // Set up real-time subscription for active sessions
    const channel = supabase
      .channel('live-visitors')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions'
        },
        () => {
          // Refetch count when sessions change
          fetchLiveVisitors();
        }
      )
      .subscribe();

    // Refresh every 30 seconds to catch session timeouts
    const refreshInterval = setInterval(() => {
      if (mounted) {
        fetchLiveVisitors();
      }
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <StatCard
      title="Live Visitors"
      value={liveVisitors}
      icon="Users"
      iconColor="text-green-500"
      loading={loading}
      className={className}
    />
  );
};