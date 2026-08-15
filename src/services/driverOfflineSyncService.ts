import { GeoLocation, Ride, Driver, VehicleCategory, PaymentMethod } from '../types/vtc';
import { updateDriverLocation, updateRideStatus, setDriverOnlineStatus } from './dbService';

export type OfflineActionType = 'gps_location' | 'ride_status' | 'driver_status' | 'wallet_action';

export interface OfflineQueueItem {
  id: string;
  type: OfflineActionType;
  driverId: string;
  timestamp: number;
  syncAttempts: number;
  lastError?: string;
  payload: {
    // gps_location payload
    lat?: number;
    lng?: number;
    heading?: number;
    // ride_status payload
    rideId?: string;
    status?: 'requested' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
    additionalData?: Record<string, any>;
    // driver_status payload
    isOnline?: boolean;
    // generic payload
    metadata?: Record<string, any>;
  };
}

export interface SyncStats {
  isOnline: boolean;
  isSimulatedOffline: boolean;
  pendingCount: number;
  pendingLocationsCount: number;
  pendingRideStatusCount: number;
  lastSyncTime: string | null;
  lastSyncSuccessCount: number;
  lastSyncError: string | null;
  storageUsageBytes: number;
}

const STORAGE_KEYS = {
  QUEUE: 'yoon_driver_offline_queue',
  ACTIVE_RIDE_CACHE: 'yoon_driver_active_ride_cache',
  DRIVER_PROFILE_CACHE: 'yoon_driver_profile_cache',
  SIMULATED_OFFLINE: 'yoon_driver_simulated_offline',
  LAST_SYNC: 'yoon_driver_last_sync_timestamp',
  STORAGE_ENGINE: 'yoon_driver_storage_engine',
};

// Limite maximale de pings GPS stockés localement pour éviter de saturer le localStorage
const MAX_STORED_GPS_PINGS = 150;

// IndexedDB Helper pour persistance avancée
const DB_NAME = 'YoonDriverOfflineDB';
const DB_VERSION = 1;
const STORE_GPS = 'gps_telemetry';
const STORE_RIDES = 'ride_events';

class DriverIndexedDbStorage {
  private db: IDBDatabase | null = null;
  private isAvailable: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.isAvailable = false;
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_GPS)) {
          db.createObjectStore(STORE_GPS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_RIDES)) {
          db.createObjectStore(STORE_RIDES, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e: any) => {
        this.db = e.target.result;
        this.isAvailable = true;
      };
      request.onerror = () => {
        this.isAvailable = false;
      };
    } catch (e) {
      this.isAvailable = false;
    }
  }

  public async saveItem(storeName: string, item: any): Promise<void> {
    if (!this.db || !this.isAvailable) return;
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
    } catch (e) {
      // Ignorer silencieusement si IndexedDB est bloqué dans l'iframe
    }
  }

  public async clearStore(storeName: string): Promise<void> {
    if (!this.db || !this.isAvailable) return;
    try {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
    } catch (e) {}
  }
}

const idbStorage = new DriverIndexedDbStorage();

class DriverOfflineSyncService {
  private isSimulatedOffline: boolean = false;
  private isSyncing: boolean = false;
  private listeners: Set<(stats: SyncStats) => void> = new Set();
  private autoSyncInterval: any = null;
  private lastSyncTime: string | null = null;
  private lastSyncSuccessCount: number = 0;
  private lastSyncError: string | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Vérifier l'état de simulation persisté
    try {
      const sim = localStorage.getItem(STORAGE_KEYS.SIMULATED_OFFLINE);
      if (sim !== null) {
        this.isSimulatedOffline = JSON.parse(sim);
      }
      const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSync) {
        this.lastSyncTime = lastSync;
      }
    } catch (e) {
      console.warn('[OfflineSync] Erreur lecture localStorage au démarrage :', e);
    }

    // Écouteurs d'événements réseau natifs du navigateur
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineSync] Connexion réseau rétablie (Événement Online)');
        this.notifyListeners();
        this.syncPendingQueue();
      });

      window.addEventListener('offline', () => {
        console.log('[OfflineSync] Perte de connexion réseau (Événement Offline)');
        this.notifyListeners();
      });

      // Intervalle de vérification automatique et de synchronisation périodique
      this.autoSyncInterval = setInterval(() => {
        if (this.isOnline() && !this.isSyncing && this.getPendingQueue().length > 0) {
          this.syncPendingQueue();
        }
      }, 8000);
    }
  }

  /**
   * Détermine si le chauffeur est actuellement considéré comme connecté (en ligne)
   */
  public isOnline(): boolean {
    if (this.isSimulatedOffline) {
      return false;
    }
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Bascule le mode de simulation déconnecté pour tester la résilience hors-ligne
   */
  public toggleNetworkSimulation(forceState?: boolean): boolean {
    const newState = forceState !== undefined ? forceState : !this.isSimulatedOffline;
    this.isSimulatedOffline = newState;
    try {
      localStorage.setItem(STORAGE_KEYS.SIMULATED_OFFLINE, JSON.stringify(newState));
    } catch (e) {
      console.warn('[OfflineSync] Erreur sauvegarde simulation :', e);
    }
    this.notifyListeners();

    if (!newState && this.isOnline()) {
      // Reconnexion : déclencher la synchronisation immédiate
      this.syncPendingQueue();
    }
    return this.isSimulatedOffline;
  }

  /**
   * Récupère la file d'attente complète des actions hors-ligne
   */
  public getPendingQueue(): OfflineQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUEUE);
      if (!data) return [];
      return JSON.parse(data) as OfflineQueueItem[];
    } catch (e) {
      console.error('[OfflineSync] Erreur lecture file d\'attente :', e);
      return [];
    }
  }

  /**
   * Sauvegarde la file d'attente dans le localStorage
   */
  private savePendingQueue(queue: OfflineQueueItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));
      this.notifyListeners();
    } catch (e) {
      console.error('[OfflineSync] Erreur écriture file d\'attente :', e);
    }
  }

  /**
   * Ajoute une mise à jour de position GPS à la file d'attente hors-ligne
   */
  public queueLocationUpdate(driverId: string, lat: number, lng: number, heading: number = 0): void {
    const queue = this.getPendingQueue();

    const newItem: OfflineQueueItem = {
      id: `gps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'gps_location',
      driverId,
      timestamp: Date.now(),
      syncAttempts: 0,
      payload: {
        lat,
        lng,
        heading,
      },
    };

    // Gestion de la limite de taille : conserver les dernières positions les plus récentes
    const gpsItems = queue.filter((item) => item.type === 'gps_location');
    const nonGpsItems = queue.filter((item) => item.type !== 'gps_location');

    let updatedGps = [...gpsItems, newItem];
    if (updatedGps.length > MAX_STORED_GPS_PINGS) {
      // Garder les MAX_STORED_GPS_PINGS plus récents
      updatedGps = updatedGps.slice(updatedGps.length - MAX_STORED_GPS_PINGS);
    }

    const updatedQueue = [...nonGpsItems, ...updatedGps];
    this.savePendingQueue(updatedQueue);
    idbStorage.saveItem(STORE_GPS, newItem).catch(() => {});
    console.log(`[OfflineSync] Position GPS mise en file d'attente locale (${lat.toFixed(4)}, ${lng.toFixed(4)}). Total en attente : ${updatedQueue.length}`);
  }

  /**
   * Ajoute un changement de statut de course à la file d'attente hors-ligne
   */
  public queueRideStatusUpdate(
    driverId: string,
    rideId: string,
    status: OfflineQueueItem['payload']['status'],
    additionalData?: Record<string, any>
  ): void {
    const queue = this.getPendingQueue();

    const newItem: OfflineQueueItem = {
      id: `ride_${status}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'ride_status',
      driverId,
      timestamp: Date.now(),
      syncAttempts: 0,
      payload: {
        rideId,
        status,
        additionalData,
      },
    };

    const updatedQueue = [...queue, newItem];
    this.savePendingQueue(updatedQueue);
    idbStorage.saveItem(STORE_RIDES, newItem).catch(() => {});
    console.log(`[OfflineSync] Statut de course [${status}] pour ride #${rideId} mis en file d'attente locale`);
  }

  /**
   * Ajoute un changement d'état En Ligne / Hors Ligne à la file d'attente
   */
  public queueDriverStatus(driverId: string, isOnline: boolean): void {
    const queue = this.getPendingQueue();

    const newItem: OfflineQueueItem = {
      id: `drv_status_${Date.now()}`,
      type: 'driver_status',
      driverId,
      timestamp: Date.now(),
      syncAttempts: 0,
      payload: {
        isOnline,
      },
    };

    const updatedQueue = [...queue, newItem];
    this.savePendingQueue(updatedQueue);
  }

  /**
   * Met en cache l'état complet de la course active en local
   */
  public saveActiveRideCache(ride: Ride | null): void {
    try {
      if (ride) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_RIDE_CACHE, JSON.stringify(ride));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_RIDE_CACHE);
      }
      this.notifyListeners();
    } catch (e) {
      console.warn('[OfflineSync] Erreur sauvegarde cache course :', e);
    }
  }

  /**
   * Récupère la course active mise en cache
   */
  public getActiveRideCache(): Ride | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_RIDE_CACHE);
      if (!data) return null;
      return JSON.parse(data) as Ride;
    } catch (e) {
      return null;
    }
  }

  /**
   * Met en cache le profil du chauffeur
   */
  public saveDriverProfileCache(driver: Driver): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DRIVER_PROFILE_CACHE, JSON.stringify(driver));
    } catch (e) {
      console.warn('[OfflineSync] Erreur sauvegarde cache chauffeur :', e);
    }
  }

  /**
   * Récupère le profil du chauffeur en cache
   */
  public getDriverProfileCache(): Driver | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRIVER_PROFILE_CACHE);
      if (!data) return null;
      return JSON.parse(data) as Driver;
    } catch (e) {
      return null;
    }
  }

  /**
   * Exécute la synchronisation de tous les éléments en attente vers le serveur / Firestore
   */
  public async syncPendingQueue(): Promise<{
    success: boolean;
    syncedCount: number;
    failedCount: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      return { success: false, syncedCount: 0, failedCount: 0, error: 'Synchronisation déjà en cours' };
    }

    if (!this.isOnline()) {
      return { success: false, syncedCount: 0, failedCount: 0, error: 'Appareil hors ligne' };
    }

    const queue = this.getPendingQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    console.log(`[OfflineSync] Début synchronisation de ${queue.length} éléments en attente...`);

    const remainingQueue: OfflineQueueItem[] = [];
    let syncedCount = 0;
    let failedCount = 0;

    // Trier par timestamp croissant pour exécuter les actions dans l'ordre chronologique exact
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    for (const item of sortedQueue) {
      try {
        if (item.type === 'gps_location') {
          const { lat, lng, heading } = item.payload;
          if (lat !== undefined && lng !== undefined) {
            await updateDriverLocation(item.driverId, lat, lng, heading || 0);
            syncedCount++;
          }
        } else if (item.type === 'ride_status') {
          const { rideId, status, additionalData } = item.payload;
          if (rideId && status) {
            // Mettre à jour le statut Firestore
            await updateRideStatus(rideId, status, additionalData);
            syncedCount++;
          }
        } else if (item.type === 'driver_status') {
          const { isOnline } = item.payload;
          if (isOnline !== undefined) {
            await setDriverOnlineStatus(item.driverId, isOnline);
            syncedCount++;
          }
        }
      } catch (err) {
        console.warn(`[OfflineSync] Échec envoi élément ${item.id} :`, err);
        item.syncAttempts += 1;
        item.lastError = err instanceof Error ? err.message : String(err);
        
        // Conserver si moins de 10 tentatives
        if (item.syncAttempts < 10) {
          remainingQueue.push(item);
        }
        failedCount++;
      }
    }

    this.savePendingQueue(remainingQueue);
    this.isSyncing = false;

    const timestampStr = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    if (syncedCount > 0) {
      this.lastSyncTime = timestampStr;
      this.lastSyncSuccessCount = syncedCount;
      this.lastSyncError = null;
      try {
        localStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestampStr);
      } catch (e) {}
    } else if (failedCount > 0) {
      this.lastSyncError = `${failedCount} élément(s) non transmis`;
    }

    this.notifyListeners();
    console.log(`[OfflineSync] Synchronisation terminée : ${syncedCount} transmis, ${failedCount} en échec / restant.`);

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount,
    };
  }

  /**
   * Efface manuellement la file d'attente
   */
  public clearQueue(): void {
    this.savePendingQueue([]);
    idbStorage.clearStore(STORE_GPS).catch(() => {});
    idbStorage.clearStore(STORE_RIDES).catch(() => {});
  }

  /**
   * Calcule les métriques actuelles de synchronisation
   */
  public getStats(): SyncStats {
    const queue = this.getPendingQueue();
    const pendingLocationsCount = queue.filter((i) => i.type === 'gps_location').length;
    const pendingRideStatusCount = queue.filter((i) => i.type === 'ride_status').length;

    let storageUsageBytes = 0;
    try {
      const qStr = localStorage.getItem(STORAGE_KEYS.QUEUE) || '';
      const rStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_RIDE_CACHE) || '';
      storageUsageBytes = (qStr.length + rStr.length) * 2; // approximation UTF-16
    } catch (e) {}

    return {
      isOnline: this.isOnline(),
      isSimulatedOffline: this.isSimulatedOffline,
      pendingCount: queue.length,
      pendingLocationsCount,
      pendingRideStatusCount,
      lastSyncTime: this.lastSyncTime,
      lastSyncSuccessCount: this.lastSyncSuccessCount,
      lastSyncError: this.lastSyncError,
      storageUsageBytes,
    };
  }

  /**
   * S'abonner aux changements d'état de synchronisation
   */
  public subscribe(listener: (stats: SyncStats) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStats());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach((listener) => {
      try {
        listener(stats);
      } catch (e) {
        console.error('[OfflineSync] Erreur listener :', e);
      }
    });
  }
}

export const driverOfflineSyncService = new DriverOfflineSyncService();
