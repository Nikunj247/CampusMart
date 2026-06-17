import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Zap, ArrowRight, ShoppingBag } from 'lucide-react';
import BrandLogo from '../components/common/BrandLogo';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white font-sans tracking-tight flex flex-col overflow-x-hidden">
      
      {/* --- CUSTOM ANIMATIONS --- */}
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse-slow {
            0%, 100% { opacity: 0.1; transform: scale(1); }
            50% { opacity: 0.2; transform: scale(1.05); }
          }
          
          .animate-float { animation: float 4s ease-in-out infinite; }
          .animate-fade-up { animation: fadeUp 0.8s ease-out forwards; opacity: 0; }
          .animate-bg-pulse { animation: pulse-slow 8s ease-in-out infinite; }
          
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }
          .delay-400 { animation-delay: 400ms; }
        `}
      </style>

      {/* Navbar Minimal */}
      <nav className="bg-brand-dark h-16 flex items-center justify-between px-6 md:px-12 w-full z-50">
        
        {/* INJECTED NEW BRAND LOGO HERE */}
        <BrandLogo theme="dark" />

        <div className="flex gap-4">
          <Link to="/login" className="text-white font-bold text-sm px-4 py-2 hover:text-gray-300 transition-colors">
            Login
          </Link>
          <Link to="/register" className="bg-brand-action hover:bg-brand-actionHover text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm hover:-translate-y-0.5">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-brand-dark text-white relative flex-1 flex flex-col justify-center py-20 lg:py-32">
        
        {/* Animated Background Blob */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[140%] rounded-full bg-gradient-to-br from-brand-action to-purple-600 blur-[120px] animate-bg-pulse"></div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center">
          
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-xs font-bold tracking-wider uppercase mb-6 text-gray-300 animate-fade-up">
            Official Delhi Technological University Network
          </span>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[1.1] animate-fade-up delay-100">
            Buy and sell within the <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              DTU Campus.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium mb-10 leading-relaxed animate-fade-up delay-200">
            The exclusive marketplace for verified students. Unload your old textbooks, upgrade your tech, and furnish your hostel without the hassle of public marketplaces.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <Link to="/register" className="w-full sm:w-auto bg-brand-action hover:bg-brand-actionHover text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-brand-action/30 flex items-center justify-center gap-2 group">
              Join the Marketplace <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-xl border border-white/10 backdrop-blur-sm transition-all flex items-center justify-center hover:-translate-y-1">
              Log In
            </Link>
          </div>

        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-24 bg-brand-light relative z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center animate-fade-up delay-100 group">
              <div className="w-16 h-16 bg-blue-50 text-brand-link rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors group-hover:bg-brand-link group-hover:text-white animate-float">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Verified Students Only</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Every user is verified via their official university ID. No spam, no outsiders, just your peers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center animate-fade-up delay-200 group">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors group-hover:bg-green-600 group-hover:text-white animate-float" style={{ animationDelay: '1s' }}>
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Real-Time Negotiation</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Connect directly with sellers through our blazing fast, built-in WebSocket messaging engine.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center animate-fade-up delay-300 group">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors group-hover:bg-orange-500 group-hover:text-white animate-float" style={{ animationDelay: '2s' }}>
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-100 mb-3">Zero Transaction Fees</h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                Keep 100% of your money. Negotiate the price, meet up on campus, and complete the trade.
              </p>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}