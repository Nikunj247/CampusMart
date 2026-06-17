import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Clock, Share2, Heart, MessageSquare, Loader2, Tag, AlertCircle, Trash2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { timeAgo } from '../../utils/formatTime';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const userProfile = JSON.parse(localStorage.getItem('campusProfile'));

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data } = await API.get(`/items/${id}`);
        setItem(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load item details. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (userProfile && userProfile.savedItems) {
      setIsSaved(userProfile.savedItems.includes(id));
    }
  }, [id, userProfile]);

  // --- UPGRADED: Silently route to inbox instead of auto-sending ---
  const handleMessageSeller = () => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    
    navigate('/inbox', {
      state: {
        initiateChat: true,
        item: item,
        seller: item.seller
      }
    });
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/items/${item._id}`);
      navigate('/'); 
    } catch (error) {
      console.error("Failed to delete item", error);
      alert("Could not delete the item.");
    }
  };

  const handleSaveItem = async () => {
    if (!userProfile) return navigate('/login');
    
    try {
      const { data } = await API.post(`/auth/save/${item._id}`);
      setIsSaved(!isSaved);
      
      const updatedProfile = { ...userProfile, savedItems: data };
      localStorage.setItem('campusProfile', JSON.stringify(updatedProfile));

      if (item && item.seller) {
        const sellerId = item.seller._id || item.seller;
        if (sellerId !== userProfile._id) { 
          window.dispatchEvent(new CustomEvent('triggerSocketNotification', { detail: sellerId }));
        }
      }
    } catch (error) {
      console.error("Failed to save item", error);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: item.title,
      text: `Check out this ${item.title} on CampusMart!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing the item:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center bg-brand-bg font-sans">
        <Loader2 className="w-12 h-12 animate-spin text-brand-link mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Loading item details...</h2>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center bg-brand-bg font-sans px-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
        <p className="text-gray-500 font-medium mb-6">{error}</p>
        <Link to="/" className="bg-brand-link text-white px-6 py-3 rounded-lg font-bold">Back to Feed</Link>
      </div>
    );
  }

  const isOwner = userProfile && (item.seller?._id === userProfile._id || item.seller === userProfile._id);
  
  const hasImages = item.images && item.images.length > 0;
  const displayImage = hasImages ? item.images[currentImageIndex] : 'https://via.placeholder.com/600';
  const showArrows = hasImages && item.images.length > 1;

  const nextImage = () => setCurrentImageIndex(prev => prev === item.images.length - 1 ? 0 : prev + 1);
  const prevImage = () => setCurrentImageIndex(prev => prev === 0 ? item.images.length - 1 : prev - 1);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10 font-sans tracking-tight">
      
      {/* --- UPGRADED: Breadcrumb Navigation --- */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-8">
        <Link to="/" className="hover:text-brand-link transition-colors">Home</Link>
        <span>/</span>
        
        <Link 
          to={`/?category=${encodeURIComponent(item.category)}`} 
          className="hover:text-brand-link transition-colors"
        >
          {item.category}
        </Link>
        
        <span>/</span>
        <span className="text-gray-900 truncate max-w-[200px]">{item.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
        
        {/* Left Side - Image Gallery / Carousel */}
        <div className="w-full lg:w-1/2">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl h-[500px] flex items-center justify-center p-8 overflow-hidden relative group">
            
            <img 
              src={displayImage} 
              alt={`${item.title} preview`} 
              className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-500"
            />

            {showArrows && (
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
                {currentImageIndex + 1} / {item.images.length}
              </div>
            )}

            {showArrows && (
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 hover:scale-105"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {showArrows && (
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2.5 rounded-full shadow-lg backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10 hover:scale-105"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="w-full lg:w-1/2 flex flex-col">
          
          {/* --- UPGRADED: Title & Price Section --- */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {item.category}
              </span>
            </div>
            
            <h1 className="text-4xl font-black text-gray-900 leading-tight mb-4">{item.title}</h1>
            
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-gray-900 mb-1 shrink-0">₹</span>
              {/* break-all forces massive numbers to wrap to the next line instead of breaking the white box */}
              <span className="text-5xl font-black text-gray-900 tracking-tighter break-all">
                {item.price?.toLocaleString()}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-lg leading-relaxed font-medium mb-8">
            {item.description}
          </p>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-900 text-white rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0">
                {item.seller?.name ? item.seller.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[17px] flex items-center gap-1.5">
                  {item.seller?.name || 'Verified Student'} 
                  <ShieldCheck className="w-5 h-5 text-brand-link" />
                </h3>
                <p className="text-sm text-gray-500 font-medium">
                  {item.seller?.department || 'DTU'} • Class of {item.seller?.gradYear || '2026'}
                </p>
              </div>
            </div>
            
            <div className="text-right hidden sm:block self-center">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-400 justify-end">
                <Clock className="w-4 h-4" /> Listed {timeAgo(item.createdAt)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-auto">
            {isOwner ? (
              <button 
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Delete Listing
              </button>
            ) : (
              <button 
                onClick={handleMessageSeller}
                className="flex-1 bg-brand-action hover:bg-brand-actionHover text-white font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-5 h-5" /> Message Seller
              </button>
            )}
            
            <button 
              onClick={handleSaveItem}
              className={`px-6 py-4 border border-gray-200 rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm ${isSaved ? 'bg-red-50 text-red-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Heart className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            
            <button 
              onClick={handleShare}
              className={`px-6 py-4 border border-gray-200 rounded-xl font-bold flex items-center justify-center transition-colors shadow-sm ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              title="Share this listing"
            >
              {copied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* --- CUSTOM DELETE MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
            
            <div className="flex items-start gap-4 mb-2">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="pt-1">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Delete Listing?</h3>
                <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">
                  Are you absolutely sure? This action cannot be undone and this item will be permanently removed from the marketplace.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-8">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3.5 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              
              <button 
                onClick={handleDelete} 
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm"
              >
                Yes, Delete it
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}