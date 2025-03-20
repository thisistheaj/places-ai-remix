import { useState, useEffect, useRef } from 'react';
import { useAuth } from '~/lib/auth';
import { subscribeToMessages, sendGlobalMessage, sendDirectMessage, sendRoomMessage, PATHS, getUserColor, subscribeToDmUsers, subscribeToUserSearch } from '~/lib/chat';
import type { Message } from '~/models/message';
import { EventBus } from '~/game/EventBus';
import { useDebounce } from '~/hooks/useDebounce';
import { getPresenceStatus, getPresenceColor, type Player } from '~/models/player';
import { subscribeToPlayers } from '~/lib/firebase';

interface NearbyPlayer {
  id: string;
  name: string;
}

interface DmUser {
  id: string;
  name: string;
}

interface RoomChangeEvent {
  oldRoom: string | null;
  newRoom: string | null;
  userId: string | null;
}

export function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isChatCollapsed, setIsChatCollapsed] = useState(() => {
    const saved = localStorage.getItem('chat-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(() => {
    const saved = localStorage.getItem('users-collapsed');
    return saved ? JSON.parse(saved) : true;
  });
  const [nearbyPlayer, setNearbyPlayer] = useState<NearbyPlayer | null>(null);
  const [manualDmUser, setManualDmUser] = useState<DmUser | null>(null);
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [dmUsers, setDmUsers] = useState<DmUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DmUser[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  
  // The current chat context: room > manual DM > nearby player > global
  const currentChatPartner = manualDmUser || nearbyPlayer;
  const chatContext = currentRoom ? { type: 'room' as const, room: currentRoom } 
    : currentChatPartner ? { type: 'dm' as const, partner: currentChatPartner }
    : { type: 'global' as const };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Subscribe to user search results
  useEffect(() => {
    if (!user || !isSearching) return;
    
    const unsubscribe = subscribeToUserSearch(debouncedSearch, user.uid, setSearchResults);
    return () => unsubscribe();
  }, [user, debouncedSearch, isSearching]);

  // Subscribe to DM users
  useEffect(() => {
    if (!user) return;
    return subscribeToDmUsers(user.uid, setDmUsers);
  }, [user]);

  // Subscribe to room changes
  useEffect(() => {
    const handleRoomChange = (event: RoomChangeEvent) => {
      if (event.userId === user?.uid) {
        setCurrentRoom(event.newRoom);
        setMessages([]); // Clear messages when changing rooms
      }
    };
    
    EventBus.on('room-changed', handleRoomChange);
    return () => {
      EventBus.off('room-changed', handleRoomChange);
    };
  }, [user]);

  // Subscribe to messages based on current context
  useEffect(() => {
    if (!user) return;
    
    let path: string;
    if (chatContext.type === 'room' && chatContext.room) {
      path = PATHS.room(chatContext.room);
    } else if (chatContext.type === 'dm' && chatContext.partner) {
      path = PATHS.dm(user.uid, chatContext.partner.id);
    } else {
      path = PATHS.global;
    }
    
    const unsubscribe = subscribeToMessages(path, setMessages);
    return () => unsubscribe();
  }, [user, chatContext]);
  
  // Listen for nearby player updates from the game scene
  useEffect(() => {
    const handleNearbyPlayer = (player: NearbyPlayer | null) => {
      // Only handle proximity updates if we're not in a manual DM
      if (!manualDmUser && player?.id !== nearbyPlayer?.id) {
        setNearbyPlayer(player);
        if (player) {
          setMessages([]);
        }
      }
    };
    
    EventBus.on('nearby-player', handleNearbyPlayer);
    return () => {
      EventBus.off('nearby-player', handleNearbyPlayer);
    };
  }, [nearbyPlayer, manualDmUser]);
  
  // Scroll to bottom when messages change or chat is expanded
  useEffect(() => {
    if (!isChatCollapsed) {
      scrollToBottom();
    }
  }, [messages, isChatCollapsed]);
  
  // Save collapsed states to localStorage
  useEffect(() => {
    localStorage.setItem('chat-collapsed', JSON.stringify(isChatCollapsed));
    localStorage.setItem('users-collapsed', JSON.stringify(isUsersCollapsed));
  }, [isChatCollapsed, isUsersCollapsed]);
  
  // Subscribe to all players to get presence information
  useEffect(() => {
    if (!user) return;
    return subscribeToPlayers(setPlayers);
  }, [user]);

  // Helper function to get presence color for a user
  const getPlayerPresenceColor = (playerId: string) => {
    const player = players[playerId];
    if (!player) return '#ff0000'; // Default to offline/red if player not found
    const status = getPresenceStatus(player);
    return '#' + getPresenceColor(status).toString(16).padStart(6, '0');
  };
  
  if (!user) return null;
  
  const handleSendMessage = (text: string) => {
    if (!user) return;
    
    if (chatContext.type === 'room' && chatContext.room) {
      sendRoomMessage(text, user.uid, user.displayName || 'Anonymous', chatContext.room);
    } else if (chatContext.type === 'dm' && chatContext.partner) {
      sendDirectMessage(text, user.uid, user.displayName || 'Anonymous', chatContext.partner.id);
    } else {
      sendGlobalMessage(text, user.uid, user.displayName || 'Anonymous');
    }
  };

  const handleSearchFocus = () => {
    setIsSearching(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setIsSearching(false), 200);
  };

  const switchToDm = (dmUser: DmUser) => {
    setManualDmUser(dmUser);
    setNearbyPlayer(null);
    setMessages([]);
    setSearchTerm('');
    setIsSearching(false);
  };

  const returnToPublicChat = () => {
    setManualDmUser(null);
    setNearbyPlayer(null);
    setMessages([]);
  };
  
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {/* Users and Search Box - only show when not in a room or DM */}
      {!currentRoom && !manualDmUser && !nearbyPlayer && (
        <div className="w-80 bg-[rgba(30,30,50,0.9)] backdrop-blur-sm border border-[rgba(217,70,239,0.3)] rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsUsersCollapsed(!isUsersCollapsed)}
            className="w-full p-2 flex items-center justify-between bg-[rgba(30,30,50,0.8)] hover:bg-[rgba(217,70,239,0.2)] transition-colors"
          >
            <span className="font-medium text-[#d946ef]">All Users</span>
            <span className="text-sm text-[#d946ef] opacity-50">
              {isUsersCollapsed ? '▼' : '▲'}
            </span>
          </button>

          {/* Content */}
          <div className={`transition-all duration-200 ${isUsersCollapsed ? 'h-0' : ''}`}>
            {/* Search Bar */}
            <div className="p-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search users..."
                className="w-full p-2 rounded bg-[rgba(30,30,50,0.8)] border border-[rgba(217,70,239,0.3)] text-white placeholder-[rgba(217,70,239,0.5)] focus:border-[rgba(217,70,239,0.5)] focus:outline-none"
              />
            </div>

            {/* Search Results */}
            {isSearching && searchResults.length > 0 && (
              <div className="border-t border-[rgba(217,70,239,0.3)]">
                {searchResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => switchToDm(result)}
                    className="w-full p-2 flex items-center gap-2 hover:bg-[rgba(217,70,239,0.2)] transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPlayerPresenceColor(result.id) }}></div>
                    <span className="text-[#d946ef]">{result.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent DMs Section */}
            {dmUsers.length > 0 && (
              <div className="border-t border-[rgba(217,70,239,0.3)]">
                <div className="p-2 text-[rgba(217,70,239,0.7)] text-sm font-medium">
                  Recent DMs
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {dmUsers.map(dmUser => (
                    <button
                      key={dmUser.id}
                      onClick={() => switchToDm(dmUser)}
                      className="w-full p-2 flex items-center gap-2 hover:bg-[rgba(217,70,239,0.2)] transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPlayerPresenceColor(dmUser.id) }}></div>
                      <span className="text-[#d946ef]">{dmUser.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Chat Window */}
      <div className="w-80 bg-[rgba(30,30,50,0.9)] backdrop-blur-sm border border-[rgba(217,70,239,0.3)] rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[rgba(30,30,50,0.8)]">
          <button
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
            className="w-full p-2 flex items-center justify-between hover:bg-[rgba(217,70,239,0.2)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ 
                  backgroundColor: chatContext.type === 'dm' && chatContext.partner
                    ? getPlayerPresenceColor(chatContext.partner.id)
                    : '#00ff00'
                }}
              ></div>
              <span className="font-medium text-[#d946ef]">
                {chatContext.type === 'room' ? `${chatContext.room} Chat`
                  : chatContext.type === 'dm' ? `Chat with ${chatContext.partner.name}`
                  : 'Public Chat'}
              </span>
            </div>
            <span className="text-sm text-[#d946ef] opacity-50">
              {isChatCollapsed ? '▼' : '▲'}
            </span>
          </button>
          
          {/* Return to Public Chat button - only show when in a manual DM */}
          {manualDmUser && (
            <button
              onClick={returnToPublicChat}
              className="w-full p-1 text-sm text-[rgba(217,70,239,0.7)] hover:bg-[rgba(217,70,239,0.2)] transition-colors border-t border-[rgba(217,70,239,0.3)]"
            >
              Return to Public Chat
            </button>
          )}
        </div>
        
        {/* Messages */}
        <div className={`transition-all duration-200 ${isChatCollapsed ? 'h-0' : 'h-80'}`}>
          <div className="h-full flex flex-col">
            {/* Message list */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="text-[rgba(217,70,239,0.5)] italic text-center">
                  {chatContext.type === 'dm' && chatContext.partner
                    ? `Start a private conversation with ${chatContext.partner.name}`
                    : 'No messages yet'}
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className="mb-2">
                  <span 
                    className="font-medium"
                    style={{ color: getUserColor(msg.senderId) }}
                  >
                    {msg.sender}:
                  </span>
                  <span className="text-white ml-2">{msg.text}</span>
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
                  placeholder={chatContext.type === 'dm' && chatContext.partner ? `Message ${chatContext.partner.name}...` : "Type a message..."}
                  className="w-full p-2 rounded bg-[rgba(30,30,50,0.8)] border border-[rgba(217,70,239,0.3)] text-white placeholder-[rgba(217,70,239,0.5)] focus:border-[rgba(217,70,239,0.5)] focus:outline-none"
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 