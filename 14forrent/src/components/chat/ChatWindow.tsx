
import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMessage from "./ChatMessage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  properties?: any[];
  timestamp: Date;
  loading?: boolean;
}

interface ChatWindowProps {
  onClose: () => void;
}

const STORAGE_KEY = '14forrent-chat-history';

const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);
  const [errorShown, setErrorShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  // Load messages from sessionStorage on component mount
  useEffect(() => {
    const storedMessages = sessionStorage.getItem(STORAGE_KEY);
    if (storedMessages) {
      try {
        const parsedMessages = JSON.parse(storedMessages).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
        console.log('Loaded chat history from session storage:', parsedMessages.length, 'messages');
      } catch (error) {
        console.error('Error parsing stored messages:', error);
        setMessages([]);
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save messages to sessionStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      // Keep last 50 messages for session storage
      const messagesToStore = messages.slice(-50);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToStore));
      console.log('Saved chat history to session storage:', messagesToStore.length, 'messages');
    }
  }, [messages]);

  // Clear chat history when user logs out
  useEffect(() => {
    if (!user) {
      sessionStorage.removeItem(STORAGE_KEY);
      setMessages([]);
      console.log('Cleared chat history due to logout');
    }
  }, [user]);

  const scrollToBottom = (force = false) => {
    const container = messagesContainerRef.current;
    if (container && messagesEndRef.current) {
      if (force) {
        // Force scroll to bottom (for initial load)
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      } else {
        // Only scroll if user is near bottom
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Force scroll to bottom after initial message load from session storage
  useEffect(() => {
    if (messages.length > 0) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }
  }, [messages.length === 0 ? 0 : 1]); // Only trigger when transitioning from 0 to any messages

  const processBatchedMessages = async (messagesToProcess: string[]) => {
    if (messagesToProcess.length === 0) return;

    console.log('Processing batched messages:', messagesToProcess);
    
    // Reset error flag for new message batch
    setErrorShown(false);

    // Add all user messages first
    const userMessages: Message[] = messagesToProcess.map((msg, index) => ({
      id: (Date.now() + index).toString(),
      role: 'user',
      content: msg,
      timestamp: new Date()
    }));

    setMessages(prev => [...prev, ...userMessages]);
    
    // Add single loading message for assistant
    const loadingMessage: Message = {
      id: (Date.now() + messagesToProcess.length).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true
    };
    setMessages(prev => [...prev, loadingMessage]);

    setIsLoading(true);

    try {
      console.log('Sending batched messages to chatbot function');
      
      // Get last 10 messages for context (excluding the loading message)
      const contextMessages = messages
        .filter(msg => !msg.loading)
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          properties: msg.properties
        }));
      
      // Combine all messages into one context for the AI
      const combinedMessage = messagesToProcess.join(' ');
      
      // Fixed 2 seconds delay while showing typing indicator
      const delay = 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { 
          message: combinedMessage,
          context: contextMessages
        }
      });

      if (error) {
        console.error('Chatbot function error:', error);
        throw error;
      }

      console.log('Raw chatbot response received:', data);

      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.loading);
        
        // GUARANTEE property processing - force properties field handling
        let properties = [];
        
        // Check multiple possible property fields from backend
        if (data.properties && Array.isArray(data.properties)) {
          properties = data.properties;
        } else if (data.listings && Array.isArray(data.listings)) {
          properties = data.listings;
        } else if (data.property) {
          properties = [data.property];
        }

        console.log('PROCESSED PROPERTIES:', properties);
        console.log('Properties count:', properties.length);

        // Ensure each property has required fields
        const validatedProperties = properties.map(prop => {
          console.log('Processing property:', prop);
          
          // Ensure images array exists and has proper URLs
          const processedImages = prop.images && Array.isArray(prop.images) 
            ? prop.images.filter(img => img && img.trim() !== '') 
            : ['/placeholder.svg'];
          
          console.log('Property images processed:', processedImages);

          return {
            id: prop.id || Date.now().toString(),
            title: prop.title || 'Property',
            location: prop.location || 'Location not specified',
            price: prop.price || 0,
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0,
            sqft: prop.sqft,
            images: processedImages,
            description: prop.description,
            featured: prop.featured || false,
            amenities: prop.amenities || []
          };
        });

        console.log('FINAL VALIDATED PROPERTIES:', validatedProperties);

        // Clean reply text - remove any property details and formatting that might have leaked through
        let replyText = (data.reply || data.response || "")
          // Remove JSON code blocks and backticks
          .replace(/```json\s*```/gi, '')
          .replace(/```\s*```/gi, '')
          .replace(/```json/gi, '')
          .replace(/```/gi, '')
          // Remove empty JSON structures
          .replace(/\{\s*\}/g, '')
          .replace(/\[\s*\]/g, '')
          // Remove property details
          .replace(/\$[\d,]+/g, '') // Remove prices
          .replace(/\d+\s*(?:bed|bedroom|bath|bathroom)/gi, '') // Remove bed/bath counts
          .replace(/\d+\s*(?:sq\.?\s*ft\.?|square\s*feet)/gi, '') // Remove square footage
          .replace(/\[[^\]]+\]/g, '') // Remove bracketed content
          // Clean up multiple whitespace and newlines
          .replace(/\n\s*\n/g, '\n')
          .replace(/\s+/g, ' ')
          .split("\n")
          .filter(line => !line.trim().startsWith("["))
          .filter(line => line.trim() !== '')
          .join("\n")
          .trim() || "I found some great options for you! Take a look at the properties below.";

        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: replyText,
          properties: validatedProperties.length > 0 ? validatedProperties : undefined,
          timestamp: new Date()
        };

        console.log('FINAL ASSISTANT MESSAGE:', assistantMessage);
        console.log('Has properties:', !!assistantMessage.properties);
        console.log('Properties length:', assistantMessage.properties?.length || 0);
        
        return [...withoutLoading, assistantMessage];
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Remove loading message and show error
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.loading);
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
          timestamp: new Date()
        };
        return [...withoutLoading, errorMessage];
      });
      
      // Only show error toast once per batch to prevent spam
      if (!errorShown) {
        setErrorShown(true);
        toast.error("Sorry, I'm having trouble responding. Please try again.");
        // Reset error flag after a delay to allow future error notifications
        setTimeout(() => setErrorShown(false), 5000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input.trim();
    setInput(""); // Clear input immediately

    // Clear any existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Add to pending messages
    setPendingMessages(prev => [...prev, currentInput]);

    // If already loading, just add to batch
    if (isLoading) {
      console.log('Already loading, adding to batch:', currentInput);
      return;
    }

    // Set timeout to batch messages
    batchTimeoutRef.current = setTimeout(() => {
      setPendingMessages(prev => {
        if (prev.length > 0) {
          console.log('Timeout reached, processing batch:', prev);
          processBatchedMessages(prev);
          return [];
        }
        return prev;
      });
    }, 500); // 500ms window to batch messages
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border w-80 sm:w-96 h-96 sm:h-[500px] flex flex-col">
      {/* Header */}
      <div className="bg-[#1A2953] text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Customer Support</h3>
          <p className="text-sm text-gray-200">24/7 Support Team</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X size={16} />
        </Button>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">Message us for assistance</p>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id}>
            {message.loading ? (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <ChatMessage message={message} />
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about properties..."
            className="flex-1 text-sm"
            disabled={false}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim()}
            size="sm"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
