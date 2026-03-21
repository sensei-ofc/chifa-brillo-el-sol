import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { PageWrapper } from '../components/layout/PageWrapper';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { User as UserIcon, Mail, Shield, Calendar, Search, Edit2, Trash2, Plus, Minus, X, Check, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Modal } from '../components/ui/Modal';
import { GuestBlocker } from '../components/auth/GuestBlocker';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  points: number;
  rank: string;
  createdAt: string;
}

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, userRole, localGuest } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [pointsAmount, setPointsAmount] = useState<number>(10);

  useEffect(() => {
    if (userRole !== 'admin' || !user) return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
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
      
      setUsers([
        { uid: '1', displayName: 'Juan Pérez', email: 'juan@example.com', role: 'user', points: 150, rank: 'Guerrero', createdAt: new Date().toISOString() },
        { uid: '2', displayName: 'María García', email: 'maria@example.com', role: 'user', points: 300, rank: 'Maestro', createdAt: new Date().toISOString() },
        { uid: '3', displayName: 'Creador (Admin)', email: 'qmisael386@gmail.com', role: 'admin', points: 9999, rank: 'Gran Maestro', createdAt: new Date().toISOString() },
      ]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userRole, user]);

  if (userRole !== 'admin') {
    return (
      <PageWrapper>
        <GuestBlocker 
          title="ACCESO DENEGADO" 
          description="Esta sección es exclusiva para los administradores del sistema imperial."
        />
      </PageWrapper>
    );
  }

  const handleUpdateUser = async (uid: string, data: Partial<UserProfile>) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, data);
      setEditingUser(null);
      addToast('Usuario actualizado correctamente.', 'success');
    } catch (error) {
      console.error("Error updating user:", error);
      // Fallback for mock data
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, ...data } : u));
      setEditingUser(null);
      addToast('Error al actualizar usuario.', 'error');
    }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUserToDelete(null);
      addToast('Usuario eliminado correctamente.', 'success');
    } catch (error) {
      console.error("Error deleting user:", error);
      setUsers(prev => prev.filter(u => u.uid !== uid));
      setUserToDelete(null);
      addToast('Error al eliminar usuario.', 'error');
    }
  };

  const handleAdjustPoints = async (uid: string, currentPoints: number, amount: number) => {
    const newPoints = Math.max(0, currentPoints + amount);
    const action = amount > 0 ? 'sumado' : 'restado';
    try {
      await handleUpdateUser(uid, { points: newPoints });
      addToast(`Se han ${action} ${Math.abs(amount)} puntos.`, 'info');
    } catch (error) {
      addToast('Error al ajustar puntos.', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userRole !== 'admin') {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Shield className="w-16 h-16 text-red-500 mb-4 opacity-20" />
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">Solo los administradores pueden ver esta sección.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center flex-wrap">
            GESTIÓN DE <span className="gold-text ml-2">USUARIOS</span>
          </h1>
          <p className="text-gray-400 text-xs md:text-sm">Visualiza y gestiona todos los usuarios registrados en el sistema.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input 
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-gold-champagne/50 outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gold-champagne border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((u, index) => (
            <motion.div
              key={u.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 hover:border-gold-champagne/30 transition-all group relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-dragon-red/10 flex items-center justify-center border border-dragon-red/20 mr-4">
                    <UserIcon className="w-6 h-6 text-dragon-red" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-gold-champagne transition-colors">
                      {u.displayName || 'Usuario sin nombre'}
                    </h3>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-gold-champagne/20 text-gold-champagne' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => setEditingUser(u)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setUserToDelete(u.uid)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 opacity-50" />
                  <span className="truncate">{u.email || 'Sin correo'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 opacity-50" />
                  <span>Registrado: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-xs">
                    <span className="text-gold-champagne font-bold text-lg">{u.points}</span>
                    <span className="ml-1 opacity-50 uppercase tracking-widest text-[10px]">puntos</span>
                  </div>
                  <div className="text-[10px] px-2 py-1 bg-white/5 rounded-lg uppercase tracking-widest font-bold">
                    {u.rank}
                  </div>
                </div>

                {/* Points Quick Actions */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleAdjustPoints(u.uid, u.points, -pointsAmount)}
                      className="flex-1 py-2 bg-white/5 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors flex items-center justify-center"
                      title="Restar puntos"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input 
                      type="number" 
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(Number(e.target.value))}
                      className="w-16 bg-white/5 border-none rounded-xl py-2 text-center text-xs text-white focus:ring-0"
                    />
                    <button 
                      onClick={() => handleAdjustPoints(u.uid, u.points, pointsAmount)}
                      className="flex-1 py-2 bg-white/5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl transition-colors flex items-center justify-center"
                      title="Sumar puntos"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleAdjustPoints(u.uid, u.points, 10)}
                      className="py-1.5 bg-white/5 hover:bg-gold-champagne/10 text-[9px] font-bold text-gold-champagne rounded-lg border border-gold-champagne/20 transition-all"
                    >
                      +10
                    </button>
                    <button 
                      onClick={() => handleAdjustPoints(u.uid, u.points, 50)}
                      className="py-1.5 bg-white/5 hover:bg-gold-champagne/20 text-[9px] font-bold text-gold-champagne rounded-lg border border-gold-champagne/30 transition-all"
                    >
                      +50
                    </button>
                    <button 
                      onClick={() => handleAdjustPoints(u.uid, u.points, 100)}
                      className="py-1.5 bg-gold-champagne/10 hover:bg-gold-champagne/20 text-[9px] font-bold text-gold-champagne rounded-lg border border-gold-champagne/40 transition-all"
                    >
                      +100
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Editar Usuario"
      >
        {editingUser && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nombre</label>
              <input 
                type="text"
                value={editingUser.displayName}
                onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-gold-champagne/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Rol</label>
              <select 
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-gold-champagne/50"
              >
                <option value="user">Usuario</option>
                <option value="admin">Administrador</option>
                <option value="guest">Invitado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Rango</label>
              <input 
                type="text"
                value={editingUser.rank}
                onChange={(e) => setEditingUser({ ...editingUser, rank: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-gold-champagne/50"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => setEditingUser(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border-none"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => handleUpdateUser(editingUser.uid, { 
                  displayName: editingUser.displayName,
                  role: editingUser.role as any,
                  rank: editingUser.rank
                })}
                className="flex-1 bg-dragon-red hover:bg-dragon-red-dark text-white border-none"
              >
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
        title="ELIMINAR USUARIO"
        message="¿Estás seguro de que deseas eliminar este usuario? Esta acción es irreversible y se perderán todos sus puntos y logros."
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
        variant="danger"
      />

      {!loading && filteredUsers.length === 0 && (
        <div className="text-center py-20 bg-[#0a0a0a] rounded-3xl border border-white/5">
          <p className="text-gray-500">No se encontraron usuarios.</p>
        </div>
      )}
    </PageWrapper>
  );
}
