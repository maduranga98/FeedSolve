import { useEffect, useState, useContext, createContext, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User, AuthContextType } from '../types';
import { auth } from '../lib/firebase';
import { createUser, createCompany, getUser } from '../lib/firestore';
import { getFirebaseErrorMessage } from '../lib/firebase-errors';

const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = await getUser(firebaseUser.uid);
        if (userData) {
          setUser(userData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string,
    companyName: string
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const companyId = result.user.uid;
      await createCompany(companyId, companyName, email);
      const newUser = await createUser(result.user.uid, email, name, companyId, 'admin');
      setUser(newUser);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getUser(result.user.uid);
      if (userData) setUser(userData);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;
      let userData = await getUser(uid);
      if (!userData) {
        const name = result.user.displayName || 'User';
        const email = result.user.email || '';
        await createCompany(uid, `${name}'s Workspace`, email);
        userData = await createUser(uid, email, name, uid, 'admin');
      }
      if (userData) setUser(userData);
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) return;
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const loginWithApple = async () => {
    try {
      const result = await signInWithPopup(auth, appleProvider);
      const uid = result.user.uid;
      let userData = await getUser(uid);
      if (!userData) {
        const name = result.user.displayName || 'User';
        const email = result.user.email || '';
        await createCompany(uid, `${name}'s Workspace`, email);
        userData = await createUser(uid, email, name, uid, 'admin');
      }
      if (userData) setUser(userData);
    } catch (error: any) {
      if (
        error?.code === 'auth/popup-closed-by-user' ||
        error?.code === 'auth/cancelled-popup-request'
      ) return;
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, login, loginWithGoogle, loginWithApple, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
