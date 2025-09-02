
import { User, Bot } from "lucide-react";
import ChatPropertyCard from "./ChatPropertyCard";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  properties?: any[];
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === 'user';
  
  console.log('ChatMessage rendering:', { 
    role: message.role, 
    hasProperties: !!message.properties?.length,
    properties: message.properties,
    messageId: message.id
  });

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-2 max-w-xs ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-gray-500'
        }`}>
          {isUser ? (
            <User size={16} className="text-white" />
          ) : (
            <Bot size={16} className="text-white" />
          )}
        </div>
        
        <div className="flex flex-col space-y-2">
          {/* Always show message content if it exists */}
          {message.content && message.content.trim().length > 0 && (
            <div className={`px-3 py-2 rounded-lg ${
              isUser 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
          
          {/* GUARANTEE property card rendering for assistant messages */}
          {!isUser && message.properties && Array.isArray(message.properties) && message.properties.length > 0 && (
            <div className="space-y-2">
              {message.properties.map((property, index) => {
                console.log('RENDERING PROPERTY CARD:', {
                  propertyId: property.id,
                  title: property.title,
                  images: property.images,
                  price: property.price,
                  index
                });
                return (
                  <div key={`${message.id}-property-${property.id || index}`} className="w-full">
                    <ChatPropertyCard property={property} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Debug info for development - remove in production */}
          {!isUser && !message.properties && (() => {
            console.log('NO PROPERTIES TO RENDER for message:', message.id);
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
