import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithPopup, GoogleAuthProvider, signInAnonymously,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, setPersistence, browserLocalPersistence, browserSessionPersistence
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button, cn } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { PageWrapper } from '../components/layout/PageWrapper';
import { motion } from 'motion/react';
import { useToastStore } from '../store/useToastStore';
import { User, Lock, Eye, EyeOff, Mail } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { setUserRole, setLocalGuest, user, isAuthReady } = useAuthStore();
  const { setProfile } = useAppStore();
  const { addToast } = useToastStore();
  
  // Auto-redirect if already logged in
  React.useEffect(() => {
    if (isAuthReady && user) {
      // Small delay to ensure profile is loaded if it's a fresh login
      const timer = setTimeout(() => {
        console.log('Usuario ya autenticado, redirigiendo al dashboard:', user.email);
        navigate('/', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthReady, user, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleAuthError = (err: any) => {
    console.error('Auth Error Details:', err);
    const errorCode = err.code || '';
    const errorMessage = err.message || '';

    if (errorCode === 'auth/admin-restricted-operation' || errorCode === 'auth/operation-not-allowed') {
      addToast('Error: El método de autenticación no está habilitado en Firebase Console. Por favor, habilita "Correo electrónico/contraseña" en Authentication > Sign-in method.', 'error');
    } else if (errorCode === 'auth/account-exists-with-different-credential') {
      addToast('Ya existe una cuenta con este correo pero usando otro método de inicio (ej. Contraseña). Por favor, usa el método original o intenta restablecer tu contraseña.', 'error');
    } else if (
      errorCode === 'auth/invalid-credential' || 
      errorCode === 'auth/user-not-found' || 
      errorCode === 'auth/wrong-password' ||
      errorMessage.includes('auth/invalid-credential')
    ) {
      // Special case for creator to be more helpful
      if (email.includes('qmisael386@gmail.com')) {
        addToast('Credenciales incorrectas para la cuenta de creador. Si olvidaste tu contraseña, usa el enlace de recuperación o intenta con Google.', 'error');
      } else {
        addToast('Credenciales incorrectas. Verifica tu correo y contraseña, o regístrate si no tienes cuenta.', 'error');
      }
    } else if (errorCode === 'auth/email-already-in-use') {
      addToast('El correo ya está registrado. Intenta iniciar sesión.', 'error');
    } else if (errorCode === 'auth/weak-password') {
      addToast('La contraseña es muy débil. Debe tener al menos 6 caracteres.', 'error');
    } else if (errorCode === 'auth/invalid-email') {
      addToast('El formato del correo electrónico no es válido.', 'error');
    } else if (errorCode === 'auth/too-many-requests') {
      addToast('Demasiados intentos fallidos. Por favor, inténtalo más tarde o restablece tu contraseña.', 'error');
    } else if (errorCode === 'auth/network-request-failed') {
      addToast('Error de red. Verifica tu conexión a internet.', 'error');
    } else if (errorCode === 'auth/popup-closed-by-user') {
      // Just clear loading, no need for error message usually
      setLoading(false);
    } else {
      addToast('Ocurrió un error: ' + (errorMessage || 'Inténtalo de nuevo.'), 'error');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalEmail = email.trim();
    
    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(finalEmail)) {
      addToast('Por favor, ingresa un correo electrónico válido.', 'error');
      setLoading(false);
      return;
    }

    if (!isResetting && password.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres.', 'error');
      setLoading(false);
      return;
    }

    console.log('Iniciando autenticación por email:', finalEmail);
    try {
      // Set persistence optionally
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (pErr) {
        console.warn('Error setting persistence:', pErr);
      }
      
      if (isResetting) {
        await sendPasswordResetEmail(auth, finalEmail);
        addToast('Se ha enviado un enlace de recuperación a tu correo.', 'success');
        setIsResetting(false);
      } else if (isRegistering) {
        await createUserWithEmailAndPassword(auth, finalEmail, password);
        // App.tsx handles profile creation in background
      } else {
        await signInWithEmailAndPassword(auth, finalEmail, password);
        // App.tsx handles profile loading in background
      }
    } catch (err: any) {
      console.error('Error en autenticación por email:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('Iniciando login con Google...');
    try {
      // Set persistence optionally
      try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      } catch (pErr) {
        console.warn('Error setting persistence:', pErr);
      }
      
      const provider = new GoogleAuthProvider();
      // Add custom parameter to force account selection if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      
      console.log('Abriendo popup de Google...');
      await signInWithPopup(auth, provider);
      // App.tsx handles profile creation/loading in background
    } catch (err: any) {
      console.error('Error en login con Google:', err);
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    // Instant entry as local guest
    setLocalGuest(true);
    setUserRole('guest');
    setProfile({
      uid: 'local-guest-' + Math.random().toString(36).substr(2, 9),
      displayName: 'Invitado Local',
      email: '',
      photoURL: '',
      role: 'guest',
      points: 0,
      rank: 'Visitante',
      examsCompleted: 0,
      accuracy: 0,
      achievements: [],
      currentStreak: 0,
      bestStreak: 0,
      perfectExams: 0,
      bestTime: 0,
    });
    navigate('/');
    
    // Background Firebase Anonymous Login
    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInAnonymously(auth);
    } catch (err) {
      console.warn('Firebase anonymous login failed, continuing in local mode:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ebony-light dark:bg-ebony-dark relative overflow-hidden transition-colors duration-300">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-dragon-red/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold-champagne/5 rounded-full blur-[100px]"></div>
      </div>

      <PageWrapper className="z-10 w-full max-w-[420px] px-4">
        <div className="bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border border-black/5 dark:border-white/5 rounded-[2rem] p-8 shadow-2xl transition-colors duration-300">
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <img 
              src="https://e.top4top.io/p_372983lw41.jpg" 
              alt="Chifa Brillo El Sol Logo" 
              className="w-28 h-28 rounded-full object-cover shadow-[0_0_30px_rgba(211,47,47,0.3)] border border-black/10 dark:border-white/10"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-silk-white-light dark:text-silk-white-dark tracking-wide">
              CHIFA <span className="gold-text">BRILLO EL SOL</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-sans text-[10px] tracking-[0.3em] uppercase mt-2 font-semibold">
              Sistema de Gestión Elite
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Input */}
            <div className="relative flex items-center bg-gray-100 dark:bg-[#141414] border border-black/5 dark:border-white/5 rounded-xl overflow-hidden focus-within:border-gold-champagne/50 transition-colors">
              <div className="pl-3 pr-2 py-3">
                <div className="bg-dragon-red p-1.5 rounded-full">
                  {isResetting ? <Mail className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                </div>
              </div>
              <input 
                type="text" 
                placeholder="Usuario o Correo" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent border-none text-sm text-silk-white-light dark:text-white focus:ring-0 py-4 pr-4 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            {/* Password Input */}
            {!isResetting && (
              <div className="relative flex items-center bg-gray-100 dark:bg-[#141414] border border-black/5 dark:border-white/5 rounded-xl overflow-hidden focus-within:border-gold-champagne/50 transition-colors">
                <div className="pl-3 pr-2 py-3">
                  <div className="bg-dragon-red p-1.5 rounded-full">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Contraseña" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex-1 bg-transparent border-none text-sm text-silk-white-light dark:text-white focus:ring-0 py-4 pr-10 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Options Row */}
            {!isResetting && (
              <div className="flex items-center justify-between text-[10px] md:text-xs mt-2 px-1">
                <label 
                  className="flex items-center space-x-2 cursor-pointer group"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    rememberMe ? "border-dragon-red bg-dragon-red/10" : "border-black/10 dark:border-white/20 bg-gray-100 dark:bg-[#141414]"
                  )}>
                    {rememberMe && <div className="w-2 h-2 bg-dragon-red rounded-sm"></div>}
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 font-medium tracking-wider">RECORDARME</span>
                </label>
                <button 
                  type="button" 
                  onClick={() => { setIsResetting(true); setIsRegistering(false); }}
                  className="text-gray-500 dark:text-gray-400 hover:text-gold-champagne transition-colors font-medium tracking-wider"
                >
                  ¿OLVIDASTE TU CONTRASEÑA?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 text-sm font-bold tracking-widest uppercase mt-2 bg-[#8B1A1A] hover:bg-[#A52A2A] text-white border-none rounded-xl"
            >
              {loading ? 'PROCESANDO...' : isResetting ? 'ENVIAR ENLACE' : isRegistering ? 'CREAR CUENTA' : 'ENTRAR'}
            </Button>
          </form>

          {/* Toggle Register/Login/Reset */}
          <div className="mt-4 text-center">
            <button 
              type="button"
              onClick={() => {
                if (isResetting) {
                  setIsResetting(false);
                } else {
                  setIsRegistering(!isRegistering);
                }
              }}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              {isResetting 
                ? 'Volver al inicio de sesión' 
                : isRegistering 
                  ? '¿Ya tienes cuenta? Inicia sesión' 
                  : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center py-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 text-white/20 text-xs">o</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Alternative Logins */}
          <div className="space-y-3">
            <Button 
              onClick={handleGoogleLogin} 
              disabled={loading}
              className="w-full h-12 text-sm font-medium bg-white hover:bg-gray-100 text-black border-none rounded-xl flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuar con Google
            </Button>
            
            <Button 
              onClick={handleGuestLogin} 
              disabled={loading}
              className="w-full h-12 text-xs font-bold tracking-widest uppercase bg-transparent hover:bg-white/5 text-gold-champagne border border-white/10 rounded-xl"
            >
              Ingresar como Invitado
            </Button>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
