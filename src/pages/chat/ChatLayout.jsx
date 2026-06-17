import { useState, useEffect, useRef } from 'react';
import { Search, Send, Image as ImageIcon, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import API from '../../api/axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'] 
});

export default function ChatLayout() {
  const userProfile = JSON.parse(localStorage.getItem('campusProfile'));

  // UI State
  const [sidebarWidth, setSidebarWidth] = useState(384);
  const isDragging = useRef(false);

  // Data State
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  
  const messagesEndRef = useRef(null);

  // --- 1. Fetch Inbox on Load ---
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await API.get('/chat');
        setChats(data);
      } catch (error) {
        console.error("Failed to fetch inbox", error);
      } finally {
        setIsLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  // --- 2. Handle Chat Selection, Mark as Read, & Socket Join ---
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessagesAndMarkRead = async () => {
      try {
        // 1. Fetch the messages
        const { data } = await API.get(`/chat/${activeChat._id}/messages`);
        setMessages(data);

        // 2. Tell backend to mark all these messages as "read"
        await API.put(`/chat/${activeChat._id}/read`);
        
        // 3. Fire the event to update the Navbar badge instantly!
        window.dispatchEvent(new Event('chatRead'));

      } catch (error) {
        console.error("Failed to load messages or mark as read", error);
      }
    };
    
    fetchMessagesAndMarkRead();
    socket.emit('join chat', activeChat._id);

  }, [activeChat]);

  // --- 3. WebSocket Listener ---
  useEffect(() => {
    const messageHandler = (incomingMessage) => {
      // If we are actively looking at this exact chat room when a message arrives
      if (activeChat && incomingMessage.conversationId === activeChat._id) {
        setMessages((prev) => [...prev, incomingMessage]);
        
        // Instantly mark it as read so the badge doesn't light up while we are chatting
        API.put(`/chat/${activeChat._id}/read`).catch(console.error);
        window.dispatchEvent(new Event('chatRead'));
      } else {
        // If we are looking at a DIFFERENT chat (or the inbox), just update the Navbar badge
        window.dispatchEvent(new Event('chatRead'));
      }
    };

    socket.on('message recieved', messageHandler);
    return () => socket.off('message recieved', messageHandler);
  }, [activeChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 4. Send Message Logic ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentText.trim() || !activeChat) return;

    const messageData = {
      conversationId: activeChat._id,
      text: currentText,
    };

    try {
      const { data } = await API.post('/chat/message', messageData);
      setMessages((prev) => [...prev, data]);
      socket.emit('new message', data);
      setCurrentText('');

      // Move this chat to the top of the sidebar locally
      setChats(prevChats => {
        const updatedChats = prevChats.map(c => 
          c._id === activeChat._id ? { ...c, lastMessage: data.text } : c
        );
        return updatedChats.sort((a, b) => a._id === activeChat._id ? -1 : 0);
      });

    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  // --- 5. Delete Chat Logic ---
  const handleDeleteChat = async () => {
    const confirmDelete = window.confirm("Are you sure you want to delete this conversation? This will remove it from your inbox.");
    if (!confirmDelete) return;

    try {
      await API.delete(`/chat/${activeChat._id}`);
      
      // Remove it from the sidebar visually
      setChats(chats.filter(c => c._id !== activeChat._id));
      // Close the active chat window
      setActiveChat(null);
      
    } catch (error) {
      console.error("Failed to delete chat", error);
      alert("Could not delete chat. Please try again.");
    }
  };

  // --- Dragger Logic ---
  const handleMouseDown = () => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    setSidebarWidth(Math.min(Math.max(e.clientX, 250), 600));
  };
  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  return (
    <div className="max-w-[1500px] mx-auto bg-white h-full flex border-x border-gray-200 font-sans">
      
      {/* Left Sidebar: Inbox */}
      <div style={{ width: `${sidebarWidth}px` }} className="flex flex-col flex-shrink-0 bg-gray-50/50">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4 tracking-tight">Inbox</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search messages..." className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-transparent rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-white transition-all font-medium" />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {isLoadingChats ? (
            <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-brand-link" /></div>
          ) : chats.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-medium text-sm">No conversations yet.</div>
          ) : (
            chats.map((chat) => {
              const otherPerson = chat.participants.find(p => p._id !== userProfile._id) || chat.participants[0];
              const isActive = activeChat?._id === chat._id;

              return (
                <div 
                  key={chat._id} 
                  onClick={() => setActiveChat(chat)}
                  className={`p-5 border-b border-gray-100 cursor-pointer flex gap-4 transition-colors ${isActive ? 'bg-white border-l-4 border-l-brand-link shadow-sm' : 'hover:bg-gray-100/50 border-l-4 border-l-transparent'}`}
                >
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold tracking-tight flex-shrink-0">
                    {otherPerson.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-gray-900 text-[15px] truncate">{otherPerson.name}</h4>
                    </div>
                    <p className="text-sm text-brand-accent font-semibold truncate mb-1">{chat.item?.title || 'Deleted Item'}</p>
                    <p className="text-xs text-gray-500 truncate font-medium">
                      {typeof chat.lastMessage === 'string' ? chat.lastMessage : chat.lastMessage?.text || 'Start a conversation'}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Dragger */}
      <div onMouseDown={handleMouseDown} className="w-1.5 bg-gray-200 hover:bg-brand-link cursor-col-resize transition-colors flex-shrink-0 relative z-50 group">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-1 h-1 bg-white rounded-full shadow-sm"></div>
          <div className="w-1 h-1 bg-white rounded-full shadow-sm"></div>
          <div className="w-1 h-1 bg-white rounded-full shadow-sm"></div>
        </div>
      </div>

      {/* Right Pane: Active Chat Window */}
      <div className="hidden md:flex flex-1 flex-col bg-brand-bg relative min-w-[400px]">
        
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900">Your Messages</h2>
            <p className="font-medium mt-1">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-24 bg-white border-b border-gray-200 px-8 flex items-center justify-between z-10 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center p-1">
                  <img src={activeChat.item?.images?.[0] || 'https://via.placeholder.com/150'} alt="Item" className="max-w-full max-h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight text-[15px]">{activeChat.item?.title}</h3>
                  <p className="text-sm text-gray-500 font-medium">Listed for ₹{activeChat.item?.price}</p>
                </div>
              </div>

              {/* THE NEW DELETE BUTTON */}
              <button 
                onClick={handleDeleteChat}
                title="Delete Conversation"
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 font-medium mt-10">Send a message to start negotiating!</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender._id === userProfile._id || msg.sender === userProfile._id;

                  if (!isMe) {
                    return (
                      <div key={msg._id} className="flex items-end gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                           {msg.sender.name ? msg.sender.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="bg-white border border-gray-200 text-gray-800 px-5 py-3.5 rounded-2xl rounded-bl-sm max-w-md shadow-sm">
                          <p className="text-[15px] font-medium leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg._id} className="flex items-end justify-end gap-3 mt-2">
                      <div className="bg-brand-link text-white px-5 py-3.5 rounded-2xl rounded-br-sm max-w-md shadow-sm">
                        <p className="text-[15px] font-medium leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="bg-white p-6 border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-brand-accent focus-within:bg-white transition-all shadow-sm">
                <button type="button" className="p-2.5 text-gray-400 hover:text-brand-link transition-colors rounded-lg">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input 
                  type="text" value={currentText} onChange={(e) => setCurrentText(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none focus:outline-none py-2.5 text-[15px] font-medium text-gray-900 placeholder-gray-400"
                />
                <button type="submit" disabled={!currentText.trim()} className="p-2.5 bg-brand-action text-white rounded-lg shadow-sm hover:bg-brand-actionHover transition-all disabled:opacity-50">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}