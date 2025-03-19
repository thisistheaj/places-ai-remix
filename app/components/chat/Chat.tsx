import { useState, useEffect, useRef } from 'react';
import { useAuth } from '~/lib/auth';
import { subscribeToMessages, sendGlobalMessage, sendDirectMessage, PATHS } from '~/lib/chat';
import type { Message } from '~/models/message';
import { EventBus } from '~/game/EventBus';

interface NearbyPlayer {
  id: string;
  name: string;
}

export function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get initial state from localStorage
    const saved = localStorage.getItem('chat-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const [nearbyPlayer, setNearbyPlayer] = useState<NearbyPlayer | null>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Subscribe to global messages or DMs based on nearby player
  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = nearbyPlayer 
      ? subscribeToMessages(PATHS.dm(user.uid, nearbyPlayer.id), setMessages)
      : subscribeToMessages(PATHS.global, setMessages);
      
    return () => unsubscribe();
  }, [user, nearbyPlayer]);
  
  // Listen for nearby player updates from the game scene
  useEffect(() => {
    const handleNearbyPlayer = (player: NearbyPlayer | null) => {
      // Only switch context if it's actually a different player
      if (player?.id !== nearbyPlayer?.id) {
        setNearbyPlayer(player);
        if (player) {
          setMessages([]); // Only clear messages when actually switching to a new player
        }
      }
    };
    
    EventBus.on('nearby-player', handleNearbyPlayer);
    return () => EventBus.off('nearby-player', handleNearbyPlayer);
  }, [nearbyPlayer]); // Add nearbyPlayer to dependencies since we're using it in comparison
  
  // Scroll to bottom when messages change or chat is expanded
  useEffect(() => {
    if (!isCollapsed) {
      scrollToBottom();
    }
  }, [messages, isCollapsed]);
  
  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('chat-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);
  
  if (!user) return null;
  
  const handleSendMessage = (text: string) => {
    if (nearbyPlayer) {
      sendDirectMessage(text, user.uid, user.displayName || 'Anonymous', nearbyPlayer.id);
    } else {
      sendGlobalMessage(text, user.uid, user.displayName || 'Anonymous');
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-[rgba(30,30,50,0.9)] backdrop-blur-sm border border-[rgba(217,70,239,0.3)] rounded-lg shadow-lg overflow-hidden z-50">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-2 flex items-center justify-between bg-[rgba(30,30,50,0.8)] hover:bg-[rgba(217,70,239,0.2)] hover:border-[rgba(217,70,239,0.5)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00ff00]"></div>
          <span className="font-medium text-[#d946ef]">
            {nearbyPlayer ? `Chat with ${nearbyPlayer.name}` : 'Public Chat'}
          </span>
        </div>
        <span className="text-sm text-[#d946ef] opacity-50">
          {isCollapsed ? '▼' : '▲'}
        </span>
      </button>
      
      {/* Messages */}
      <div
        className={`transition-all duration-200 ${
          isCollapsed ? 'h-0' : 'h-80'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Message list */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-[rgba(217,70,239,0.5)] italic text-center">
                {nearbyPlayer 
                  ? `Start a private conversation with ${nearbyPlayer.name}`
                  : 'No messages yet'}
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className="mb-2 text-[#d946ef]">
                <span className="font-medium">{msg.sender}: </span>
                <span className="text-white">{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="p-2 border-t border-[rgba(217,70,239,0.3)]">
            <form
              onSubmit={e => {
                e.preventDefault();
                const form = e.currentTarget;
                const input = form.elements.namedItem('message') as HTMLInputElement;
                if (!input.value.trim()) return;
                
                handleSendMessage(input.value);
                input.value = '';
              }}
            >
              <input
                type="text"
                name="message"
                placeholder={nearbyPlayer ? `Message ${nearbyPlayer.name}...` : "Type a message..."}
                className="w-full p-2 rounded bg-[rgba(30,30,50,0.8)] border border-[rgba(217,70,239,0.3)] text-white placeholder-[rgba(217,70,239,0.5)] focus:border-[rgba(217,70,239,0.5)] focus:outline-none"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 