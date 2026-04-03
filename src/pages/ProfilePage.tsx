import { useRef, useState, ChangeEvent, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { PremiumCard } from '../components/ui/PremiumCard';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { useToastStore } from '../store/useToastStore';
import { CONFIG } from '../config';
import { Download, Share2, Award, Shield, User as UserIcon, Camera, Edit2, Save, X, Lock, Mail, Nfc, QrCode, ChevronRight, CheckCircle2, Star, Trophy } from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { auth, db, storage } from '../services/firebase';
import { RANKS, getRankByPoints, ACHIEVEMENTS } from '../constants/gameData';
import { GuestBlocker } from '../components/auth/GuestBlocker';

export function ProfilePage() {
  const { user, userRole, localGuest } = useAuthStore();
  const { profile, setProfile } = useAppStore();
  const { addToast } = useToastStore();
  const credentialRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userRankPosition, setUserRankPosition] = useState<number | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>(CONFIG.brand.logo);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('');

  useEffect(() => {
    // Fetch logo and convert to base64 to avoid CORS issues with html-to-image
    const fetchLogo = async () => {
      try {
        // Using corsproxy.io as a more reliable alternative
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(CONFIG.brand.logo)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error fetching logo for credential:", error);
        // Fallback to original URL if proxy fails, though it might cause CORS issues on download
        setLogoDataUrl(CONFIG.brand.logo);
      }
    };
    fetchLogo();
  }, []);

  useEffect(() => {
    // Fetch avatar and convert to base64
    const fetchAvatar = async () => {
      if (!profile?.photoURL) return;
      try {
        // Firebase storage URLs usually have CORS enabled, but just in case
        const response = await fetch(profile.photoURL);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarDataUrl(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error fetching avatar for credential:", error);
        // Fallback to proxy if direct fetch fails
        try {
          const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(profile.photoURL)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error('Network response was not ok');
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setAvatarDataUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error("Error fetching avatar via proxy:", e);
          // Fallback to original URL
          setAvatarDataUrl(profile.photoURL);
        }
      }
    };
    fetchAvatar();
  }, [profile?.photoURL]);

  useEffect(() => {
    const fetchRanking = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => doc.id);
        const position = users.indexOf(user.uid) + 1;
        if (position > 0) {
          setUserRankPosition(position);
        }
      } catch (error) {
        console.error("Error fetching ranking position:", error);
      }
    };

    fetchRanking();
  }, [user]);

  if (userRole === 'guest') {
    return (
      <PageWrapper>
        <GuestBlocker 
          title="PERFIL NO DISPONIBLE" 
          description="Para tener un perfil imperial, guardar tu progreso y obtener tu credencial digital, debes iniciar sesión."
        />
      </PageWrapper>
    );
  }

  const isGoogleUser = auth.currentUser?.providerData.some(p => p.providerId === 'google.com');

  const [isEditingAll, setIsEditingAll] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || '');
  const [newEmail, setNewEmail] = useState(profile?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleSaveAll = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    try {
      const updates: Promise<any>[] = [];
      const firestoreUpdates: any = {};

      // Name update
      if (newName.trim() && newName !== profile?.displayName) {
        updates.push(updateProfile(auth.currentUser, { displayName: newName }));
        firestoreUpdates.displayName = newName;
      }

      // Email update (only if not Google)
      if (!isGoogleUser && newEmail.trim() && newEmail !== profile?.email) {
        updates.push(updateEmail(auth.currentUser, newEmail));
        firestoreUpdates.email = newEmail;
      }

      // Password update
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          addToast('Las contraseñas no coinciden.', 'error');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          addToast('La contraseña debe tener al menos 6 caracteres.', 'error');
          setLoading(false);
          return;
        }
        updates.push(updatePassword(auth.currentUser, newPassword));
      }

      if (Object.keys(firestoreUpdates).length > 0) {
        updates.push(updateDoc(doc(db, 'users', auth.currentUser.uid), firestoreUpdates));
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        if (profile) {
          setProfile({ ...profile, ...firestoreUpdates });
        }
        addToast('Perfil actualizado con éxito.', 'success');
      }
      
      setIsEditingAll(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.code === 'auth/requires-recent-login') {
        addToast('Esta operación requiere un inicio de sesión reciente. Por favor, cierra sesión e ingresa de nuevo.', 'error');
      } else {
        addToast('Error al actualizar el perfil.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!credentialRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await toJpeg(credentialRef.current, { quality: 0.95, pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `credencial-${user?.displayName || 'imperial'}.jpg`;
      a.click();
      addToast('Credencial descargada con éxito.', 'success');
    } catch (error) {
      console.error('Error downloading credential:', error);
      addToast('Error al descargar la credencial.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!credentialRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await toJpeg(credentialRef.current, { quality: 0.95, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `credencial-${user?.displayName || 'imperial'}.jpg`, { type: 'image/jpeg' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Credencial Imperial - Chifa Brillo El Sol',
          text: '¡Mira mi credencial oficial del staff de Chifa Brillo El Sol!',
          files: [file]
        });
      } else {
        // Fallback to download if sharing is not supported
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `credencial-${user?.displayName || 'imperial'}.jpg`;
        a.click();
        addToast('Imagen descargada (tu navegador no soporta compartir directo).', 'info');
      }
    } catch (error) {
      console.error('Error sharing credential:', error);
      addToast('Error al compartir la credencial.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast('La imagen es demasiado grande (máx. 2MB).', 'error');
      return;
    }

    setLoading(true);
    try {
      const storageRef = ref(storage, `avatars/${auth.currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      await updateDoc(doc(db, 'users', auth.currentUser.uid), { photoURL: downloadURL });
      
      if (profile) {
        setProfile({ ...profile, photoURL: downloadURL });
      }
      
      addToast('Foto de perfil actualizada.', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      addToast('Error al subir la foto.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center flex-wrap">
          <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-gold-champagne shrink-0" />
          <span>IDENTIDAD <span className="gold-text ml-2">IMPERIAL</span></span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-widest">
          Perfil y Credenciales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-1 space-y-6 md:space-y-8">
          {/* Digital Credential */}
          <div className="relative group max-w-[320px] mx-auto w-full">
            <div className="absolute -inset-1 bg-gradient-to-b from-gold-champagne via-dragon-red to-gold-champagne rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <div 
              ref={credentialRef}
              className="relative bg-gradient-to-b from-[#1a1a1a] via-[#0a0a0a] to-[#050505] border border-gold-champagne/40 rounded-2xl p-6 overflow-hidden shadow-2xl aspect-[1/1.6] flex flex-col items-center text-center"
            >
              {/* Watermark Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 opacity-5 pointer-events-none">
                <img src={logoDataUrl} alt="Watermark" className="w-full h-full object-cover rounded-full" />
              </div>

              {/* Top Header */}
              <div className="w-full flex flex-col items-center relative z-10 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-champagne shadow-[0_0_15px_rgba(212,175,55,0.4)] bg-black mb-3">
                  <img src={logoDataUrl} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h3 className="font-heading text-sm font-bold text-white leading-tight uppercase tracking-widest">
                  {CONFIG.brand.name.split(' ').slice(0, 1)} <span className="text-gold-champagne">{CONFIG.brand.name.split(' ').slice(1).join(' ')}</span>
                </h3>
                <p className="font-mono text-[8px] text-gold-champagne uppercase tracking-[0.3em] mt-1">Elite Staff</p>
              </div>

              {/* Avatar */}
              <div className="relative z-10 mb-4">
                <div className="w-28 h-28 rounded-full bg-gold-champagne/20 border-2 border-gold-champagne p-1 relative group/avatar mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                    {profile?.photoURL ? (
                      <img src={avatarDataUrl || profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gold-champagne text-4xl font-bold">
                        {profile?.displayName?.charAt(0) || 'I'}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="w-full relative z-10 flex-1 flex flex-col items-center justify-center">
                <h2 className="font-heading text-2xl font-bold text-white uppercase tracking-wider drop-shadow-md mb-1">
                  {profile?.displayName || 'Invitado'}
                </h2>
                <p className="text-gold-champagne text-xs font-mono uppercase tracking-widest mb-3">
                  {profile?.email === CONFIG.creator.email ? 'CREADOR' : (profile?.role === 'admin' ? 'ADMIN' : 'STAFF')} • {profile?.rank || 'APRENDIZ'}
                </p>
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Nfc className="w-5 h-5 text-gold-champagne/70" />
                  {userRankPosition && (
                    <div className="flex items-center bg-gold-champagne/10 border border-gold-champagne/30 px-2 py-1 rounded-full">
                      <Trophy className="w-3 h-3 text-gold-champagne mr-1" />
                      <span className="text-[10px] font-mono font-bold text-gold-champagne">TOP {userRankPosition}</span>
                    </div>
                  )}
                </div>
                <p className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">ID: {user?.uid?.substring(0, 10).toUpperCase() || 'GUEST-01'}</p>
              </div>

              {/* Bottom Section */}
              <div className="w-full flex justify-between items-end relative z-10 mt-auto pt-4 border-t border-gold-champagne/20">
                <div className="flex space-x-6 text-left">
                  <div>
                    <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest mb-0.5">Puntos</p>
                    <p className="font-mono text-sm font-bold text-white">{profile?.points || 0}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest mb-0.5">Precisión</p>
                    <p className="font-mono text-sm font-bold text-white">{profile?.accuracy || 0}%</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <QrCode className="w-10 h-10 text-white/80" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6 max-w-[320px] mx-auto w-full">
            <Button onClick={handleDownload} disabled={loading} variant="outline" className="flex-1 text-[10px] sm:text-xs md:text-sm py-2">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Descargar
            </Button>
            <Button onClick={handleShare} disabled={loading} variant="outline" className="flex-1 text-[10px] sm:text-xs md:text-sm py-2">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" /> Compartir
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <PremiumCard className="p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Exámenes</div>
              <div className="text-xl font-bold font-mono text-white">{profile?.examsCompleted || 0}</div>
            </PremiumCard>
            <PremiumCard className="p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Racha Máxima</div>
              <div className="text-xl font-bold font-mono text-emerald-500">{profile?.bestStreak || 0}</div>
            </PremiumCard>
            <PremiumCard className="p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Perfectos</div>
              <div className="text-xl font-bold font-mono text-gold-champagne">{profile?.perfectExams || 0}</div>
            </PremiumCard>
            <PremiumCard className="p-4 text-center">
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Mejor Tiempo</div>
              <div className="text-xl font-bold font-mono text-white">{profile?.bestTime || 0}s</div>
            </PremiumCard>
          </div>

          <PremiumCard className="p-5 sm:p-6 md:p-8">
            <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold flex items-center mb-6">
              <Award className="w-5 h-5 mr-2 text-gold-champagne" />
              SALÓN DE LOGROS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {ACHIEVEMENTS.map((achievement) => {
                const isUnlocked = profile?.achievements?.includes(achievement.id);
                
                return (
                  <div 
                    key={achievement.id}
                    className={`flex flex-col items-center p-3 md:p-4 rounded-xl border transition-all relative group ${
                      isUnlocked 
                        ? 'bg-gold-champagne/10 border-gold-champagne/30' 
                        : 'bg-white/5 border-white/10 opacity-40 grayscale'
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 text-xl sm:text-2xl md:text-3xl ${
                      isUnlocked ? 'bg-gold-champagne/20' : 'bg-white/10'
                    }`}>
                      {achievement.icon}
                    </div>
                    <p className={`text-[7px] sm:text-[8px] md:text-xs font-bold text-center font-mono uppercase ${
                      isUnlocked ? 'text-gold-champagne' : 'text-gray-500'
                    }`}>
                      {achievement.title}
                    </p>
                    
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black border border-gold-champagne/30 rounded-lg text-[8px] text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                      {achievement.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6 md:p-8">
            <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold flex items-center mb-6">
              <Shield className="w-5 h-5 mr-2 text-gold-champagne" />
              RANGOS IMPERIALES
            </h2>
            <div className="space-y-4">
              {RANKS.map((rank, index) => {
                const isAchieved = (profile?.points || 0) >= rank.minPoints;
                const isCurrent = getRankByPoints(profile?.points || 0).name === rank.name;
                
                return (
                  <div 
                    key={rank.name}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isCurrent 
                        ? 'bg-gold-champagne/10 border-gold-champagne shadow-[0_0_15px_rgba(212,175,55,0.2)]' 
                        : isAchieved 
                          ? 'bg-white/5 border-white/10 opacity-80' 
                          : 'bg-black/20 border-white/5 opacity-40 grayscale'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner"
                        style={{ backgroundColor: `${rank.color}20`, color: rank.color }}
                      >
                        {rank.icon}
                      </div>
                      <div>
                        <h3 className={`font-heading text-sm font-bold ${isCurrent ? 'text-gold-champagne' : 'text-white'}`}>
                          {rank.name}
                        </h3>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          {rank.minPoints} Puntos Requeridos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {isCurrent ? (
                        <div className="flex items-center text-gold-champagne text-[10px] font-bold font-mono uppercase tracking-tighter">
                          <Star className="w-3 h-3 mr-1 fill-gold-champagne" /> Rango Actual
                        </div>
                      ) : isAchieved ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="flex flex-col items-end">
                          <Lock className="w-4 h-4 text-gray-600 mb-1" />
                          <span className="text-[9px] font-mono text-gray-600">Bloqueado</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </PremiumCard>

          <PremiumCard className="p-5 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Background Logo Watermark */}
            <div className="absolute -right-10 -top-10 w-40 h-40 opacity-10 pointer-events-none rotate-12">
              <img src={CONFIG.brand.logo} alt="" className="w-full h-full object-cover rounded-full" />
            </div>

            <div className="flex justify-between items-center mb-6 relative z-10">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-gold-champagne/30 mr-3 shrink-0">
                  <img src={CONFIG.brand.logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-gold-champagne" />
                  DATOS PERSONALES
                </h2>
              </div>
              
              {!isEditingAll ? (
                <Button 
                  onClick={() => setIsEditingAll(true)} 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-8 border-gold-champagne/30 text-gold-champagne hover:bg-gold-champagne/10"
                >
                  <Edit2 className="w-3 h-3 mr-1" /> EDITAR TODO
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveAll} 
                    disabled={loading}
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-8 border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    <Save className="w-3 h-3 mr-1" /> {loading ? '...' : 'GUARDAR'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditingAll(false);
                      setNewName(profile?.displayName || '');
                      setNewEmail(profile?.email || '');
                      setNewPassword('');
                      setConfirmPassword('');
                    }} 
                    variant="outline" 
                    size="sm" 
                    className="text-[10px] h-8 border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <X className="w-3 h-3 mr-1" /> CANCELAR
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6 relative z-10">
              {/* Photo Edit Section */}
              {isEditingAll && (
                <div className="flex flex-col items-center pb-4 border-b border-white/5">
                  <div className="relative group/edit-avatar mb-3">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gold-champagne p-0.5 bg-gray-900">
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gold-champagne text-3xl font-bold">
                          {profile?.displayName?.charAt(0) || 'I'}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-gold-champagne text-ebony-dark rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-gold-champagne uppercase tracking-widest">Cambiar Foto de Perfil</p>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-[8px] sm:text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Nombre Completo</label>
                {isEditingAll ? (
                  <input 
                    type="text" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gold-champagne/30 focus:border-gold-champagne outline-none text-xs sm:text-sm md:text-base"
                    placeholder="Tu nombre imperial"
                  />
                ) : (
                  <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 font-medium text-xs sm:text-sm md:text-base">
                    {profile?.displayName || 'Invitado'}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-[8px] sm:text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Correo Electrónico</label>
                {isEditingAll && !isGoogleUser ? (
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gold-champagne/30 focus:border-gold-champagne outline-none text-xs sm:text-sm md:text-base"
                    placeholder="Nuevo correo"
                  />
                ) : (
                  <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 font-medium text-xs sm:text-sm md:text-base text-gray-500 truncate flex justify-between items-center">
                    <span>{profile?.email || 'No disponible'}</span>
                    {isGoogleUser && <span className="text-[8px] font-mono uppercase opacity-50">Google Auth</span>}
                  </div>
                )}
              </div>

              {/* Password Section (Only if editing or if user wants to see status) */}
              {(isEditingAll || (!isGoogleUser || auth.currentUser?.providerData.some(p => p.providerId === 'password'))) && (
                <div>
                  <label className="block text-[8px] sm:text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Seguridad</label>
                  {isEditingAll ? (
                    <div className="space-y-3">
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gold-champagne/30 focus:border-gold-champagne outline-none text-xs sm:text-sm md:text-base"
                        placeholder="Nueva contraseña (dejar en blanco para no cambiar)"
                      />
                      {newPassword && (
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gold-champagne/30 focus:border-gold-champagne outline-none text-xs sm:text-sm md:text-base"
                          placeholder="Confirmar nueva contraseña"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 font-medium text-xs sm:text-sm md:text-base text-gray-500 flex justify-between items-center">
                      <span>••••••••••••</span>
                      {isGoogleUser && !auth.currentUser?.providerData.some(p => p.providerId === 'password') && (
                        <span className="text-[10px] text-dragon-red font-mono uppercase">Sin contraseña configurada</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </PremiumCard>
        </div>
      </div>
    </PageWrapper>
  );
}
