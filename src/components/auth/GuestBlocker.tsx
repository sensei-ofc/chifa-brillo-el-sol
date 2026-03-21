import { Lock, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { PremiumCard } from '../ui/PremiumCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface GuestBlockerProps {
  title: string;
  description: string;
}

export function GuestBlocker({ title, description }: GuestBlockerProps) {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <PremiumCard className="max-w-md w-full p-8 text-center border-dragon-red/20 bg-gradient-to-b from-dragon-red/5 to-transparent">
        <div className="w-20 h-20 mx-auto bg-dragon-red/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-dragon-red" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          {description}
        </p>
        <Button onClick={handleLogin} className="w-full py-3 font-bold tracking-widest">
          <LogIn className="w-5 h-5 mr-2" />
          INICIAR SESIÓN
        </Button>
      </PremiumCard>
    </div>
  );
}
