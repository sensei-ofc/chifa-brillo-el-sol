import React, { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { Menu, Bell, Moon, Sun, X, Check } from 'lucide-react';
import { cn } from '../ui/Button';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { isSidebarOpen, toggleSidebar, isDarkMode, toggleDarkMode } = useUIStore();
  const { user } = useAuthStore();
  const { notifications, markAsRead, clearNotifications } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={cn(
      'fixed top-0 right-0 z-30 h-16 transition-all duration-300 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 flex items-center justify-between px-4 md:px-6',
      isSidebarOpen ? 'lg:left-64' : 'left-0'
    )}>
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 mr-2 md:mr-4 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-mono text-[10px] md:text-xs tracking-widest text-gray-500 dark:text-gray-400 uppercase truncate max-w-[120px] md:max-w-none">
          Sistema Imperial
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-dragon-red rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="fixed inset-x-4 top-16 mt-2 md:absolute md:right-0 md:left-auto md:inset-x-auto md:w-80 bg-white dark:bg-[#0a0a0a] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between">
                  <h3 className="font-bold text-sm">Notificaciones</h3>
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] text-gray-400 hover:text-dragon-red uppercase tracking-widest font-bold"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "p-4 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors",
                          !n.read ? "bg-dragon-red/5" : "opacity-60"
                        )}
                        onClick={() => markAsRead(n.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-xs mb-1">{n.title}</p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-2 uppercase tracking-tighter">
                              {new Date(n.timestamp).toLocaleString()}
                            </p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 bg-dragon-red rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center pl-4 border-l border-black/10 dark:border-white/10">
          <div className="w-8 h-8 rounded-full bg-gold-champagne/20 border border-gold-champagne flex items-center justify-center overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gold-champagne font-bold text-sm">
                {user?.displayName?.charAt(0) || 'I'}
              </span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
