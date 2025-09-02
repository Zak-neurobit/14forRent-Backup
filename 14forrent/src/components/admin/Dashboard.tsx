import { useEffect } from "react";
import { StatCard } from "./StatCard";
import { VisitorAnalytics } from "./VisitorAnalytics";
import DashboardSkeleton from "@/components/skeletons/DashboardSkeleton";
import { useAdminData } from "@/contexts/AdminDataContext";

const Dashboard = () => {
  const { stats, loading, error, refreshStats } = useAdminData();
  
  // Refresh stats on mount if they're stale
  useEffect(() => {
    const isStale = Date.now() - stats.lastUpdated > 10 * 60 * 1000; // 10 minutes
    if (isStale) {
      refreshStats();
    }
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-8 bg-white rounded-lg shadow">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">Failed to load dashboard</p>
          <p className="text-sm text-gray-600">{error}</p>
          <button 
            onClick={() => refreshStats()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Total Properties"
          value={stats.totalListings}
          description="Active listings"
        />
        <StatCard
          title="Total Showings"
          value={stats.totalShowings}
          description="All scheduled tours"
        />
        <StatCard
          title="Pending Showings"
          value={stats.pendingShowings}
          description="Awaiting confirmation"
        />
      </div>
      
      {/* Visitor Analytics Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Visitor Analytics</h2>
        <VisitorAnalytics />
      </div>
    </div>
  );
};

export default Dashboard;