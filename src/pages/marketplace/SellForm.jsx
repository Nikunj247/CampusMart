import { useState, useRef, useEffect } from 'react';
import { UploadCloud, CheckCircle2, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

export default function SellForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- UPGRADED: Lazy load state from Local Storage ---
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('sellFormData');
    return saved ? JSON.parse(saved) : {
      title: '', price: '', category: '', description: '', condition: 'Very Good', meetupLocation: 'Library'
    };
  });

  const [images, setImages] = useState(() => {
    const savedImages = localStorage.getItem('sellFormImages');
    return savedImages ? JSON.parse(savedImages) : [];
  }); 
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // --- UPGRADED: Auto-save to Local Storage on every keystroke/upload ---
  useEffect(() => {
    localStorage.setItem('sellFormData', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('sellFormImages', JSON.stringify(images));
  }, [images]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const data = new FormData();
    data.append('image', file);

    try {
      const response = await API.post('/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setImages(prev => [...prev, response.data.imageUrl]);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCancel = () => {
    // 1. Wipe the saved draft from local storage
    localStorage.removeItem('sellFormData');
    localStorage.removeItem('sellFormImages');
    
    // 2. Redirect to the feed
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { ...formData, images };
      await API.post('/items', payload);
      
      // --- UPGRADED: Clear the storage ONLY on successful publish ---
      localStorage.removeItem('sellFormData');
      localStorage.removeItem('sellFormImages');
      
      navigate('/'); 
    } catch (error) {
      console.error(error);
      alert('Failed to create listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 font-sans tracking-tight">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tighter mb-2">List an Item</h1>
        <p className="text-gray-500 font-medium">Upload details and high-resolution images to the campus network.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        
        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Product Images</label>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />

          <div className="relative border-2 border-dashed border-gray-300 bg-gray-50 rounded-xl p-10 flex flex-col items-center justify-center">
            {isUploading ? (
              <div className="flex flex-col items-center text-brand-link">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold text-gray-900">Uploading to cloud...</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                  <UploadCloud className="w-8 h-8 text-brand-link" />
                </div>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()}
                  className="bg-white border border-gray-200 text-gray-900 font-bold py-2.5 px-6 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Browse Files
                </button>
              </>
            )}
          </div>

          {/* --- THUMBNAIL GRID --- */}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-6">
              {images.map((url, index) => (
                <div key={index} className="relative w-24 aspect-square shrink-0 group">
                  <img 
                    src={url} 
                    alt={`Upload ${index}`} 
                    className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2.5 -right-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md z-10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        

        {/* Text Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Listing Title</label>
            <input 
              type="text" required
              value={formData.title} // <-- ADDED value binding
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Price (₹)</label>
            <input 
              type="number" required
              min="0"
              value={formData.price} // <-- ADDED value binding
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === '+' || e.key === 'e') {
                  e.preventDefault();
                }
              }}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Category</label>
            <select 
              required
              value={formData.category} // <-- ADDED value binding (Replaced defaultValue)
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-accent focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Select a category</option>
              <option value="Books and Notes">Books and Notes</option>
              <option value="Electronics">Electronics</option>
              <option value="Hostel Essentials">Hostel Essentials</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-wider">Description</label>
          <textarea 
            rows="5" required
            value={formData.description} // <-- ADDED value binding
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-brand-accent focus:outline-none resize-none"
          ></textarea>
        </div>

        <div className="border-t border-gray-100 pt-8 flex items-center justify-between">
          
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 font-medium">
            <CheckCircle2 className="w-5 h-5 text-brand-link" />
            <span>Listing is free for active students</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={handleCancel}
              className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3.5 px-6 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || images.length === 0}
              className="flex-1 sm:flex-none bg-brand-action hover:bg-brand-actionHover text-white font-bold py-3.5 px-8 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>

        </div>

      </form>
    </div>
  );
}