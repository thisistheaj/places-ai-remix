import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '~/lib/auth';
import { subscribeToMessages, sendGlobalMessage, sendDirectMessage, sendRoomMessage, PATHS, getUserColor, subscribeToDmUsers, subscribeToUserSearch } from '~/lib/chat';
import type { Message } from '~/models/message';
import { EventBus } from '~/game/EventBus';
import { useDebounce } from '~/hooks/useDebounce';
import { getPresenceStatus, getPresenceColor, type Player } from '~/models/player';
import { subscribeToPlayers } from '~/lib/firebase';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

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
  const messageListRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isChatCollapsed, setIsChatCollapsed] = useState(() => {
    const saved = localStorage.getItem('chat-collapsed');
    // For new users, start collapsed
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isUsersCollapsed, setIsUsersCollapsed] = useState(() => {
    const saved = localStorage.getItem('users-collapsed');
    // For new users, start collapsed
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isInstructionsCollapsed, setIsInstructionsCollapsed] = useState(() => {
    const saved = localStorage.getItem('instructions-collapsed');
    // For new users, start expanded
    return saved !== null ? JSON.parse(saved) : false;
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  
  // Memoize the chat context to prevent unnecessary recalculations
  const chatContext = useMemo(() => {
    const currentChatPartner = manualDmUser || nearbyPlayer;
    return currentRoom ? { type: 'room' as const, room: currentRoom } 
      : currentChatPartner ? { type: 'dm' as const, partner: currentChatPartner }
      : { type: 'global' as const };
  }, [currentRoom, manualDmUser, nearbyPlayer]);

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

  // Handle scroll events to determine if we should auto-scroll
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
    if (isAtBottom !== shouldAutoScroll) {
      setShouldAutoScroll(isAtBottom);
    }
  }, [shouldAutoScroll]);

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
    
    // Only reset auto-scroll when explicitly changing contexts
    if (path !== PATHS.global) {
      setShouldAutoScroll(true);
    }
    
    const unsubscribe = subscribeToMessages(path, (newMessages) => {
      setMessages(newMessages);
      // Check if we should auto-scroll after receiving new messages
      if (messageListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
        const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
        setShouldAutoScroll(isAtBottom);
      }
    });
    
    return () => unsubscribe();
  }, [user, chatContext]);
  
  // Listen for nearby player updates from the game scene
  useEffect(() => {
    const handleNearbyPlayer = (player: NearbyPlayer | null) => {
      // Only handle proximity updates if we're not in a manual DM
      if (!manualDmUser && player?.id !== nearbyPlayer?.id) {
        setNearbyPlayer(player);
      }
    };
    
    EventBus.on('nearby-player', handleNearbyPlayer);
    return () => {
      EventBus.off('nearby-player', handleNearbyPlayer);
    };
  }, [manualDmUser, nearbyPlayer]);
  
  // Scroll to bottom only when new messages arrive and we're at the bottom
  useEffect(() => {
    if (isChatCollapsed || !shouldAutoScroll) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages.length, isChatCollapsed, shouldAutoScroll]);
  
  // Save collapsed states to localStorage
  useEffect(() => {
    localStorage.setItem('chat-collapsed', JSON.stringify(isChatCollapsed));
    localStorage.setItem('users-collapsed', JSON.stringify(isUsersCollapsed));
    localStorage.setItem('instructions-collapsed', JSON.stringify(isInstructionsCollapsed));
  }, [isChatCollapsed, isUsersCollapsed, isInstructionsCollapsed]);
  
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

  const switchToDm = useCallback((dmUser: DmUser) => {
    setManualDmUser(dmUser);
    setNearbyPlayer(null);
    setSearchTerm('');
    setIsSearching(false);
  }, []);

  const returnToPublicChat = useCallback(() => {
    setManualDmUser(null);
    setNearbyPlayer(null);
  }, []);
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker && 
          emojiButtonRef.current && 
          !emojiButtonRef.current.contains(event.target as Node) &&
          !(event.target as Element)?.closest('.EmojiPickerReact')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const onEmojiClick = useCallback((emojiData: EmojiClickData) => {
    const cursor = inputRef.current?.selectionStart || inputValue.length;
    const newValue = inputValue.slice(0, cursor) + emojiData.emoji + inputValue.slice(cursor);
    setInputValue(newValue);
    setShowEmojiPicker(false);
    // Focus back on input and place cursor after emoji
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursor + emojiData.emoji.length, cursor + emojiData.emoji.length);
      }
    });
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    handleSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2">
      {/* Instructions Section */}
      <div className="w-80 bg-[rgba(30,30,50,0.9)] backdrop-blur-sm border border-[rgba(217,70,239,0.3)] rounded-lg shadow-lg overflow-hidden">
        <button
          onClick={() => setIsInstructionsCollapsed(!isInstructionsCollapsed)}
          className="w-full p-2 flex items-center justify-between bg-[rgba(30,30,50,0.8)] hover:bg-[rgba(217,70,239,0.2)] transition-colors"
        >
          <span className="font-medium text-[#d946ef]">Welcome to HackerHouse AI!</span>
          <span className="text-sm text-[#d946ef] opacity-50">
            {isInstructionsCollapsed ? '▼' : '▲'}
          </span>
        </button>

        <div className={`transition-all duration-200 overflow-hidden ${isInstructionsCollapsed ? 'h-0' : ''}`}>
          <div className="p-4 text-white space-y-2">
            <p className="text-[rgba(217,70,239,0.9)]">Here are some things you should know:</p>
            <ul className="list-disc list-inside space-y-1 text-[rgba(255,255,255,0.9)]">
              <li>Use <span className="text-[#d946ef] font-medium">WASD</span> to move</li>
              <li>Walk up to people or meeting rooms to talk to them</li>
              <li>Select a character skin in the settings menu up top</li>
              <li>And don't forget to enable notifications so you know when other hackers are hitting you up</li>
              <li>Pick a desk to sit at and wait for friends — first come, first serve</li>
            </ul>
            <p className="text-[#d946ef] font-medium mt-4">Happy chatting!</p>
          </div>
        </div>
      </div>

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
            <div 
              ref={messageListRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-[rgba(217,70,239,0.5)] scrollbar-track-transparent hover:scrollbar-thumb-[rgba(217,70,239,0.7)]"
            >
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
            <div className="p-2 border-t border-[rgba(217,70,239,0.3)] relative">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-[rgba(217,70,239,0.7)] hover:text-[#d946ef] transition-colors"
                >
                  😊
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  name="message"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={chatContext.type === 'dm' && chatContext.partner ? `Message ${chatContext.partner.name}...` : "Type a message..."}
                  className="flex-1 p-2 rounded bg-[rgba(30,30,50,0.8)] border border-[rgba(217,70,239,0.3)] text-white placeholder-[rgba(217,70,239,0.5)] focus:border-[rgba(217,70,239,0.5)] focus:outline-none"
                />
              </form>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2">
                  <EmojiPicker
                    theme={Theme.DARK}
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    width={320}
                    height={400}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 