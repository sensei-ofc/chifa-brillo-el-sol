import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ToastContainer } from '../ui/ToastContainer';
import { cn } from '../ui/Button';

export function MainLayout() {
  const { user, userRole, isAuthReady, localGuest } = useAuthStore();
  const { isSidebarOpen, toggleSidebar } = useUIStore();

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // Show spinner only if we don't have any persisted state and auth is not ready
  if (!isAuthReady && !userRole && !localGuest) {
    return (
      <div className="flex h-screen items-center justify-center bg-ebony-light dark:bg-ebony-dark">
        <div className="w-16 h-16 border-4 border-gold-champagne border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Once auth is ready, if no user and no guest, redirect to login
  if (isAuthReady && !user && !localGuest) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-ebony-light dark:bg-ebony-dark text-silk-white-light dark:text-silk-white-dark font-sans transition-colors duration-300 overflow-x-hidden">
      <Sidebar />
      <ToastContainer />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <Navbar />
      
      <main className={cn(
        'pt-16 min-h-screen transition-all duration-300',
        isSidebarOpen ? 'lg:ml-64' : 'ml-0'
      )}>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl">
          <Outlet />
        </div>
        
        <footer className="p-8 mt-auto border-t border-black/5 dark:border-white/5 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono uppercase tracking-widest mb-2">
            Desarrollado por <span className="text-gold-champagne font-bold">Erik Misael</span>
          </p>
          <div className="flex justify-center space-x-4">
            <a 
              href="https://www.instagram.com/erik_16_qm?igsh=YzNyZnptMW1tNWw=" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-gray-400 hover:text-gold-champagne transition-colors"
            >
              INSTAGRAM
            </a>
            <span className="text-gray-700">•</span>
            <a 
              href="mailto:qmisael386@gmail.com" 
              className="text-[10px] text-gray-400 hover:text-gold-champagne transition-colors"
            >
              CORREO
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
