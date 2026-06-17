import axios from 'axios';

// --- NEW: Dynamic Base URL ---
// Uses the production URL if deployed, or localhost during local development.
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
});

// --- UI HELPER: Native Toast Notification ---
const showRateLimitToast = (message) => {
  // Prevent duplicate toasts if they are spamming clicks
  if (document.getElementById('rate-limit-toast')) return;

  const toast = document.createElement('div');
  toast.id = 'rate-limit-toast';
  toast.className = 'fixed bottom-5 right-5 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl font-bold text-sm z-[9999] transform translate-y-20 opacity-0 transition-all duration-300 flex items-center gap-3';
  toast.innerHTML = `
    <span class="text-xl">🚨</span> 
    ${message}
  `;

  document.body.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-20', 'opacity-0');
  }, 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 4000);
};

// 1. REQUEST INTERCEPTOR (Auth)
API.interceptors.request.use((req) => {
  const profile = localStorage.getItem('campusProfile');
  if (profile) {
    const parsedProfile = JSON.parse(profile);
    if (parsedProfile.token) {
      req.headers.Authorization = `Bearer ${parsedProfile.token}`;
    }
  }
  return req;
}, (error) => {
  return Promise.reject(error);
});

// 2. RESPONSE INTERCEPTOR (Error Handling & Rate Limits)
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is our Rate Limiter (Status 429)
    if (error.response && error.response.status === 429) {
      const serverMessage = error.response.data.message || 'Too many requests. Please slow down.';
      showRateLimitToast(serverMessage);
      
      // We reject the promise so your component's try/catch blocks still work,
      // but the UI has already been handled gracefully above.
      return Promise.reject(error);
    }

    // Handle Network Drops
    if (!error.response) {
      console.error('🚨 Network Error Detected');
      return Promise.reject({ 
        response: { data: { message: "Network Error: Please check your internet connection." } } 
      });
    }
    
    return Promise.reject(error);
  }
);

export default API;