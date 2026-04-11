import { Link, useLocation } from 'react-router-dom';
import { Home, Book, Clock, List } from 'iconoir-react';
import { ActivePinterestImport } from '../recipe/ActivePinterestImport';

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { name: 'Hub', path: '/', icon: Home },
    { name: 'Recipes', path: '/recipes', icon: Book },
    { name: 'History', path: '/history', icon: Clock },
    { name: 'List', path: '/ingredients', icon: List },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 pb-[env(safe-area-inset-bottom)] z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary-600' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <div className={`p-1 rounded-full ${isActive ? 'bg-primary-50' : ''}`}>
                 <Icon className="w-6 h-6 stroke-[1.5]" />
              </div>
              <span className="text-[10px] font-medium tracking-wide">{item.name}</span>
            </Link>
          );
        })}
      </div>
      <ActivePinterestImport />
    </nav>
  );
}
