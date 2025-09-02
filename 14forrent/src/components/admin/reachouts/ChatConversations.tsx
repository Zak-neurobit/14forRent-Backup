import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, User, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ChatConversation {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  started_at: string;
  last_message_at: string;
  message_count: number;
  summary: string | null;
  status: string;
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  properties: any | null;
  created_at: string;
}

const ChatConversations = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedConversation, setExpandedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Record<string, ChatMessage[]>>({});
  const [loadingMessages, setLoadingMessages] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load chat conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(conversationId);
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setConversationMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoadingMessages(null);
    }
  };

  const toggleConversation = async (conversationId: string) => {
    if (expandedConversation === conversationId) {
      setExpandedConversation(null);
    } else {
      setExpandedConversation(conversationId);
      if (!conversationMessages[conversationId]) {
        await fetchMessages(conversationId);
      }
    }
  };

  const generateSummary = async (conversationId: string) => {
    try {
      const messages = conversationMessages[conversationId];
      if (!messages || messages.length === 0) {
        await fetchMessages(conversationId);
        return;
      }

      // Create a simple summary from the messages
      const userMessages = messages.filter(m => m.role === 'user').slice(0, 3);
      const summary = userMessages.map(m => m.content.substring(0, 50)).join('; ');
      
      // Update the conversation with the summary
      const { error } = await supabase
        .from('chat_conversations')
        .update({ summary })
        .eq('id', conversationId);

      if (error) throw error;
      
      toast.success("Summary generated");
      fetchConversations();
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    }
  };

  const updateStatus = async (conversationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status })
        .eq('id', conversationId);

      if (error) throw error;
      
      toast.success(`Status updated to ${status}`);
      fetchConversations();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No chat conversations yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <Card key={conversation.id} className="overflow-hidden">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50"
            onClick={() => toggleConversation(conversation.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-semibold">
                    {conversation.user_name || conversation.user_email || "Anonymous User"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {conversation.user_email || "No email provided"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant={
                  conversation.status === 'active' ? 'default' : 
                  conversation.status === 'resolved' ? 'secondary' : 'outline'
                }>
                  {conversation.status}
                </Badge>
                
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <MessageCircle size={14} />
                  {conversation.message_count} messages
                </div>
                
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock size={14} />
                  {format(new Date(conversation.last_message_at), 'MMM d, h:mm a')}
                </div>
                
                {expandedConversation === conversation.id ? 
                  <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                }
              </div>
            </div>
            
            {conversation.summary && (
              <div className="mt-2 text-sm text-gray-600 italic">
                Summary: {conversation.summary}
              </div>
            )}
          </CardHeader>
          
          {expandedConversation === conversation.id && (
            <CardContent className="border-t">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generateSummary(conversation.id)}
                  >
                    Generate Summary
                  </Button>
                  
                  {conversation.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(conversation.id, 'resolved')}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                  
                  {conversation.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(conversation.id, 'active')}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-3 bg-gray-50 rounded p-4">
                  {loadingMessages === conversation.id ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-500" />
                    </div>
                  ) : (
                    conversationMessages[conversation.id]?.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-white border border-gray-200'
                          }`}
                        >
                          <div className="text-sm">{message.content}</div>
                          <div className={`text-xs mt-1 ${
                            message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                          }`}>
                            {format(new Date(message.created_at), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ChatConversations;