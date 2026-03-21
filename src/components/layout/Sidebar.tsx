import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/useUIStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { cn } from '../ui/Button';
import { 
  LayoutDashboard, MessageSquare, Menu as MenuIcon, BookOpen, 
  GraduationCap, User, Settings, Info, LogOut, X 
} from 'lucide-react';
import { ConfirmModal } from '../ui/ConfirmModal';

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useUIStore();
  const { logout, userRole } = useAuthStore();
  const { isQuizInProgress, setQuizInProgress } = useAppStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/chat', icon: MessageSquare, label: 'Marley IA' },
    { to: '/menu', icon: MenuIcon, label: 'Carta Digital' },
    { to: '/training', icon: GraduationCap, label: 'Entrenamiento' },
    { to: '/profile', icon: User, label: 'Perfil' },
    { to: '/users', icon: User, label: 'Usuarios', adminOnly: true },
    { to: '/config', icon: Settings, label: 'Configuración', adminOnly: true },
    { to: '/info', icon: Info, label: 'Info & Ayuda' },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || userRole === 'admin');

  const handleNavClick = (e: React.MouseEvent, to: string) => {
    const isActuallyInQuiz = isQuizInProgress && location.pathname === '/exam';
    
    if (isActuallyInQuiz) {
      e.preventDefault();
      setPendingNav(to);
      return;
    }
    
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  const confirmNav = () => {
    if (pendingNav) {
      setQuizInProgress(false);
      navigate(pendingNav);
      setPendingNav(null);
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    }
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen w-64 transition-transform bg-white dark:bg-black/90 border-r border-black/5 dark:border-white/10 overflow-y-auto custom-scrollbar',
      !isSidebarOpen && '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'
    )}>
      <div className="flex flex-col min-h-full">
        <div className="p-6 flex flex-col items-center border-b border-black/5 dark:border-white/10 relative shrink-0">
          <button 
            onClick={toggleSidebar}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden border border-white/10">
            <img src="https://e.top4top.io/p_372983lw41.jpg" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="font-heading text-xl font-bold text-center">CHIFA<br/><span className="gold-text">BRILLO EL SOL</span></h1>
        </div>

        <div className="py-4 px-3 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={(e) => handleNavClick(e, item.to)}
              className={({ isActive }) => cn(
                'flex items-center px-4 py-3 rounded-xl transition-all duration-200 group',
                isActive 
                  ? 'bg-dragon-red/10 text-dragon-red dark:text-gold-champagne dark:bg-gold-champagne/10 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="mt-auto p-4 border-t border-black/5 dark:border-white/10 shrink-0">
          <button 
            onClick={(e) => {
              const isActuallyInQuiz = isQuizInProgress && location.pathname === '/exam';
              if (isActuallyInQuiz) {
                e.preventDefault();
                setPendingNav('LOGOUT');
              } else {
                setShowLogoutConfirm(true);
              }
            }}
            className="flex items-center w-full px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
        title="CERRAR SESIÓN"
        message="¿Estás seguro de que deseas salir del sistema imperial? Tendrás que volver a autenticarte para acceder a las funciones del staff."
        confirmText="SALIR"
        cancelText="CANCELAR"
        variant="warning"
      />

      <ConfirmModal
        isOpen={pendingNav !== null}
        onClose={() => setPendingNav(null)}
        onConfirm={() => {
          if (pendingNav === 'LOGOUT') {
            setPendingNav(null);
            setShowLogoutConfirm(true);
          } else {
            confirmNav();
          }
        }}
        title="ABANDONAR ENTRENAMIENTO"
        message="Tienes un entrenamiento en curso. Si sales ahora, perderás tu progreso actual. ¿Deseas continuar y salir?"
        confirmText="SÍ, SALIR"
        cancelText="QUEDARME"
        variant="warning"
      />
    </aside>
  );
}
