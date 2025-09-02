
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/admin/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AdminDataProvider } from "@/contexts/AdminDataContext";

// Lazy load all admin components for blazing fast initial load
const Dashboard = lazy(() => import("@/components/admin/Dashboard"));
const AISettings = lazy(() => import("@/components/admin/AISettings").then(m => ({ default: m.AISettings })));
const ShowingsManagement = lazy(() => import("@/components/admin/ShowingsManagement").then(m => ({ default: m.ShowingsManagement })));
const BlogManagement = lazy(() => import("@/components/admin/BlogManagement"));
const ListingManagement = lazy(() => import("@/components/admin/ListingManagement").then(m => ({ default: m.ListingManagement })));
const ReachOutsManagement = lazy(() => import("@/components/admin/ReachOutsManagement").then(m => ({ default: m.ReachOutsManagement })));
const EmailSettings = lazy(() => import("@/components/admin/EmailSettings").then(m => ({ default: m.EmailSettings })));
const UserManagement = lazy(() => import("@/components/admin/UserManagement").then(m => ({ default: m.UserManagement })));

// Loading component for lazy loaded tabs
const TabLoader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2">Loading...</span>
  </div>
);

const Admin = () => {
  const { user, isAdmin } = useAuth();

  console.log('Admin: Rendering with user:', user?.id, 'isAdmin:', isAdmin);

  if (!user || !isAdmin) {
    console.log('Admin: Redirecting to login - no user or not admin');
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminDataProvider>
      <AdminLayout>
        <div className="container mx-auto p-4 lg:p-6 max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="text-sm text-gray-500 mt-2 sm:mt-0">
              Welcome back, {user?.email}
            </div>
          </div>
          
          <Tabs defaultValue="dashboard" className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 min-w-max">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-2 sm:px-4">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm px-2 sm:px-4">
                Users
              </TabsTrigger>
              <TabsTrigger value="listings" className="text-xs sm:text-sm px-2 sm:px-4">
                Listings
              </TabsTrigger>
              <TabsTrigger value="showings" className="text-xs sm:text-sm px-2 sm:px-4">
                Showings
              </TabsTrigger>
              <TabsTrigger value="reachouts" className="text-xs sm:text-sm px-2 sm:px-4">
                Reach-outs
              </TabsTrigger>
              <TabsTrigger value="ai-settings" className="text-xs sm:text-sm px-2 sm:px-4">
                AI Settings
              </TabsTrigger>
              <TabsTrigger value="blog" className="text-xs sm:text-sm px-2 sm:px-4">
                Blog
              </TabsTrigger>
              <TabsTrigger value="email-settings" className="text-xs sm:text-sm px-2 sm:px-4">
                Email
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="dashboard" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <Dashboard />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="ai-settings" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <AISettings />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="listings" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <ListingManagement />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          
          <TabsContent value="showings" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <ShowingsManagement />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="blog" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <BlogManagement />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="reachouts" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <ReachOutsManagement />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="email-settings" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <EmailSettings />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            <ErrorBoundary>
              <Suspense fallback={<TabLoader />}>
                <UserManagement />
              </Suspense>
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
    </AdminDataProvider>
  );
};

export default Admin;
