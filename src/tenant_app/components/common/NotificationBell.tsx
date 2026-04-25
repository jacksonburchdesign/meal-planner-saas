import { useState, useRef, useEffect } from 'react';
import { Bell } from 'iconoir-react';
import { useNotifications } from '../../hooks';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    setIsOpen(false);
    
    if (notification.type === 'connection_request' || notification.type === 'recipe_shared') {
      navigate('/connections');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center text-zinc-400 hover:text-zinc-900 transition-colors p-2 rounded-full hover:bg-zinc-100"
        title="Notifications"
      >
        <Bell className="w-5 h-5 stroke-[2.5]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-zinc-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[12px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 font-medium text-[14px]">
                You're all caught up!
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {notifications.map(notif => (
                  <div 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 cursor-pointer hover:bg-zinc-50 transition-colors ${!notif.read ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${!notif.read ? 'bg-primary-100 text-primary-600' : 'bg-zinc-100 text-zinc-500'}`}>
                        <Bell className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div>
                        <h4 className={`text-[14px] font-bold ${!notif.read ? 'text-zinc-900' : 'text-zinc-700'}`}>
                          {notif.title}
                        </h4>
                        <p className={`text-[13px] mt-0.5 leading-snug ${!notif.read ? 'text-zinc-600 font-medium' : 'text-zinc-500'}`}>
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
