/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { useAuthStore } from './store/useAuthStore';
import { useAppStore } from './store/useAppStore';
import { useMenuStore } from './store/useMenuStore';

import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChatPage } from './pages/ChatPage';
import { MenuPage } from './pages/MenuPage';
import { ProfilePage } from './pages/ProfilePage';
import { ConfigPage } from './pages/ConfigPage';
import { UsersPage } from './pages/UsersPage';
import { InfoPage } from './pages/InfoPage';
import { QuizPage } from './pages/QuizPage';
import { TrainingPage } from './pages/TrainingPage';

export default function App() {
  const { setUser, setUserRole, setAuthReady } = useAuthStore();
  const { setProfile } = useAppStore();
  const { fetchMenu } = useMenuStore();

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user', 'UID:', user ? user.uid : 'N/A');
      setUser(user);
      
      // Set auth ready immediately so the app can start rendering
      // The profile will load in the background
      setAuthReady(true);

      // Clean up previous profile subscription if any
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        console.log('Processing user profile for:', user.email);
        if (user.isAnonymous) {
          setUserRole('guest');
          setProfile({
            uid: user.uid,
            displayName: 'Invitado',
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
        } else {
          // Listen to user profile in real-time
          const userDocRef = doc(db, 'users', user.uid);
          unsubscribeProfile = onSnapshot(userDocRef, (userDoc) => {
            const isCreator = user.email === 'qmisael386@gmail.com';
            
            if (userDoc.exists()) {
              const data = userDoc.data();
              const finalRole = isCreator ? 'admin' : data.role;
              setUserRole(finalRole);
              setProfile({ ...data, role: finalRole } as any);
              
              // If creator role was not admin in DB, update it in background
              if (isCreator && data.role !== 'admin') {
                setDoc(userDocRef, { role: 'admin' }, { merge: true }).catch(console.error);
              }
            } else {
              // Create new user doc in background
              const defaultRole = isCreator ? 'admin' : 'user';
              const newProfile = {
                uid: user.uid,
                displayName: user.displayName || 'Nuevo Usuario',
                email: user.email || '',
                photoURL: user.photoURL || '',
                role: defaultRole,
                points: isCreator ? 9999 : 0,
                rank: isCreator ? 'Gran Maestro' : 'Aprendiz',
                examsCompleted: 0,
                accuracy: 0,
                achievements: isCreator ? ['creator'] : [],
                currentStreak: 0,
                bestStreak: 0,
                perfectExams: 0,
                bestTime: 0,
                createdAt: new Date().toISOString(),
              };
              
              setUserRole(defaultRole);
              setProfile(newProfile as any);
              
              // Save to Firestore in background
              setDoc(userDocRef, newProfile).catch(console.error);
            }
          }, (error) => {
            console.error('Error listening to user profile:', error);
            const errInfo = {
              error: error.message,
              operationType: 'get',
              path: `users/${user.uid}`,
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
            // Fallback to basic profile if Firestore fails
            const isCreator = user.email === 'qmisael386@gmail.com';
            const fallbackRole = isCreator ? 'admin' : 'user';
            setUserRole(fallbackRole);
            setProfile({
              uid: user.uid,
              displayName: user.displayName || 'Usuario',
              email: user.email || '',
              photoURL: user.photoURL || '',
              role: fallbackRole,
              points: 0,
              rank: fallbackRole === 'admin' ? 'Gran Maestro' : 'Aprendiz',
              examsCompleted: 0,
              accuracy: 0,
              achievements: [],
            } as any);
          });
        }
      } else {
        // Only clear role if we are NOT in local guest mode
        if (!useAuthStore.getState().localGuest) {
          setUserRole(null);
          setProfile(null);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [setUser, setUserRole, setAuthReady, setProfile]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="config" element={<ConfigPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="training" element={<TrainingPage />} />
          <Route path="exam" element={<QuizPage />} />
          <Route path="info" element={<InfoPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
