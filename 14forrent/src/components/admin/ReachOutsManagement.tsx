import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Mail } from "lucide-react";
import ChatConversations from "./reachouts/ChatConversations";
import ContactSubmissions from "./reachouts/ContactSubmissions";

export const ReachOutsManagement = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Customer Reach-outs</CardTitle>
          <p className="text-gray-600">Manage all customer interactions in one place</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle size={16} />
                Chat Conversations
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Mail size={16} />
                Contact Forms
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-4">
              <ChatConversations />
            </TabsContent>
            
            <TabsContent value="contact" className="space-y-4">
              <ContactSubmissions />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};