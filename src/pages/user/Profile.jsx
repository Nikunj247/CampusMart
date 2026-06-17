import { useState, useEffect, useRef } from 'react';
import { Settings, ShieldCheck, MapPin, Package, Heart, Star, Loader2, X, Zap, Check, Camera, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../components/marketplace/ProductCard';
import API from '../../api/axios';

export default function Profile() {
  const navigate = useNavigate();

  // We make userProfile a state variable so the UI updates instantly when we edit it
  const [userProfile, setUserProfile] = useState(JSON.parse(localStorage.getItem('campusProfile')));
  
  // Tab State
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'saved'
  
  // Data State
  const [activeListings, setActiveListings] = useState([]);
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [savedCount, setSavedCount] = useState(0);
  
  // Wishlist State
  const [newKeyword, setNewKeyword] = useState('');
  const [isUpdatingWishlist, setIsUpdatingWishlist] = useState(false);
  const [profileData, setProfileData] = useState(JSON.parse(localStorage.getItem('campusProfile')));

  const handleWishlistUpdate = async (keyword, action) => {
    if (!keyword.trim()) return;
    setIsUpdatingWishlist(true);
    
    try {
      const { data } = await API.put('/auth/wishlist', { keyword, action });
      
      const updatedLocalProfile = { ...profileData, wishlist: data.wishlist };
      localStorage.setItem('campusProfile', JSON.stringify(updatedLocalProfile));
      setProfileData(updatedLocalProfile);
      
      setNewKeyword('');
    } catch (error) {
      console.error("Failed to update wishlist");
    } finally {
      setIsUpdatingWishlist(false);
    }
  };

  useEffect(() => {
    const fetchSavedCount = async () => {
      try {
        const { data } = await API.get('/auth/saved'); 
        setSavedCount(data.length);
      } catch (error) {
        console.error("Failed to fetch saved items count");
      }
    };
    fetchSavedCount();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'active') {
          const { data } = await API.get('/items/me');
          setActiveListings(data);
        } else if (activeTab === 'saved') {
          const { data } = await API.get('/auth/saved');
          setSavedItems(data);
        }
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await API.put('/auth/profile', editForm);
      const updatedProfile = { ...userProfile, ...data };
      
      localStorage.setItem('campusProfile', JSON.stringify(updatedProfile));
      setUserProfile(updatedProfile);
      setIsEditing(false); 
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const AVAILABLE_FLAIRS = [
    'Hostel Survivor', 'Day Scholar', 'Midnight Coder', 'LeetCode Grinder',
    'MERN Stack Ninja', 'Hackathon Hustler', 'Startup Founder', 'UI/UX Wizard',
    'Math & Stats Geek', 'Hardware Modder', 'Content Creator', 'Esports Athlete',
    'Story-Game Buff', 'Anime Lover', 'Library Ghost', 'Society President',
    'Gym Rat', 'Gadget Reviewer', 'CP Enthusiast', 'Singer', 'Dancer',
    'Fitness Freak', 'Video Editor', 'Doom Scroller', 'Chess Grandmaster',
  ];

  const [editForm, setEditForm] = useState({
    bio: profileData?.bio || '',
    flairs: profileData?.flairs || [], 
    avatar: profileData?.avatar || ''
  });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const response = await API.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setEditForm(prev => ({ ...prev, avatar: response.data.imageUrl }));
      await handleProfileSave({ ...editForm, avatar: response.data.imageUrl });
    } catch (error) {
      console.error('Avatar upload failed', error);
      alert('Failed to upload image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleProfileSave = async (dataToSave = editForm) => {
    try {
      const { data } = await API.put('/auth/profile', dataToSave);
      
      const updatedLocalProfile = { ...profileData, ...data };
      localStorage.setItem('campusProfile', JSON.stringify(updatedLocalProfile));
      setProfileData(updatedLocalProfile);
      
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Could not save profile updates.");
    }
  };

  const toggleFlair = (flair) => {
    setEditForm(prev => {
      const current = prev.flairs || [];
      if (current.includes(flair)) {
        return { ...prev, flairs: current.filter(f => f !== flair) };
      } else {
        if (current.length >= 3) return prev;
        return { ...prev, flairs: [...current, flair] };
      }
    });
  };

  const handleRemoveAvatar = async () => {
    setEditForm(prev => ({ ...prev, avatar: '' }));
    await handleProfileSave({ ...editForm, avatar: '' });
  };

  // --- DELETE ACCOUNT HANDLER ---
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await API.delete('/auth/profile');
      localStorage.removeItem('campusProfile');
      navigate('/login');
    } catch (error) {
      console.error("Failed to delete account", error);
      setIsDeleting(false);
      setShowDeleteModal(false);
      alert("Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-8 font-sans relative">
      
      {/* --- DELETE ACCOUNT MODAL --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Are you absolutely sure?</h2>
            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
              This action cannot be undone. This will permanently delete your CampusMart account, remove your identity from the network, and erase all your active listings.
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
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete It"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT PROFILE MODAL --- */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" required value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:bg-white focus:outline-none transition-all"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Department</label>
                  <input 
                    type="text" required value={editForm.department}
                    onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:bg-white focus:outline-none transition-all"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Grad Year</label>
                  <input 
                    type="number" required value={editForm.gradYear}
                    onChange={(e) => setEditForm({...editForm, gradYear: e.target.value})}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:bg-white focus:outline-none transition-all text-center"
                  />
                </div>
              </div>
              
              <button 
                type="submit" disabled={isSaving}
                className="w-full bg-brand-action hover:bg-brand-actionHover text-white py-3.5 rounded-xl font-bold text-[15px] shadow-md transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- PREMIUM PROFILE HEADER --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-8 relative">
          
          <div className="h-32 bg-gradient-to-r from-brand-dark to-brand-accent w-full"></div>
          
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-16 mb-6">
              
              <div className="relative group">
                <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl relative z-0">
                  {isUploadingAvatar ? (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-link" />
                    </div>
                  ) : editForm.avatar || profileData?.avatar ? (
                    <img 
                      src={editForm.avatar || profileData?.avatar} 
                      alt="Profile" 
                      className="w-full h-full rounded-full aspect-square object-cover object-center" 
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-dark text-white font-black text-4xl flex items-center justify-center rounded-full">
                      {profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </div>
                
                <div className="absolute -bottom-2 -right-2 flex items-center gap-1.5 z-10">
                  <label className="bg-brand-action hover:bg-brand-actionHover text-white p-2.5 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center border-2 border-white">
                    <Camera className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>

                  {(editForm.avatar || profileData?.avatar) && (
                    <button 
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="bg-red-500 hover:bg-red-600 text-white p-2.5 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center border-2 border-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <div className="space-y-6 animate-in fade-in duration-300 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bio</label>
                  <textarea 
                    value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})}
                    placeholder="e.g., Building MERN apps, grinding LeetCode..."
                    rows="2"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-brand-accent outline-none resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">User Flairs (Max 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_FLAIRS.map(flair => {
                      const isSelected = editForm.flairs?.includes(flair);
                      return (
                        <button
                          key={flair} type="button" onClick={() => toggleFlair(flair)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${isSelected ? 'bg-brand-link text-white border-brand-link' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                        >
                          {flair}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setIsEditingProfile(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={() => handleProfileSave()} className="flex-1 bg-brand-action hover:bg-brand-actionHover text-white font-bold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2 mb-1">
                  {profileData?.name} <ShieldCheck className="w-6 h-6 text-brand-link" />
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-gray-500 mb-4">
                  {profileData?.gradYear ? (
                    <span className="text-gray-900 font-bold bg-gray-100 px-2.5 py-0.5 rounded-md">Class of {profileData.gradYear}</span>
                  ) : null}
                  {profileData?.rollNumber ? (
                    <span className="text-gray-600">Roll: {profileData.rollNumber}</span>
                  ) : null}
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> DTU Campus</span>
                  <span>•</span>
                  <span>{profileData?.email}</span>
                </div>

                {profileData?.bio && (
                  <p className="text-gray-600 font-medium leading-relaxed max-w-2xl mb-6">
                    {profileData.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {profileData?.flairs && profileData.flairs.length > 0 ? (
                    profileData.flairs.map((flair, idx) => (
                      <span key={idx} className="bg-blue-50 text-brand-link border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {flair}
                      </span>
                    ))
                  ) : (
                    <span className="bg-gray-50 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                      Verified Student
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      {/* --- SMART MATCHMAKER WISHLIST --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-brand-accent" /> 
              Smart Matchmaker
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Add keywords for rare items. We will instantly notify you the second someone lists a matching item.
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <form 
            onSubmit={(e) => { 
              e.preventDefault(); 
              handleWishlistUpdate(newKeyword, 'add'); 
              setNewKeyword('');
            }} 
            className="flex gap-3"
          >
            <input 
              type="text" 
              value={newKeyword} 
              onChange={(e) => setNewKeyword(e.target.value)} 
              placeholder="e.g., Raspberry Pi, Casio fx-991EX..." 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-accent focus:outline-none transition-all font-medium"
            />

            <button 
              type="submit" 
              disabled={isUpdatingWishlist || !newKeyword.trim()}
              className="bg-brand-dark hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
            >
              Add Alert
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          {!profileData?.wishlist || profileData.wishlist.length === 0 ? (
            <span className="text-sm text-gray-400 font-medium italic">No active alerts. Add a keyword above!</span>
          ) : (
            profileData.wishlist.map((tag, index) => (
              <div key={index} className="bg-blue-50 border border-blue-100 text-brand-link px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 group transition-all hover:bg-blue-100">
                {tag}
                <button 
                  onClick={() => handleWishlistUpdate(tag, 'remove')}
                  className="text-blue-300 hover:text-red-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="flex flex-col md:flex-row gap-10 mt-10">
        
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm sticky top-6">
            <nav className="space-y-1.5">
              <button 
                onClick={() => setActiveTab('active')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'active' ? 'bg-gray-50 text-brand-link' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Package className="w-5 h-5" /> Active Listings ({activeListings.length})
              </button>
              <button 
                onClick={() => setActiveTab('saved')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'saved' ? 'bg-gray-50 text-brand-link' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <Heart className={`w-5 h-5 ${activeTab === 'saved' ? 'text-brand-link' : 'text-gray-400'}`} /> 
                Saved Items ({savedCount})
              </button>
            </nav>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {activeTab === 'active' ? 'Your Active Listings' : 'Your Saved Items'}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-link" /></div>
          ) : activeTab === 'active' && activeListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeListings.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          ) : activeTab === 'saved' && savedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedItems.map((item) => (
                <ProductCard key={item._id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
              <p className="text-gray-500 font-medium">
                {activeTab === 'active' ? "You haven't listed any items yet." : "You haven't saved any items yet."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- DANGER ZONE --- */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-black text-red-600 mb-2">Danger Zone</h3>
        <p className="text-sm text-gray-500 font-medium mb-5">
          Once you delete your account, there is no going back. All your listings, messages, and saved items will be wiped.
        </p>
        <button 
          onClick={() => setShowDeleteModal(true)}
          className="bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" />
          Delete Account
        </button>
      </div>

    </div>
  );
}