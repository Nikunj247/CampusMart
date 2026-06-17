import { Home, Search, PlusSquare, MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/sell', icon: PlusSquare, label: 'Sell', isAction: true },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-[var(--border)] pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-[var(--accent)]' : 'text-gray-500'}`}
            >
              <Icon className={`${item.isAction ? 'h-8 w-8 stroke-[1.5px]' : 'h-6 w-6'}`} />
              {!item.isAction && <span className="text-[10px] mt-1 font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}