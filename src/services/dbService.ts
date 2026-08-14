import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  GeoPoint,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase/config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Gestionnaire d'erreur standardisé Firestore
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      phoneNumber: auth?.currentUser?.phoneNumber,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('[Firestore Error Details]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Interfaces des documents Firestore
export interface FirestoreUserProfile {
  uid: string;
  phone: string; // Ex: '+221771234567'
  fullName: string;
  role: 'passenger' | 'driver' | 'admin';
  walletBalance: number; // en FCFA
  createdAt: any;
  isVerified: boolean;
  ratingAvg?: number;
  avatarUrl?: string;
  // Champs spécifiques aux chauffeurs
  vehicleDetails?: {
    brand: string;
    model: string;
    plateNumber: string;
    category: 'eco' | 'standard' | 'confort' | 'interurbain';
    color: string;
    year: number;
  };
  documents?: {
    cniUrl?: string;
    licenseUrl?: string;
    carteGriseUrl?: string;
    assuranceUrl?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  isOnline?: boolean;
  isBusy?: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    updatedAt?: any;
  };
}

export interface FirestoreRide {
  id: string;
  passengerId: string;
  passengerName?: string;
  passengerPhone?: string;
  driverId?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
    zone?: string;
  };
  destinationLocation: {
    address: string;
    lat: number;
    lng: number;
    zone?: string;
  };
  category: 'eco' | 'standard' | 'confort' | 'interurbain';
  fareAmount: number; // en FCFA
  paymentMethod: 'cash' | 'wave' | 'orange_money';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  status: 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  commissionAmount?: number;
  driverNetEarnings?: number;
  distanceKm?: number;
  durationMinutes?: number;
  createdAt: any;
  acceptedAt?: any;
  completedAt?: any;
}

export interface FirestoreTransaction {
  id: string;
  userId: string;
  amount: number; // FCFA
  type: 'ride_fee' | 'commission' | 'deposit' | 'withdrawal';
  provider: 'wave' | 'orange_money' | 'cash';
  status: 'pending' | 'success' | 'failed';
  createdAt: any;
  reference?: string;
  rideId?: string;
}

// ==========================================
// 1. SERVICES UTILISATEURS (USERS)
// ==========================================

export async function getUserProfile(uid: string): Promise<FirestoreUserProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  const path = `users/${uid}`;
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as FirestoreUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createUserProfile(uid: string, profileData: Partial<FirestoreUserProfile>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const path = `users/${uid}`;
  try {
    const defaultData: FirestoreUserProfile = {
      uid,
      phone: profileData.phone || '',
      fullName: profileData.fullName || 'Utilisateur Yoon',
      role: profileData.role || 'passenger',
      walletBalance: profileData.walletBalance || 0,
      createdAt: serverTimestamp(),
      isVerified: profileData.isVerified || true,
      ratingAvg: 5.0,
      ...(profileData.role === 'driver' && {
        isOnline: false,
        isBusy: false,
        vehicleDetails: profileData.vehicleDetails || {
          brand: 'Peugeot',
          model: '301',
          plateNumber: 'DK-1000-AA',
          category: 'standard',
          color: 'Gris',
          year: 2022,
        },
        documents: {
          status: 'pending',
        },
      }),
      ...profileData,
    };

    await setDoc(doc(db, 'users', uid), defaultData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(uid: string, updates: Partial<FirestoreUserProfile>): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), updates as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading: number = 0
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const path = `users/${driverId}`;
  try {
    await updateDoc(doc(db, 'users', driverId), {
      currentLocation: {
        lat,
        lng,
        heading,
        updatedAt: serverTimestamp(),
      },
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setDriverOnlineStatus(driverId: string, isOnline: boolean): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const path = `users/${driverId}`;
  try {
    await updateDoc(doc(db, 'users', driverId), {
      isOnline,
      ...(isOnline === false && { isBusy: false }),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==========================================
// 2. SERVICES COURSES (RIDES)
// ==========================================

export async function createRide(rideData: Omit<FirestoreRide, 'id' | 'createdAt'>): Promise<string> {
  if (!isFirebaseConfigured || !db) return `RIDE_MOCK_${Date.now()}`;
  const rideRef = doc(collection(db, 'rides'));
  const path = `rides/${rideRef.id}`;
  try {
    const fullData: FirestoreRide = {
      ...rideData,
      id: rideRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(rideRef, fullData);
    return rideRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getRide(rideId: string): Promise<FirestoreRide | null> {
  if (!isFirebaseConfigured || !db) return null;
  const path = `rides/${rideId}`;
  try {
    const docSnap = await getDoc(doc(db, 'rides', rideId));
    if (docSnap.exists()) {
      return docSnap.data() as FirestoreRide;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateRideStatus(
  rideId: string,
  status: FirestoreRide['status'],
  additionalData?: Partial<FirestoreRide>
): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const path = `rides/${rideId}`;
  try {
    await updateDoc(doc(db, 'rides', rideId), {
      status,
      ...additionalData,
      ...(status === 'accepted' && { acceptedAt: serverTimestamp() }),
      ...(status === 'completed' && { completedAt: serverTimestamp() }),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Écoute en temps réel d'une course active
 */
export function listenToActiveRide(rideId: string, callback: (ride: FirestoreRide | null) => void): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const path = `rides/${rideId}`;
  return onSnapshot(
    doc(db, 'rides', rideId),
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as FirestoreRide);
      } else {
        callback(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Écoute en temps réel des courses demandées à proximité (pour chauffeurs)
 */
export function listenToRequestedRides(callback: (rides: FirestoreRide[]) => void): Unsubscribe {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }
  const path = 'rides';
  const q = query(
    collection(db, 'rides'),
    where('status', '==', 'requested'),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const rides: FirestoreRide[] = [];
      snapshot.forEach((docSnap) => {
        rides.push(docSnap.data() as FirestoreRide);
      });
      callback(rides);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

// ==========================================
// 3. SERVICES TRANSACTIONS & PORTEFEUILLE
// ==========================================

export async function createTransaction(
  txnData: Omit<FirestoreTransaction, 'id' | 'createdAt'>
): Promise<string> {
  if (!isFirebaseConfigured || !db) return `TXN_${Date.now()}`;
  const txnRef = doc(collection(db, 'transactions'));
  const path = `transactions/${txnRef.id}`;
  try {
    const fullData: FirestoreTransaction = {
      ...txnData,
      id: txnRef.id,
      createdAt: serverTimestamp(),
    };
    await setDoc(txnRef, fullData);
    return txnRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUserTransactions(userId: string): Promise<FirestoreTransaction[]> {
  if (!isFirebaseConfigured || !db) return [];
  const path = 'transactions';
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snap = await getDocs(q);
    const results: FirestoreTransaction[] = [];
    snap.forEach((d) => results.push(d.data() as FirestoreTransaction));
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Déduction automatique de la commission plateforme du portefeuille chauffeur (Modèle Yango)
 */
export async function deductDriverCommission(
  driverId: string,
  rideId: string,
  commissionAmount: number,
  rideFare: number,
  paymentMethod: 'cash' | 'wave' | 'orange_money' = 'cash'
): Promise<{ newBalance: number; transactionId: string }> {
  let newBalance = 0;
  let transactionId = `TXN_COMM_${Date.now()}`;

  if (isFirebaseConfigured && db) {
    const path = `users/${driverId}`;
    try {
      const userRef = doc(db, 'users', driverId);
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.exists() ? (userSnap.data().walletBalance || 0) : 0;
      newBalance = Math.max(0, currentBalance - commissionAmount);

      // Mise à jour du solde du chauffeur
      await updateDoc(userRef, {
        walletBalance: newBalance,
        // Si le solde passe en-dessous du seuil de 1 000 FCFA, désactiver le statut en ligne
        ...(newBalance < 1000 ? { isOnline: false } : {}),
      });

      // Enregistrement de l'historique dans la collection 'transactions'
      transactionId = await createTransaction({
        userId: driverId,
        amount: -commissionAmount,
        type: 'commission',
        provider: paymentMethod,
        status: 'success',
        reference: `Commission course #${rideId} (15% sur ${rideFare} FCFA direct)`,
        rideId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return { newBalance, transactionId };
}

/**
 * Recharge du portefeuille de crédit chauffeur via Wave ou Orange Money
 */
export async function rechargeDriverWallet(
  driverId: string,
  amount: number,
  provider: 'wave' | 'orange_money',
  reference?: string
): Promise<{ newBalance: number; transactionId: string }> {
  let newBalance = 0;
  let transactionId = `TXN_DEP_${Date.now()}`;

  if (isFirebaseConfigured && db) {
    const path = `users/${driverId}`;
    try {
      const userRef = doc(db, 'users', driverId);
      const userSnap = await getDoc(userRef);
      const currentBalance = userSnap.exists() ? (userSnap.data().walletBalance || 0) : 0;
      newBalance = currentBalance + amount;

      await updateDoc(userRef, {
        walletBalance: newBalance,
      });

      transactionId = await createTransaction({
        userId: driverId,
        amount,
        type: 'deposit',
        provider,
        status: 'success',
        reference: reference || `Recharge crédit chauffeur (+${amount} FCFA via ${provider})`,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  return { newBalance, transactionId };
}

export default {
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  updateDriverLocation,
  setDriverOnlineStatus,
  createRide,
  getRide,
  updateRideStatus,
  listenToActiveRide,
  listenToRequestedRides,
  createTransaction,
  getUserTransactions,
  deductDriverCommission,
  rechargeDriverWallet,
};
