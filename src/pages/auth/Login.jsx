import { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import BrandLogo from '../../components/common/BrandLogo';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Send credentials across the bridge to the Express backend
      const { data } = await API.post('/auth/login', formData);
      
      // Securely store the user profile and JWT token
      localStorage.setItem('campusProfile', JSON.stringify(data));
      
      // Redirect to the discovery feed
      navigate('/');
    } catch (err) {
      // Catch backend validation errors (like the strict @dtu.ac.in domain rule)
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans tracking-tight">
      {/* Left Side - The Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          
          {/* INJECTED OFFICIAL BRAND LOGO HERE */}
          <BrandLogo theme="light" className="mb-12" />

          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Welcome back.</h1>
          <p className="text-gray-500 font-medium mb-8">Log in to your campus marketplace account.</p>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">College Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="name@dtu.ac.in" 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:bg-white transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-action hover:bg-brand-actionHover text-white py-4 rounded-xl font-bold text-[15px] shadow-md transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Sign In</>}
            </button>
          </form>

          {/* Sign Up Link Footer */}
          <div className="mt-10 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-brand-link hover:text-brand-accent transition-colors">
                Sign Up
              </Link>
            </p>
          </div>
          
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-brand-dark p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract background pattern for premium feel */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-max flex items-center gap-4 mb-8">
            <ShieldCheck className="w-8 h-8 text-brand-accent" />
            <div>
              <p className="text-white font-bold tracking-tight">Zero-Trust Verification</p>
              <p className="text-gray-400 text-sm font-medium">Restricted to active students only.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl font-black text-white tracking-tight leading-tight mb-6">
            The safest way to buy, sell, and trade on campus.
          </h2>
          <p className="text-lg text-gray-400 font-medium leading-relaxed">
            Join thousands of students trading textbooks, notes, and gear without the friction of public marketplaces.
          </p>
        </div>
      </div>

    </div>
  );
}