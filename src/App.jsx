import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { WifiOff, AlertTriangle, ArrowLeft } from 'lucide-react';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Pages
import Feed from './pages/marketplace/Feed';
import ProductDetail from './pages/marketplace/ProductDetail';
import SellForm from './pages/marketplace/SellForm';
import ChatLayout from './pages/chat/ChatLayout';
import Profile from './pages/user/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Inbox from './pages/marketplace/Inbox';
import Landing from './pages/Landing';

// --- NEW: THE GLOBAL NETWORK SHIELD ---
const NetworkShield = ({ children }) => {
  // Initialize state based on current browser status
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <>
      {children}
      
      {/* THE LOCKOUT OVERLAY */}
      {isOffline && (
        <div className="fixed inset-0 z-[9999] bg-white/50 backdrop-blur-md flex items-center justify-center px-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-200 text-center animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <WifiOff className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">You are offline</h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
              Your network connection has been lost. The platform has been paused to prevent data loss. 
            </p>
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Waiting for connection...
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- NEW: PREMIUM 404 PAGE ---
const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 text-center font-sans">
    <div className="w-20 h-20 bg-gray-200 text-gray-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
      <AlertTriangle className="w-10 h-10" />
    </div>
    <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">404</h1>
    <h2 className="text-xl font-bold text-gray-700 mb-2">Page Not Found</h2>
    <p className="text-gray-500 font-medium max-w-md mx-auto mb-8">
      We looked everywhere, but the page you are trying to reach doesn't exist or has been moved.
    </p>
    <Link to="/" className="flex items-center gap-2 bg-brand-dark hover:bg-black text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-md hover:-translate-y-0.5">
      <ArrowLeft className="w-5 h-5" /> Return to Campus
    </Link>
  </div>
);

// --- ROUTE PROTECTORS ---
const RootRoute = () => {
  const user = JSON.parse(localStorage.getItem('campusProfile'));
  return user ? <MainLayout /> : <Landing />;
};

const AuthRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('campusProfile'));
  return user ? <Navigate to="/" replace /> : children;
};

const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('campusProfile'));
  return user ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      {/* Wrap the entire app in the Network Shield */}
      <NetworkShield>
        <Routes>
          
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />

          <Route path="/" element={<RootRoute />}>
            <Route index element={<Feed />} />
            <Route path="product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
            <Route path="sell" element={<ProtectedRoute><SellForm /></ProtectedRoute>} />
            <Route path="chat" element={<ProtectedRoute><ChatLayout /></ProtectedRoute>} />
            <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
          </Route>

          {/* Fallback Catch-All Route routes to our new 404 Component */}
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </NetworkShield>
    </BrowserRouter>
  );
}

export default App;