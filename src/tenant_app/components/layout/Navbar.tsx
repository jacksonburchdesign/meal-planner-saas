import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon as HomeOutline, 
  BookOpenIcon as BookOutline, 
  ClockIcon as ClockOutline, 
  ClipboardDocumentListIcon as ListOutline, 
  UserGroupIcon as GroupOutline 
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeSolid, 
  BookOpenIcon as BookSolid, 
  ClockIcon as ClockSolid, 
  ClipboardDocumentListIcon as ListSolid, 
  UserGroupIcon as GroupSolid 
} from '@heroicons/react/24/solid';
import { ActivePinterestImport } from '../recipe/ActivePinterestImport';
import { useFamilySettings } from '../../hooks';

export function Navbar() {
  const location = useLocation();
  const { settings } = useFamilySettings();
  const tenantAccentColor = settings?.themeColor || '#10b981';

  const navItems = [
    { name: 'Hub', path: '/', iconOutline: HomeOutline, iconSolid: HomeSolid },
    { name: 'Recipes', path: '/recipes', iconOutline: BookOutline, iconSolid: BookSolid },
    { name: 'Connect', path: '/connections', iconOutline: GroupOutline, iconSolid: GroupSolid },
    { name: 'History', path: '/history', iconOutline: ClockOutline, iconSolid: ClockSolid },
    { name: 'List', path: '/ingredients', iconOutline: ListOutline, iconSolid: ListSolid },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 pb-[calc(env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-[60px] max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path));
          
          const Icon = isActive ? item.iconSolid : item.iconOutline;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors"
              style={isActive ? { color: tenantAccentColor } : { color: '#a8a29e' }} /* text-stone-400 */
            >
               <Icon className="w-6 h-6 mb-1" strokeWidth={isActive ? undefined : 1.5} />
               <span 
                 className={`text-xs ${isActive ? 'font-medium' : 'font-normal text-stone-500'}`}
               >
                 {item.name}
               </span>
            </Link>
          );
        })}
      </div>
      <ActivePinterestImport />
    </nav>
  );
}
