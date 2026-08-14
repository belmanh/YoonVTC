import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ConfirmationResult } from 'firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';
import {
  sendOTP as authSendOTP,
  verifyOTP as authVerifyOTP,
  signOutUser as authSignOut,
  onAuthUserChanged,
} from '../services/authService';
import { getUserProfile, createUserProfile, FirestoreUserProfile } from '../services/dbService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: FirestoreUserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  confirmationResult: ConfirmationResult | null;
  sendOTPCode: (phone: string, containerId?: string) => Promise<ConfirmationResult>;
  verifyOTPCode: (
    otp: string,
    profileData?: { fullName?: string; role?: 'passenger' | 'driver'; vehicleDetails?: any }
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setUserProfileDirect: (profile: FirestoreUserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<FirestoreUserProfile | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Écoute des changements d'état Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthUserChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (err) {
          console.error('[AuthContext] Erreur chargement profil Firestore', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // 1. Envoyer le code OTP SMS
  const sendOTPCode = async (phone: string, containerId: string = 'recaptcha-container') => {
    setLoading(true);
    try {
      const res = await authSendOTP(phone, containerId);
      setConfirmationResult(res);
      return res;
    } finally {
      setLoading(false);
    }
  };

  // 2. Vérifier le code OTP SMS
  const verifyOTPCode = async (
    otp: string,
    profileData?: { fullName?: string; role?: 'passenger' | 'driver'; vehicleDetails?: any }
  ) => {
    if (!confirmationResult) {
      throw new Error('Aucune demande d\'OTP en cours. Veuillez demander un code d\'abord.');
    }
    setLoading(true);
    try {
      const { user, profile } = await authVerifyOTP(confirmationResult, otp, profileData);
      setCurrentUser(user);
      setUserProfile(profile);
      setConfirmationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // 3. Déconnexion
  const logout = async () => {
    setLoading(true);
    try {
      await authSignOut();
      setCurrentUser(null);
      setUserProfile(null);
      setConfirmationResult(null);
    } finally {
      setLoading(false);
    }
  };

  // 4. Rafraîchir le profil depuis Firestore
  const refreshProfile = async () => {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isConfigured: isFirebaseConfigured,
        confirmationResult,
        sendOTPCode,
        verifyOTPCode,
        logout,
        refreshProfile,
        setUserProfileDirect: setUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
