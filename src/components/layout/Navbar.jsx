import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, User, MessageSquare, LogOut } from 'lucide-react';
import API from '../../api/axios';
import BrandLogo from '../common/BrandLogo';

export default function Navbar() {
  const navigate = useNavigate();
  
  // Base Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  
  // --- AUTOCOMPLETE STATES ---
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef(null);

  // Other UI States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const notificationRef = useRef(null);
  
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  
  const currentUser = JSON.parse(localStorage.getItem('campusProfile'));

  useEffect(() => {
    if (!currentUser) return;

    const fetchUnreadCount = async () => {
      try {
        const { data } = await API.get('/messages/unread');
        setUnreadMessages(data.count || 0);
      } catch (error) {
        console.error("Failed to fetch unread count", error);
      }
    };
    fetchUnreadCount();

    const fetchNotifications = async () => {
      try {
        const { data } = await API.get('/notifications');
        setNotifications(data);
        const unreadCount = data.filter(n => !n.isRead).length;
        setUnreadNotifs(unreadCount);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
      }
    };
    fetchNotifications();

    const handleChatRead = () => fetchUnreadCount(); 
    window.addEventListener('chatRead', handleChatRead);

    import('socket.io-client').then(({ default: io }) => {
      const socket = io('http://localhost:5000');
      socket.emit('setup', currentUser);
      
      socket.on('message recieved', () => {
        fetchUnreadCount(); 
      });

      socket.on('new notification', () => {
        fetchNotifications();
      });

      const relayNotification = (e) => {
        const sellerId = e.detail;
        socket.emit('send notification', sellerId);
      };
      window.addEventListener('triggerSocketNotification', relayNotification);

      return () => {
        socket.disconnect();
        window.removeEventListener('chatRead', handleChatRead); 
        window.removeEventListener('triggerSocketNotification', relayNotification);
      };
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/read');
      setUnreadNotifs(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark read", error);
    }
  };

  // --- DEBOUNCED AUTOCOMPLETE LOGIC ---
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Clear previous timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!value.trim()) {
      setAutocompleteResults([]);
      setShowSuggestions(false);
      return;
    }

    // Ping the Trie engine 300ms after they stop typing
    debounceTimer.current = setTimeout(async () => {
      try {
        const { data } = await API.get(`/items/autocomplete?q=${value}`);
        setAutocompleteResults(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Autocomplete fetch failed", error);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    navigate(searchTerm || searchCategory ? `/?keyword=${searchTerm}&category=${searchCategory}` : '/');
  };

  const handleCategoryClick = (category) => {
    setSearchCategory(category);
    setSearchTerm(''); 
    navigate(category === 'All Categories' ? '/' : `/?category=${category}`);
  };

  const isCategoryActive = (category) => {
    return category === 'All Categories' ? (searchCategory === '' || searchCategory === 'All Categories') : searchCategory === category;
  };

  const confirmLogout = () => {
    localStorage.removeItem('campusProfile');
    navigate('/login');
  };

  return (
    <>
      <nav className="bg-brand-dark sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          
          <BrandLogo theme="dark" />

          {/* --- SEARCH BAR WRAPPER --- */}
          <div className="hidden md:block flex-1 max-w-2xl relative z-50">
            <form onSubmit={handleSearchSubmit} className="flex bg-white rounded-lg focus-within:ring-2 focus-within:ring-brand-accent transition-all shadow-inner relative z-10">
              
              <select 
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="bg-gray-50 border-r border-gray-200 text-gray-700 text-sm px-4 outline-none font-medium cursor-pointer rounded-l-lg"
              >
                <option value="">All Items</option>
                <option value="Books and Notes">Books and Notes</option>
                <option value="Electronics">Electronics</option>
                <option value="Hostel Essentials">Hostel Essentials</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
              
              <div className="flex-1 flex items-center relative">
                <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search textbooks, laptops, cycles..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => { if (autocompleteResults.length > 0) setShowSuggestions(true) }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm text-gray-900 outline-none font-medium placeholder:font-normal"
                />
              </div>
              <button type="submit" className="bg-brand-action hover:bg-brand-actionHover px-6 text-white font-bold text-sm transition-colors rounded-r-lg">Search</button>
            </form>

            {/* --- AUTOCOMPLETE DROPDOWN --- */}
            {showSuggestions && autocompleteResults.length > 0 && (
              <div className="absolute top-[105%] left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                {autocompleteResults.map((suggestion, idx) => (
                  <div 
                    key={idx}
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      setSearchTerm(suggestion);
                      setShowSuggestions(false);
                      navigate(searchCategory ? `/?keyword=${suggestion}&category=${searchCategory}` : `/?keyword=${suggestion}`); 
                    }}
                    className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-bold text-gray-900">{suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-5 flex-shrink-0">
            <Link to="/sell" className="hidden sm:flex items-center gap-1.5 bg-brand-action hover:bg-brand-actionHover text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
              <Plus className="w-4 h-4" /> List Item
            </Link>
            
            {/* Added tooltips to icons */}
            <Link to="/inbox" title="Inbox" className="text-gray-300 hover:text-white transition-colors relative group">
              <MessageSquare className="w-5 h-5" />
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-accent text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-dark shadow-sm">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <div className="relative flex items-center" ref={notificationRef}>
              <button 
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)} 
                className="text-gray-300 hover:text-white transition-colors relative group outline-none flex items-center"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-brand-dark"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-[calc(100%+16px)] right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    {unreadNotifs > 0 && (
                      <span onClick={handleMarkAllRead} className="text-[11px] text-brand-link cursor-pointer font-bold uppercase tracking-wider hover:underline">Mark Read</span>
                    )}
                  </div>
                  
                  {/* Container with max-height and scrollbar */}
                  <div className="max-h-[350px] overflow-y-auto bg-white">
                    {notifications.length === 0 ? (
                      <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                          <Bell className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-bold text-gray-900 mb-1">You're all caught up!</p>
                      </div>
                    ) : (
                      <>
                        {/* Removed the .slice(0, 5) limitation */}
                        {notifications.map((notif) => (
                          <div key={notif._id} className={`p-4 border-b border-gray-50 flex gap-3 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}>
                            <div className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0 bg-brand-accent opacity-80" style={{ visibility: notif.isRead ? 'hidden' : 'visible' }}></div>
                            <div>
                              <p className="text-sm text-gray-800 font-medium leading-snug">{notif.message}</p>
                              <p className="text-[11px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
                                {new Date(notif.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link to="/profile" title="Profile" className="text-gray-300 hover:text-white transition-colors group relative">
              <User className="w-5 h-5" />
            </Link>

            <button title="Log Out" onClick={() => setShowLogoutModal(true)} className="text-gray-300 hover:text-red-400 transition-colors relative group ml-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Sub Nav Bar */}
        <div className="bg-brand-light text-gray-300 px-6 py-2.5 flex items-center gap-6 text-sm font-medium overflow-x-auto border-b border-gray-800">
          <span onClick={() => handleCategoryClick('All Categories')} className={`hover:text-white cursor-pointer whitespace-nowrap transition-colors ${isCategoryActive('All Categories') ? 'text-brand-accent' : ''}`}>All Categories</span>
          <span onClick={() => handleCategoryClick('Books and Notes')} className={`hover:text-white cursor-pointer whitespace-nowrap transition-colors ${isCategoryActive('Books and Notes') ? 'text-brand-accent' : ''}`}>Books and Notes</span>
          <span onClick={() => handleCategoryClick('Electronics')} className={`hover:text-white cursor-pointer whitespace-nowrap transition-colors ${isCategoryActive('Electronics') ? 'text-brand-accent' : ''}`}>Electronics</span>
          <span onClick={() => handleCategoryClick('Hostel Essentials')} className={`hover:text-white cursor-pointer whitespace-nowrap transition-colors ${isCategoryActive('Hostel Essentials') ? 'text-brand-accent' : ''}`}>Hostel Essentials</span>
          <span onClick={() => handleCategoryClick('Miscellaneous')} className={`hover:text-white cursor-pointer whitespace-nowrap transition-colors ${isCategoryActive('Miscellaneous') ? 'text-brand-accent' : ''}`}>Miscellaneous</span>
        </div>
      </nav>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Log Out</h3>
                <p className="text-sm font-medium text-gray-500">Are you sure you want to log out?</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={confirmLogout} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">Log Out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}