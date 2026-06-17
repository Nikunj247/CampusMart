import { Link } from 'react-router-dom';

export default function BrandLogo({ theme = 'dark', className = '' }) {
  const isDark = theme === 'dark';
  
  return (
    <Link to="/" className={`flex items-center gap-3 group flex-shrink-0 select-none ${className}`}>
      
      {/* DTU Crest Container - Premium floating effect */}
      <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white shadow-[0_0_15px_rgba(0,0,0,0.05)] p-1.5 flex items-center justify-center transition-all duration-300 group-hover:shadow-brand-accent/30 group-hover:-translate-y-0.5 border border-gray-100 z-10">
        <img src="/dtu-logo.png" alt="DTU Logo" className="w-full h-full object-contain" />
      </div>

      {/* Sleek Vertical Divider */}
      <div className={`w-px h-8 opacity-40 ${isDark ? 'bg-gradient-to-b from-transparent via-gray-400 to-transparent' : 'bg-gradient-to-b from-transparent via-gray-300 to-transparent'}`}></div>

      {/* Typographic Lockup */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center">
          <span className={`font-black text-xl md:text-2xl tracking-tighter leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Campus
          </span>
          <span className="font-black text-xl md:text-2xl tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-blue-500">
            Mart
          </span>
        </div>
        <span className={`text-[8.5px] font-bold tracking-[0.22em] uppercase mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Delhi Technological University
        </span>
      </div>

    </Link>
  );
}