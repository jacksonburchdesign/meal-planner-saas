import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function TenantLayout() {
  return (
    <div className="relative min-h-screen bg-slate-50 font-sans text-slate-900 pb-[80px]">
      <Outlet />
      <BottomNav />
    </div>
  );
}
