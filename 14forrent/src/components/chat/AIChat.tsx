
import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatWindow from "./ChatWindow";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY = '14forrent-chat-history';

const AIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [previousUser, setPreviousUser] = useState(user);

  // Clear chat history when user logs out
  useEffect(() => {
    if (previousUser && !user) {
      // User logged out - clear chat history
      localStorage.removeItem(STORAGE_KEY);
      console.log('Chat history cleared due to logout');
    }
    setPreviousUser(user);
  }, [user, previousUser]);

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#1A2953] hover:bg-[#2A3F70] text-white rounded-full p-3 sm:p-4 shadow-lg transition-colors duration-200"
          aria-label="Toggle customer support chat"
        >
          {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 sm:bottom-20 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-auto max-w-sm sm:max-w-none">
          <ChatWindow onClose={() => setIsOpen(false)} />
        </div>
      )}
    </>
  );
};

export default AIChat;
