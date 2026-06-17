import { useState } from 'react';
import { Mail, Lock, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import BrandLogo from '../../components/common/BrandLogo';

export default function Register() {
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [formData, setFormData] = useState({ 
    name: '', degree: '', department: '', gradYear: '', rollNumber: '', 
    email: '', password: '', confirmPassword: '' 
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend Domain Check
    if (!formData.email.endsWith('@dtu.ac.in')) {
      return setError("Only @dtu.ac.in emails are permitted.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match.");
    }
    
    setLoading(true);

    try {
      await API.post('/auth/register', formData);
      setStep(2); // Move straight to OTP screen
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      const { data } = await API.post('/auth/verify-otp', { email: formData.email, otp });
      localStorage.setItem('campusProfile', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans tracking-tight">
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 md:px-24 py-12 overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto">
          
          <BrandLogo theme="light" className="mb-10" />

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl flex flex-col gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" /> 
                <p>{error}</p>
              </div>
              {(error.includes('already registered') || error.includes('verified')) && (
                <Link to="/login" className="bg-white text-red-700 border border-red-200 hover:bg-red-50 text-center py-2.5 rounded-lg font-bold transition-all shadow-sm flex items-center justify-center gap-2">
                  Go to Login <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Join the network.</h1>
              <p className="text-gray-500 font-medium mb-8">Enter your academic details to get started.</p>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Full Name</label>
                  <input type="text" onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Degree</label>
                    <input type="text" required placeholder="B.Tech" onChange={(e) => setFormData({ ...formData, degree: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Department</label>
                    <input type="text" required placeholder="CSE" onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Roll Number</label>
                    <input type="text" required placeholder="2K24/XX/00" onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Grad Year</label>
                    <input type="number" required placeholder="2028" onChange={(e) => setFormData({ ...formData, gradYear: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">College Email Id</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                    <input type="email" required placeholder="name@dtu.ac.in" onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                      <input type="password" required minLength="6" placeholder="••••••••" onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                      <input type="password" required minLength="6" placeholder="••••••••" onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-brand-action hover:bg-brand-actionHover text-white py-4 rounded-xl font-bold text-[15px] shadow-md transition-all flex items-center justify-center gap-2 mt-6">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-4 h-4" /> Send Verification Code</>}
                </button>
              </form>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 font-medium">
                  Already have an account? <Link to="/login" className="font-bold text-brand-link hover:text-brand-accent transition-colors">Log In</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6"><CheckCircle2 className="w-8 h-8" /></div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">Check your email.</h1>
              <p className="text-gray-500 font-medium mb-8 leading-relaxed">We sent a 6-digit code to <span className="font-bold text-gray-900">{formData.email}</span>.</p>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Verification Code</label>
                  <input type="text" required maxLength="6" placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-black text-3xl tracking-[0.5em] text-center focus:ring-2 focus:ring-brand-accent focus:outline-none" />
                </div>
                <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-brand-action hover:bg-brand-actionHover text-white py-4 rounded-xl font-bold shadow-md flex items-center justify-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter Marketplace'}
                </button>
              </form>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Right Side - Branding */}
      <div className="hidden lg:flex w-1/2 bg-brand-dark p-12 flex-col justify-between relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl w-max flex items-center gap-4 mb-8">
            <ShieldCheck className="w-8 h-8 text-brand-accent" />
            <div>
              <p className="text-white font-bold tracking-tight">University Verified</p>
              <p className="text-gray-400 text-sm font-medium">Buy. Sell. Connect. Create your student account.</p>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-lg">
          <p className="text-4xl font-black text-white tracking-tight leading-tight mb-6">
            Your campus, 
            Your marketplace.
          </p>
          <p className="text-lg text-gray-400 font-medium leading-relaxed">
            Trade safely with verified peers on your own college network.
          </p>
        </div>
      </div>
    </div>
  );
}