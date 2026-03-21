import { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { collection, onSnapshot, query, doc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { handleFirestoreError, OperationType } from '../services/firestoreErrorHandler';
import { Settings, Users, Shield, Database, Search, UserPlus, UserMinus, Check, AlertCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { GuestBlocker } from '../components/auth/GuestBlocker';

export function ConfigPage() {
  const { userRole, user } = useAuthStore();
  const { profile } = useAppStore();
  const { addToast } = useToastStore();
  const [userCount, setUserCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Only allow creator or admins
  const isCreator = user?.email === 'qmisael386@gmail.com' || profile?.email === 'qmisael386@gmail.com';
  const isAdmin = userRole === 'admin' || isCreator;

  useEffect(() => {
    if (!isAdmin || !user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUserCount(snapshot.size);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin, user]);

  const handleSearchUser = async () => {
    if (!searchEmail.trim()) return;
    setSearchLoading(true);
    setFoundUser(null);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setFoundUser({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
      } else {
        addToast('Usuario no encontrado.', 'error');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      addToast('Error al buscar usuario.', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleToggleAdmin = async (targetUser: any) => {
    if (!targetUser) return;
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    
    // Don't allow removing own admin role if you are the creator
    if (targetUser.email === 'qmisael386@gmail.com' && newRole === 'user') {
      addToast('No puedes quitarle el poder al creador supremo.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      await updateDoc(doc(db, 'users', targetUser.id), { role: newRole });
      setFoundUser({ ...targetUser, role: newRole });
      addToast(`Rol actualizado a ${newRole} correctamente.`, 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      addToast('Error al actualizar el rol.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <PageWrapper>
        <GuestBlocker 
          title="ACCESO DENEGADO" 
          description="Esta sección es exclusiva para los administradores del sistema imperial."
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-4xl font-bold mb-2 flex items-center flex-wrap">
          <Settings className="w-6 h-6 md:w-8 md:h-8 mr-3 text-gold-champagne shrink-0" />
          <span>CONFIGURACIÓN <span className="gold-text ml-2">IMPERIAL</span></span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] md:text-sm uppercase tracking-widest">
          Panel de Control del Creador
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <PremiumCard className="p-4 md:p-6 flex items-center space-x-4 border-gold-champagne/30">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gold-champagne/20 rounded-xl flex items-center justify-center text-gold-champagne">
            <Users className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium">Usuarios Registrados</p>
            <p className="text-xl md:text-2xl font-bold font-mono">{loading ? '...' : userCount}</p>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4 md:p-6 flex items-center space-x-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-dragon-red/20 rounded-xl flex items-center justify-center text-dragon-red">
            <Shield className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium">Estado del Sistema</p>
            <p className="text-base md:text-lg font-bold text-green-500">ACTIVO</p>
          </div>
        </PremiumCard>

        <PremiumCard className="p-4 md:p-6 flex items-center space-x-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
            <Database className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 font-medium">Base de Datos</p>
            <p className="text-base md:text-lg font-bold">FIRESTORE v1</p>
          </div>
        </PremiumCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Creator Privileges */}
        <PremiumCard className="p-6 md:p-8">
          <h2 className="font-heading text-lg md:text-xl font-bold mb-6 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-gold-champagne" />
            PRIVILEGIOS DE CREADOR
          </h2>
          <div className="space-y-4 text-gray-400 font-mono text-[10px] md:text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>Acceso Total a Usuarios</span>
              <span className="text-green-500">HABILITADO</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>Gestión de Menú</span>
              <span className="text-green-500">HABILITADO</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>Otorgar Poderes</span>
              <span className="text-green-500">HABILITADO</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>Logs de Auditoría</span>
              <span className="text-orange-500">PRÓXIMAMENTE</span>
            </div>
            <div className="pt-4 text-[8px] md:text-[10px] text-gray-600 italic">
              * Este panel permite gestionar los rangos imperiales.
            </div>
          </div>
        </PremiumCard>

        {/* Grant Power Section */}
        <PremiumCard className="p-6 md:p-8">
          <h2 className="font-heading text-lg md:text-xl font-bold mb-6 flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-gold-champagne" />
            OTORGAR PODERES
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email"
                placeholder="Correo del usuario..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-gold-champagne outline-none transition-all"
              />
              <Button 
                onClick={handleSearchUser} 
                disabled={searchLoading || !searchEmail}
                className="absolute right-1.5 top-1.5 py-1 px-3 text-[10px]"
              >
                {searchLoading ? '...' : 'BUSCAR'}
              </Button>
            </div>

            {foundUser && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gold-champagne/20 flex items-center justify-center text-gold-champagne font-bold">
                      {foundUser.displayName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{foundUser.displayName}</p>
                      <p className="text-[10px] text-gray-500">{foundUser.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Rol Actual</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${foundUser.role === 'admin' ? 'bg-gold-champagne/20 text-gold-champagne' : 'bg-blue-500/20 text-blue-400'}`}>
                      {foundUser.role.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5">
                  <Button 
                    onClick={() => handleToggleAdmin(foundUser)}
                    disabled={actionLoading}
                    variant={foundUser.role === 'admin' ? 'outline' : 'primary'}
                    className="w-full py-2 text-xs"
                  >
                    {actionLoading ? 'PROCESANDO...' : (
                      foundUser.role === 'admin' ? (
                        <><UserMinus className="w-3 h-3 mr-2" /> QUITAR PODERES</>
                      ) : (
                        <><Shield className="w-3 h-3 mr-2" /> HACER CREADOR</>
                      )
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PremiumCard>
      </div>
    </PageWrapper>
  );
}
