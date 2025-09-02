
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CleanupSettings = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLastCleanup();
  }, []);

  const loadLastCleanup = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'last_sold_cleanup')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading last cleanup:", error);
        return;
      }

      setLastCleanup(data?.value || null);
    } catch (error) {
      console.error("Unexpected error loading last cleanup:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runCleanup = async () => {
    setIsRunning(true);
    
    try {
      console.log('Starting manual cleanup...');
      
      const { data, error } = await supabase.functions.invoke('cleanup-sold-listings', {
        body: { manual: true }
      });

      if (error) {
        console.error("Error running cleanup:", error);
        toast.error("Failed to run cleanup");
        return;
      }

      console.log('Cleanup result:', data);
      toast.success("Cleanup completed successfully");
      
      // Reload the last cleanup timestamp
      await loadLastCleanup();
      
    } catch (error) {
      console.error("Unexpected error running cleanup:", error);
      toast.error("Failed to run cleanup");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing Cleanup</CardTitle>
        <CardDescription>
          Automatically delete listings that have been marked as sold for more than 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>
            Last cleanup: {isLoading ? (
              <RefreshCw className="inline animate-spin" size={12} />
            ) : (
              lastCleanup ? new Date(lastCleanup).toLocaleString() : 'Never'
            )}
          </span>
        </div>
        
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> This action will permanently delete listings that have been marked as sold for more than 30 days. 
            This action cannot be undone.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runCleanup}
          disabled={isRunning}
          variant="destructive"
          className="flex gap-2 items-center"
        >
          <Trash2 size={16} />
          {isRunning ? "Running Cleanup..." : "Run Cleanup Now"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CleanupSettings;
