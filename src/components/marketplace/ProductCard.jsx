import { Link, useNavigate } from 'react-router-dom';
import { timeAgo } from '../../utils/formatTime';

export default function ProductCard({ item }) {
  const navigate = useNavigate();
  
  // Get logged in user to check if this is our own item
  const userProfile = JSON.parse(localStorage.getItem('campusProfile'));
  
  // Safety fallbacks
  const displayImage = item.images && item.images.length > 0 
    ? item.images[0] 
    : 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&auto=format&fit=crop';

  // Check if the current user is the seller
  const isOwner = userProfile && (item.seller?._id === userProfile._id || item.seller === userProfile._id);

  // --- UPGRADED: Silently route to inbox instead of auto-sending ---
  const handleMessageSeller = (e) => {
    e.preventDefault(); // Prevents the card click from taking you to the details page
    
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

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
      <Link to={`/product/${item._id}`} className="bg-white p-6 flex items-center justify-center h-64 border-b border-gray-100 group">
        <img 
          src={displayImage} 
          alt={item.title} 
          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
        />
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link to={`/product/${item._id}`}>
          <h2 className="text-gray-900 hover:text-brand-link text-[15px] font-semibold leading-snug line-clamp-2 cursor-pointer mb-2 transition-colors">
            {item.title}
          </h2>
        </Link>

        <div className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wide flex flex-col gap-1">
          <span>Seller: <span className="text-brand-link">{item.seller?.name || 'Verified Student'}</span></span>
          <span className="text-[10px] text-gray-400">
            {item.seller?.department || 'DTU'} • Class of {item.seller?.gradYear || '2026'}
          </span>
        </div>

        {/* --- UPGRADED: Pricing Section --- */}
        <div className="flex items-end justify-between mt-auto mb-4">
          
          {/* min-w-0 allows the flex child to shrink, and truncate adds the '...' to massive numbers */}
          <div className="flex items-start min-w-0 mr-4">
            <span className="text-sm font-bold mt-1.5 mr-0.5 text-gray-900 shrink-0">₹</span>
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight truncate">
              {item.price?.toLocaleString()}
            </span>
          </div>
          
          <div className="flex flex-col items-end shrink-0">
            {/* Condition tag removed entirely. Time aligned nicely. */}
            <span className="text-[10px] font-medium text-gray-400 mb-1">
              {timeAgo(item.createdAt)}
            </span>
          </div>
        </div>

        {/* Dynamic Action Button */}
        {isOwner ? (
          <button 
            disabled
            className="w-full bg-gray-100 text-gray-500 text-sm font-bold py-3 rounded-lg border border-gray-200"
          >
            Your Listing
          </button>
        ) : (
          <button 
            onClick={handleMessageSeller}
            className="w-full bg-brand-action hover:bg-brand-actionHover text-white text-sm font-bold py-3 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
          >
            Message Seller
          </button>
        )}
      </div>
    </div>
  );
}