import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Send, Loader2, MessageSquare, ArrowLeft, Search, Archive, Inbox as InboxIcon, AlertCircle, Trash2, AlertTriangle } from 'lucide-react';
import API from '../../api/axios';
import io from 'socket.io-client';

const ENDPOINT = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'; 
let socket, selectedChatCompare;

export default function Inbox() {
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('inbox'); 

  // --- NEW: MODAL STATES ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('campusProfile'));
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    socket = io(ENDPOINT, { transports: ['websocket', 'polling'] });
    socket.emit('setup', currentUser);
    socket.on('connected', () => setSocketConnected(true));

    const fetchInbox = async () => {
      try {
        const { data } = await API.get('/messages/inbox');
        let currentChats = data;

        if (location.state?.initiateChat) {
          const { item, seller } = location.state;
          const sellerId = seller._id || seller;

          const response = await API.post('/messages/conversation', { 
            itemId: item._id, 
            sellerId: sellerId,
            itemTitle: item.title 
          });
          
          const { conversation, isNew } = response.data;
          const isMissingFromSidebar = !currentChats.some(c => c._id === conversation._id);

          if (isMissingFromSidebar) {
            currentChats = [conversation, ...currentChats];
          }

          if (isNew) {
            setNewMessage(`Hi! Is "${item.title}" still available?`);
          } 

          setActiveChat(conversation);
          navigate('/inbox', { replace: true });
        }

        setConversations(currentChats);

      } catch (error) {
        console.error('Failed to load inbox');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInbox();
    return () => socket.disconnect();
  }, []); 

  useEffect(() => {
    if (activeChat) {
      selectedChatCompare = activeChat;
      const fetchMessages = async () => {
        try {
          const { data } = await API.get(`/messages/${activeChat._id}`);
          setMessages(data);
          await API.put(`/messages/${activeChat._id}/read`);
          window.dispatchEvent(new Event('chatRead'));
        } catch (error) {
          console.error(error);
        }
      };
      fetchMessages();
    }
  }, [activeChat]);

  useEffect(() => {
    const messageHandler = (newMessageRecieved) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.conversationId) {
        window.dispatchEvent(new Event('chatRead'));
      } else {
        setMessages((prev) => [...prev, newMessageRecieved]);
        API.put(`/messages/${activeChat._id}/read`).catch(console.error);
        window.dispatchEvent(new Event('chatRead'));
      }
    };
    socket.on('message recieved', messageHandler);
    return () => socket.off('message recieved', messageHandler);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    try {
      const receiverId = activeChat.participants.find(p => p._id !== currentUser._id)._id;
      const { data } = await API.post('/messages', {
        receiverId,
        itemId: activeChat.item?._id,
        text: newMessage
      });

      setNewMessage('');
      setMessages([...messages, data]); 

      socket.emit('new message', {
        ...data,
        conversation: activeChat,
        sender: currentUser
      });

      // Move chat to top of sidebar
      setConversations(prev => {
        const updated = prev.map(c => c._id === activeChat._id ? { ...c, lastMessage: { text: data.text } } : c);
        return updated.sort((a, b) => a._id === activeChat._id ? -1 : 0);
      });

    } catch (error) {
      console.error('Failed to send message');
    }
  };

  const handleToggleArchive = async () => {
    try {
      await API.put(`/messages/${activeChat._id}/archive`);
      const isCurrentlyArchived = activeChat.archivedBy?.includes(currentUser._id);
      
      setConversations(prev => prev.map(c => {
        if (c._id === activeChat._id) {
          const newArchivedBy = isCurrentlyArchived
            ? c.archivedBy.filter(id => id !== currentUser._id)
            : [...(c.archivedBy || []), currentUser._id];
          return { ...c, archivedBy: newArchivedBy };
        }
        return c;
      }));

      setActiveChat(null);
      window.dispatchEvent(new Event('chatRead'));
    } catch (error) {
      console.error("Failed to toggle archive status");
    }
  };

  // --- NEW: MODAL CONFIRM DELETE ---
  const confirmDeleteChat = async () => {
    setIsDeleting(true);
    try {
      await API.delete(`/messages/${activeChat._id}`);
      setConversations(conversations.filter(c => c._id !== activeChat._id));
      setActiveChat(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete chat", error);
      alert("Could not delete chat. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredConversations = conversations.filter(chat => {
    const isArchived = chat.archivedBy?.includes(currentUser._id);
    const matchesView = viewMode === 'archived' ? isArchived : !isArchived;

    const otherUser = chat.participants.find(p => p._id !== currentUser._id);
    const matchesSearch = 
      otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      chat.item?.title.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesView && matchesSearch;
  });

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand-accent" /></div>;

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-6 h-[calc(100vh-115px)] flex gap-6 relative">
      
      {/* --- DELETE CHAT WARNING MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Delete Conversation?</h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
              This will permanently remove the chat from your inbox. The other user will still be able to see their copy of the messages.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteChat}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete It"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDE: INBOX LIST */}
      <div className={`w-full md:w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-black text-gray-900 tracking-tight mb-4">Messages</h2>
          
          <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
            <button 
              onClick={() => setViewMode('inbox')}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'inbox' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <InboxIcon className="w-4 h-4" /> Active
            </button>
            <button 
              onClick={() => setViewMode('archived')}
              className={`flex-1 py-1.5 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Archive className="w-4 h-4" /> Archived
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent font-medium"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium text-sm">
                {searchQuery ? "No matching chats found." : viewMode === 'archived' ? "No archived chats." : "No messages yet. Start dealing!"}
              </p>
            </div>
          ) : (
            filteredConversations.map((chat) => {
              const otherUser = chat.participants.find(p => p._id !== currentUser._id);
              return (
                <div 
                  key={chat._id} 
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${activeChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-l-brand-accent' : ''}`}
                >
                  <p className="font-bold text-gray-900 text-sm">{otherUser?.name || 'Unknown User'}</p>
                  
                  <div className="text-xs font-medium mb-1 mt-0.5">
                    {chat.item ? (
                      <span className="text-brand-link">{chat.item.title}</span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> 
                        {chat.itemName || 'Deleted Item'} (Deleted)
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage?.text || 'No messages yet'}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDE: ACTIVE CHAT */}
      <div className={`w-full md:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-500 hover:text-gray-900">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-bold text-gray-900">{activeChat.participants.find(p => p._id !== currentUser._id)?.name}</h3>
                  
                  <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center">
                    Negotiating: 
                    {activeChat.item ? (
                      <span className="text-gray-700 ml-1 font-bold">{activeChat.item.title}</span>
                    ) : (
                      <div className="flex items-center ml-1">
                        <span className="text-gray-700 font-bold line-through opacity-70">
                          {activeChat.itemName || 'Deleted Item'}
                        </span>
                        <span className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ml-2 border border-red-100">
                          Deleted
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* --- ACTION BUTTONS --- */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleToggleArchive}
                  className="text-gray-500 hover:text-brand-accent transition-colors flex items-center gap-1.5 text-sm font-bold bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
                >
                  {activeChat.archivedBy?.includes(currentUser._id) ? (
                    <><InboxIcon className="w-4 h-4" /> Unarchive</>
                  ) : (
                    <><Archive className="w-4 h-4" /> Archive</>
                  )}
                </button>

                {/* --- UPDATED: TRIGGER MODAL INSTEAD OF ALERT --- */}
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete Conversation"
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center p-1.5 rounded-lg border border-transparent hover:border-red-100 shadow-sm bg-white"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Bubbles */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((m) => {
                const isMe = m.sender === currentUser._id || m.sender._id === currentUser._id;
                return (
                  <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-brand-accent text-white rounded-tr-none' : 'bg-gray-200 text-gray-900 font-medium rounded-tl-none'}`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white flex gap-3">
              <input 
                type="text" 
                value={newMessage} 
                onChange={(e) => setNewMessage(e.target.value)} 
                placeholder="Type a message..." 
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none"
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-brand-action hover:bg-brand-actionHover text-white px-5 rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}