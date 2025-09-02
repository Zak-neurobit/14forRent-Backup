
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SettingsStatus = () => {
  const [status, setStatus] = useState<{
    hasSettings: boolean;
    hasApiKey: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    hasSettings: false,
    hasApiKey: false,
    isLoading: true,
    error: null,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [lastTestError, setLastTestError] = useState<string | null>(null);
  const [testErrorShown, setTestErrorShown] = useState(false);

  useEffect(() => {
    checkSettingsStatus();
  }, []);

  const checkSettingsStatus = async () => {
    try {
      const { data: settings, error } = await supabase
        .from("ai_settings")
        .select("openai_api_key")
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        setStatus({
          hasSettings: false,
          hasApiKey: false,
          isLoading: false,
          error: error.message,
        });
        return;
      }

      setStatus({
        hasSettings: !!settings,
        hasApiKey: !!(settings?.openai_api_key),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setStatus({
        hasSettings: false,
        hasApiKey: false,
        isLoading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const testChatbot = async () => {
    if (isTesting) return; // Prevent multiple simultaneous tests
    
    setIsTesting(true);
    setTestErrorShown(false); // Reset error shown flag for new test
    
    try {
      toast.info("Testing support connection...", {
        description: "Sending test message to support system"
      });

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: "Hello, this is a test message from the admin panel",
          conversationHistory: []
        }
      });

      if (error) {
        throw error;
      }
      
      if (data?.reply) {
        setLastTestError(null); // Clear any previous error
        toast.success("✅ Chatbot is working perfectly!", {
          description: `Response: "${data.reply.substring(0, 100)}${data.reply.length > 100 ? '...' : ''}"`
        });
      } else if (data?.error) {
        const errorMsg = data.error;
        setLastTestError(errorMsg);
        if (!testErrorShown) {
          setTestErrorShown(true);
          toast.error("❌ Chatbot responded with error", {
            description: errorMsg
          });
        }
      } else {
        const warningMsg = `Received: ${JSON.stringify(data).substring(0, 100)}...`;
        toast.warning("⚠️ Unexpected response format", {
          description: warningMsg
        });
      }
    } catch (err: any) {
      console.error('Chatbot test error:', err);
      const errorMsg = err?.message || "Unknown error occurred during testing";
      setLastTestError(errorMsg);
      
      // Only show error toast once per test attempt
      if (!testErrorShown) {
        setTestErrorShown(true);
        toast.error("🚫 Chatbot connection failed", {
          description: errorMsg
        });
      }
    } finally {
      setIsTesting(false);
    }
  };

  if (status.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Settings Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {status.hasSettings ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <span>Settings Record: {status.hasSettings ? "Found" : "Not found"}</span>
        </div>

        <div className="flex items-center gap-2">
          {status.hasApiKey ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          <span>API Key: {status.hasApiKey ? "Configured" : "Not configured"}</span>
        </div>

        {status.error && (
          <Alert variant="destructive">
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {!status.hasSettings && (
          <Alert>
            <AlertDescription>
              No support settings found. Please save your settings to enable the support system.
            </AlertDescription>
          </Alert>
        )}

        {status.hasSettings && !status.hasApiKey && (
          <Alert>
            <AlertDescription>
              API key is missing. Please configure the OpenAI API key in the General tab.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Button
            onClick={testChatbot}
            className="mt-4"
            disabled={!status.hasSettings || isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Chatbot Connection"
            )}
          </Button>
          
          {lastTestError && !isTesting && (
            <Alert variant="destructive">
              <AlertDescription>
                Last test failed: {lastTestError}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
