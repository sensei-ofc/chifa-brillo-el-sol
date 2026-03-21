import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { Trophy, Star, Clock, BookOpen, User } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RANKS, getRankByPoints } from '../constants/gameData';

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, userRole } = useAuthStore();
  const { profile } = useAppStore();
  const [topUsers, setTopUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(5));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setTopUsers(usersData);
    }, (error) => {
      console.error('Error fetching top users:', error);
      // Handle Firestore error as per instructions
      const errInfo = {
        error: error.message,
        operationType: 'list',
        path: 'users',
        authInfo: {
          userId: user?.uid,
          email: user?.email,
          emailVerified: user?.emailVerified,
          isAnonymous: user?.isAnonymous,
          providerInfo: user?.providerData.map(p => ({
            providerId: p.providerId,
            displayName: p.displayName,
            email: p.email,
            photoUrl: p.photoURL
          })) || []
        }
      };
      console.error('Firestore Error Info:', JSON.stringify(errInfo));
    });

    return () => unsubscribe();
  }, [user]);

  const currentRank = profile ? getRankByPoints(profile.points) : RANKS[0];
  const nextRankIndex = RANKS.findIndex(r => r.name === currentRank.name) + 1;
  const nextRank = nextRankIndex < RANKS.length ? RANKS[nextRankIndex] : null;
  
  const progressToNext = nextRank 
    ? Math.min(100, Math.round((profile?.points || 0) / nextRank.minPoints * 100))
    : 100;

  return (
    <PageWrapper className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="font-heading text-2xl md:text-4xl font-bold break-words">
              HOLA, <span className="gold-text">{profile?.displayName || user?.displayName || 'Invitado'}</span>
            </h1>
            {userRole === 'admin' && (
              <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shrink-0">
                {user?.email === 'qmisael386@gmail.com' ? 'CREADOR SUPREMO' : 'CREADOR'}
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] md:text-sm uppercase tracking-widest">
            Elite Staff Management
          </p>
        </div>
        <div className="flex items-center self-start md:self-auto space-x-2 bg-green-500/10 text-green-500 px-4 py-2 rounded-full border border-green-500/20">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-mono text-[10px] md:text-xs font-bold tracking-wider">SISTEMA ONLINE</span>
        </div>
      </div>

      {userRole === 'guest' && (
        <PremiumCard className="p-4 sm:p-6 bg-gradient-to-r from-dragon-red/10 to-transparent border-dragon-red/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-dragon-red mb-1">MODO INVITADO ACTIVO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Estás navegando como invitado. Para acceder a los entrenamientos, consultar a Marley IA y guardar tu progreso, debes iniciar sesión.
            </p>
          </div>
          <Button onClick={() => navigate('/login')} className="shrink-0 whitespace-nowrap">
            INICIAR SESIÓN
          </Button>
        </PremiumCard>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <PremiumCard className="flex items-center p-4 sm:p-6 space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-champagne/20 rounded-xl flex items-center justify-center text-gold-champagne">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Rango Actual</p>
            <p className="text-xl sm:text-2xl font-bold font-heading">{profile?.rank || 'Aprendiz'}</p>
          </div>
        </PremiumCard>

        <PremiumCard className="flex items-center p-4 sm:p-6 space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-dragon-red/20 rounded-xl flex items-center justify-center text-dragon-red">
            <Star className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Puntos Totales</p>
            <p className="text-xl sm:text-2xl font-bold font-mono">{profile?.points || 0} <span className="text-[10px] sm:text-sm text-gray-400">PTS</span></p>
          </div>
        </PremiumCard>

        <PremiumCard className="flex items-center p-4 sm:p-6 space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Exámenes</p>
            <p className="text-xl sm:text-2xl font-bold font-mono">{profile?.examsCompleted || 0}</p>
          </div>
        </PremiumCard>

        <PremiumCard className="flex items-center p-4 sm:p-6 space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Precisión</p>
            <p className="text-xl sm:text-2xl font-bold font-mono">{profile?.accuracy || 0}%</p>
          </div>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <PremiumCard className="p-5 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-gold-champagne" />
                ELITE RANKING
              </h2>
            </div>
            <div className="flex items-end justify-center space-x-2 sm:space-x-4 h-56 sm:h-64 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 hide-scrollbar">
              {topUsers.length > 1 && (
                <div className="flex flex-col items-center min-w-[70px] sm:min-w-[80px]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-gray-200 border-2 sm:border-4 border-gray-300 mb-2 flex items-center justify-center overflow-hidden">
                    {topUsers[1]?.photoURL ? <img src={topUsers[1].photoURL} alt="" className="w-full h-full object-cover" /> : <User className="text-gray-400" />}
                  </div>
                  <p className="font-bold text-[10px] sm:text-xs md:text-base truncate max-w-full px-1">{topUsers[1]?.displayName?.split(' ')[0]}</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-500 font-mono">{topUsers[1]?.points} PTS</p>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-gray-200 dark:bg-gray-800 rounded-t-lg mt-2 flex items-center justify-center font-bold text-sm sm:text-lg md:text-xl">2º</div>
                </div>
              )}
              {topUsers.length > 0 && (
                <div className="flex flex-col items-center min-w-[90px] sm:min-w-[100px]">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-gold-champagne mb-1 sm:mb-2">👑</div>
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full bg-gold-champagne/20 border-2 sm:border-4 border-gold-champagne mb-2 flex items-center justify-center overflow-hidden">
                    {topUsers[0]?.photoURL ? <img src={topUsers[0].photoURL} alt="" className="w-full h-full object-cover" /> : <User className="text-gold-champagne" />}
                  </div>
                  <p className="font-bold text-xs sm:text-sm md:text-base truncate max-w-full px-1">{topUsers[0]?.displayName?.split(' ')[0]}</p>
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-gold-champagne font-mono">{topUsers[0]?.points} PTS</p>
                  <div className="w-18 h-20 sm:w-20 sm:h-24 md:w-28 md:h-32 bg-gold-champagne/10 dark:bg-gold-champagne/20 border border-gold-champagne/30 rounded-t-lg mt-2 flex items-center justify-center font-bold text-lg sm:text-xl md:text-2xl text-gold-champagne">1º</div>
                </div>
              )}
              {topUsers.length > 2 && (
                <div className="flex flex-col items-center min-w-[70px] sm:min-w-[80px]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-orange-200 border-2 sm:border-4 border-orange-400 mb-2 flex items-center justify-center overflow-hidden">
                    {topUsers[2]?.photoURL ? <img src={topUsers[2].photoURL} alt="" className="w-full h-full object-cover" /> : <User className="text-orange-500" />}
                  </div>
                  <p className="font-bold text-[10px] sm:text-xs md:text-base truncate max-w-full px-1">{topUsers[2]?.displayName?.split(' ')[0]}</p>
                  <p className="text-[8px] sm:text-[10px] text-orange-400 font-mono">{topUsers[2]?.points} PTS</p>
                  <div className="w-14 h-10 sm:w-16 sm:h-12 md:w-24 md:h-20 bg-orange-100 dark:bg-orange-900/30 rounded-t-lg mt-2 flex items-center justify-center font-bold text-sm sm:text-lg md:text-xl text-orange-500">3º</div>
                </div>
              )}
              {topUsers.length === 0 && (
                <div className="text-gray-500 font-mono text-sm py-10">CARGANDO RANKING...</div>
              )}
            </div>
          </PremiumCard>

          <PremiumCard className="p-6 md:p-8">
            <h2 className="font-heading text-lg md:text-xl font-bold flex items-center mb-6">
              <Star className="w-5 h-5 mr-2 text-gold-champagne" />
              TUS LOGROS
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile?.achievements && profile.achievements.length > 0 ? (
                profile.achievements.map((achievementId, idx) => {
                  return (
                    <div key={idx} className="flex items-center p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-10 h-10 bg-gold-champagne/10 rounded-lg flex items-center justify-center text-xl mr-3">
                        🏆
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gold-champagne uppercase tracking-wider">{achievementId.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-gray-500">Logro Desbloqueado</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400 font-mono text-xs sm:text-sm">
                  AÚN NO HAS DESBLOQUEADO LOGROS.
                </div>
              )}
            </div>
          </PremiumCard>
        </div>

        <div className="space-y-6 md:space-y-8">
          <PremiumCard className="p-6 md:p-8 bg-gradient-to-br from-dragon-red/10 to-transparent border-dragon-red/20">
            <h2 className="font-heading text-lg md:text-xl font-bold mb-2 sm:mb-4">CONSULTAR A MARLEY</h2>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 uppercase tracking-widest">IA EXPERTA • ONLINE</p>
            <button 
              onClick={() => navigate('/chat')}
              className="w-full py-2.5 sm:py-3 bg-dragon-red hover:bg-dragon-red-dark text-white rounded-xl font-medium transition-colors text-sm sm:text-base"
            >
              Iniciar Chat
            </button>
          </PremiumCard>

          <PremiumCard className="p-6 md:p-8">
            <h2 className="font-heading text-lg md:text-xl font-bold mb-6">TU PROGRESO</h2>
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" className="stroke-current text-gray-200 dark:text-gray-800 sm:hidden" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" cy="48" r="42" 
                    className="stroke-current text-gold-champagne sm:hidden transition-all duration-1000" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray="263.8" 
                    strokeDashoffset={263.8 - (263.8 * progressToNext / 100)} 
                  />
                  
                  <circle cx="64" cy="64" r="56" className="stroke-current text-gray-200 dark:text-gray-800 hidden sm:block" strokeWidth="12" fill="none" />
                  <circle 
                    cx="64" cy="64" r="56" 
                    className="stroke-current text-gold-champagne hidden sm:block transition-all duration-1000" 
                    strokeWidth="12" 
                    fill="none" 
                    strokeDasharray="351.8" 
                    strokeDashoffset={351.8 - (351.8 * progressToNext / 100)} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-3xl font-bold font-mono">{progressToNext}%</span>
                  <span className="text-[8px] sm:text-xs text-gray-500 uppercase tracking-wider">{nextRank ? 'Siguiente Nivel' : 'Nivel Máximo'}</span>
                </div>
              </div>
            </div>
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Próximo Rango</p>
              <p className="font-bold text-gold-champagne">{nextRank?.name || '¡ERES EL MEJOR!'}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 dark:bg-white/5 p-3 sm:p-4 rounded-xl text-center">
                <p className="text-lg sm:text-2xl font-bold font-mono text-dragon-red">{profile?.achievements?.length || 0}</p>
                <p className="text-[8px] sm:text-xs text-gray-500 uppercase tracking-wider">Logros</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-3 sm:p-4 rounded-xl text-center">
                <p className="text-lg sm:text-2xl font-bold font-mono text-dragon-red">{profile?.points || 0}</p>
                <p className="text-[8px] sm:text-xs text-gray-500 uppercase tracking-wider">Puntos</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/training')}
              className="w-full mt-6 bg-gold-champagne hover:bg-gold-champagne-dark text-ebony-dark font-bold py-3 rounded-xl"
            >
              IR AL ENTRENAMIENTO
            </Button>
          </PremiumCard>
        </div>
      </div>
    </PageWrapper>
  );
}
