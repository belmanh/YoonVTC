import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { createUserProfile, getUserProfile, FirestoreUserProfile } from './dbService';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

/**
 * Nettoie et formate un numéro de téléphone sénégalais au format E.164 (+221XXXXXXXXX)
 * Supporte :
 *  - 77 123 45 67 -> +221771234567
 *  - 00221 78 123 45 67 -> +221781234567
 *  - +221 76 123 45 67 -> +221761234567
 *  - 70 / 75 / 33 etc.
 */
export function formatSenegalPhoneNumber(input: string): string {
  if (!input) return '';
  
  // Supprime tous les caractères non numériques sauf le '+' initial
  let cleaned = input.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('00221')) {
    cleaned = '+' + cleaned.substring(2);
  } else if (cleaned.startsWith('221') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+221') && !cleaned.startsWith('+')) {
    // Si l'utilisateur tape 77xxxxxxx (9 chiffres)
    if (cleaned.length === 9) {
      cleaned = '+221' + cleaned;
    }
  }

  return cleaned;
}

/**
 * Valide si le numéro correspond à un format sénégalais valide (+221 suivi de 9 chiffres)
 * Opérateurs : 77 (Orange), 78 (Orange), 76 (Free/Tigo), 70 (Expresso), 75 (Promobile), 33 (Fixe)
 */
export function isValidSenegalPhoneNumber(phone: string): boolean {
  const formatted = formatSenegalPhoneNumber(phone);
  const regex = /^\+221(70|75|76|77|78|33)\d{7}$/;
  return regex.test(formatted);
}

/**
 * Initialise le RecaptchaVerifier Firebase
 */
export function initRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase n\'est pas encore configuré. Vérifiez vos variables VITE_FIREBASE_*.');
  }

  // Nettoyage de l'instance précédente si existante
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // Ignorer
    }
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('[Recaptcha] Résolu avec succès');
    },
    'expired-callback': () => {
      console.warn('[Recaptcha] Expiré, réinitialisation requise');
    },
  });

  return window.recaptchaVerifier;
}

/**
 * 1. Envoi du SMS OTP au numéro sénégalais
 */
export async function sendOTP(
  phoneNumber: string,
  recaptchaContainerId: string = 'recaptcha-container'
): Promise<ConfirmationResult> {
  const formattedPhone = formatSenegalPhoneNumber(phoneNumber);

  if (!isValidSenegalPhoneNumber(formattedPhone)) {
    throw new Error(
      `Format de numéro sénégalais invalide : "${phoneNumber}". ` +
      `Le numéro doit comporter 9 chiffres (ex: 77 123 45 67 ou +221 78 987 65 43).`
    );
  }

  if (!isFirebaseConfigured) {
    console.warn('[Auth Mock] Firebase non configuré. Mode simulation activé pour le numéro :', formattedPhone);
    const mockConfirmationResult = {
      verificationId: `mock_verif_${Date.now()}`,
      confirm: async (otp: string) => {
        if (otp === '123456' || otp.length === 6) {
          const mockUser: any = {
            uid: `usr_sn_${formattedPhone.replace(/\D/g, '').slice(-9)}`,
            phoneNumber: formattedPhone,
            displayName: 'Utilisateur Yoon VTC',
          };
          return { user: mockUser };
        }
        throw new Error('Code OTP invalide. Entrez 123456 pour le mode démo.');
      },
    } as unknown as ConfirmationResult;

    window.confirmationResult = mockConfirmationResult;
    return mockConfirmationResult;
  }

  try {
    const appVerifier = initRecaptchaVerifier(recaptchaContainerId);
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error: any) {
    console.error('[sendOTP Error]', error);
    if (error?.code === 'auth/invalid-phone-number') {
      throw new Error('Numéro de téléphone invalide pour l\'envoi SMS.');
    } else if (error?.code === 'auth/too-many-requests') {
      throw new Error('Trop de tentatives SMS envoyées. Veuillez patienter quelques minutes.');
    } else if (error?.code === 'auth/quota-exceeded') {
      throw new Error('Quota d\'envoi SMS Firebase atteint pour la journée.');
    }
    throw new Error(error.message || 'Impossible d\'envoyer le SMS OTP');
  }
}

/**
 * 2. Vérification du code OTP et création / récupération du profil Firestore
 */
export async function verifyOTP(
  confirmationResult: ConfirmationResult,
  otpCode: string,
  profileData?: {
    fullName?: string;
    role?: 'passenger' | 'driver';
    vehicleDetails?: any;
  }
): Promise<{ user: User; profile: FirestoreUserProfile | null }> {
  if (!otpCode || otpCode.trim().length !== 6) {
    throw new Error('Le code de vérification doit comporter exactement 6 chiffres.');
  }

  try {
    const credential = await confirmationResult.confirm(otpCode.trim());
    const user = credential.user;

    // Récupérer ou initialiser le profil Firestore
    let existingProfile: FirestoreUserProfile | null = null;
    if (isFirebaseConfigured) {
      try {
        existingProfile = await getUserProfile(user.uid);
        if (!existingProfile) {
          await createUserProfile(user.uid, {
            phone: user.phoneNumber || '',
            fullName: profileData?.fullName || 'Utilisateur Yoon',
            role: profileData?.role || 'passenger',
            vehicleDetails: profileData?.vehicleDetails,
            isVerified: true,
          });
          existingProfile = await getUserProfile(user.uid);
        }
      } catch (dbErr) {
        console.warn('[DB Sync warning]', dbErr);
      }
    } else {
      existingProfile = {
        uid: user.uid,
        phone: user.phoneNumber || '+221770000000',
        fullName: profileData?.fullName || 'Utilisateur Démo',
        role: profileData?.role || 'passenger',
        walletBalance: 25000,
        createdAt: new Date().toISOString(),
        isVerified: true,
        ratingAvg: 5.0,
      };
    }

    return { user, profile: existingProfile };
  } catch (error: any) {
    console.error('[verifyOTP Error]', error);
    if (error?.code === 'auth/invalid-verification-code') {
      throw new Error('Code de confirmation SMS incorrect.');
    } else if (error?.code === 'auth/code-expired') {
      throw new Error('Le code SMS a expiré. Veuillez demander un nouveau code.');
    }
    throw new Error(error.message || 'Échec de la validation du code OTP');
  }
}

/**
 * Déconnexion de l'utilisateur
 */
export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured && auth) {
    await signOut(auth);
  }
}

/**
 * Écouteur de changement d'état d'authentification
 */
export function onAuthUserChanged(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export default {
  formatSenegalPhoneNumber,
  isValidSenegalPhoneNumber,
  sendOTP,
  verifyOTP,
  signOutUser,
  onAuthUserChanged,
};
