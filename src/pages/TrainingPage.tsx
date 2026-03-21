
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button } from '../components/ui/Button';
import { Brain, Book, Utensils, Zap, Target, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/useAuthStore';
import { GuestBlocker } from '../components/auth/GuestBlocker';

export function TrainingPage() {
  const navigate = useNavigate();
  const { userRole } = useAuthStore();

  if (userRole === 'guest') {
    return (
      <PageWrapper>
        <GuestBlocker 
          title="ACCESO DENEGADO" 
          description="El centro de entrenamiento es exclusivo para el staff registrado. Inicia sesión para poner a prueba tus conocimientos y ganar puntos imperiales."
        />
      </PageWrapper>
    );
  }

  const trainingModes = [
    {
      id: 'atencion',
      title: 'ATENCIÓN Y SERVICIO',
      description: 'Protocolos imperiales de servicio al cliente, etiqueta en mesa y manejo de situaciones.',
      icon: Brain,
      color: 'text-gold-champagne',
      bgColor: 'bg-gold-champagne/10',
      path: '/exam?category=atencion',
      difficulty: 'Normal'
    },
    {
      id: 'codigo',
      title: 'CÓDIGOS DE PLATOS',
      description: 'Domina los códigos internos de la carta para una toma de pedidos rápida y eficiente.',
      icon: Zap,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      path: '/exam?category=codigo',
      difficulty: 'Difícil'
    },
    {
      id: 'ingredientes',
      title: 'INGREDIENTES REALES',
      description: 'Conoce a fondo la composición de cada plato para asesorar correctamente a los comensales.',
      icon: Utensils,
      color: 'text-dragon-red',
      bgColor: 'bg-dragon-red/10',
      path: '/exam?category=ingredientes',
      difficulty: 'Experto'
    }
  ];

  return (
    <PageWrapper className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center flex-wrap">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-gold-champagne shrink-0" />
            <span>CENTRO DE <span className="gold-text ml-2">ENTRENAMIENTO</span></span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest">
            Forjando la Excelencia del Staff Imperial
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gold-champagne/10 text-gold-champagne px-4 py-2 rounded-full border border-gold-champagne/20">
          <Award className="w-4 h-4" />
          <span className="font-mono text-[10px] md:text-xs font-bold tracking-wider">ACADEMIA ABIERTA</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trainingModes.map((mode, idx) => (
          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <PremiumCard className="p-6 md:p-8 h-full flex flex-col hover:border-white/20 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-12 h-12 md:w-14 md:h-14 ${mode.bgColor} rounded-2xl flex items-center justify-center ${mode.color} group-hover:scale-110 transition-transform`}>
                  <mode.icon className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <span className="px-3 py-1 text-[8px] md:text-[10px] font-bold uppercase tracking-widest rounded-full bg-white/5 border border-white/10 text-gray-400">
                  Dificultad: {mode.difficulty}
                </span>
              </div>
              
              <h2 className="font-heading text-lg md:text-xl font-bold mb-3 group-hover:text-gold-champagne transition-colors">
                {mode.title}
              </h2>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-8 flex-grow">
                {mode.description}
              </p>
              
              <Button 
                onClick={() => navigate(mode.path)}
                className="w-full py-3 rounded-xl font-bold tracking-widest text-xs"
              >
                INICIAR ENTRENAMIENTO
              </Button>
            </PremiumCard>
          </motion.div>
        ))}
      </div>

      <PremiumCard className="p-8 bg-gradient-to-r from-gold-champagne/5 to-transparent border-gold-champagne/20">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 bg-gold-champagne/20 rounded-full flex items-center justify-center shrink-0">
            <Award className="w-10 h-10 text-gold-champagne" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-bold font-heading mb-2">SISTEMA DE RECOMPENSAS</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Cada entrenamiento completado te otorga puntos de experiencia (XP). Los modos más difíciles como el <span className="text-dragon-red font-bold">Modo RAW</span> otorgan el doble de puntos. ¡Sube de rango y desbloquea logros exclusivos!
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/profile')} className="shrink-0">
            VER MIS LOGROS
          </Button>
        </div>
      </PremiumCard>
    </PageWrapper>
  );
}
