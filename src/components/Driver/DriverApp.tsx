import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Power,
  Navigation,
  CheckCircle2,
  Wallet,
  FileText,
  DollarSign,
  Phone,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Building2,
  Radio,
  Compass,
  PlusCircle,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Info,
  QrCode,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CloudOff,
  HardDrive,
  Activity,
  Layers,
  ShieldAlert,
  Receipt,
  Volume2,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { Driver, Ride, PayoutTransaction, DriverWalletTransaction, MIN_DRIVER_WALLET_THRESHOLD, PastRideRecord } from '../../types/vtc';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';
import { DriverGpsTelemetryEmitter, calculateRouteAndEta } from '../../services/gpsService';
import { driverOfflineSyncService, SyncStats, OfflineQueueItem } from '../../services/driverOfflineSyncService';
import { DakarMapView } from '../Map/DakarMapView';
import { VoiceNotePlayerCard } from '../Audio/VoiceNotePlayer';
import { SosEmergencyModal } from '../Safety/SosEmergencyModal';
import { DigitalReceiptModal } from '../History/DigitalReceiptModal';
import { SENEGAL_LOCATIONS } from '../../data/senegalData';
import confetti from 'canvas-confetti';

interface DriverAppProps {
  driver: Driver;
  activeRide: Ride | null;
  assignedDriverLocation: { lat: number; lng: number; heading: number } | null;
  walletTransactions?: DriverWalletTransaction[];
  onToggleOnline: (isOnline: boolean) => void;
  onAcceptRide: (rideId: string) => void;
  onDeclineRide: (rideId: string) => void;
  onDriverArrived: (rideId: string) => void;
  onStartRide: (rideId: string) => void;
  onCompleteRide: (rideId: string) => void;
  onRequestPayout?: (payout: Omit<PayoutTransaction, 'id' | 'timestamp' | 'status' | 'reference'>) => void;
  onRechargeWallet?: (amount: number, method: 'wave' | 'orange_money') => Promise<void> | void;
}

export const DriverApp: React.FC<DriverAppProps> = ({
  driver,
  activeRide,
  assignedDriverLocation,
  walletTransactions = [],
  onToggleOnline,
  onAcceptRide,
  onDeclineRide,
  onDriverArrived,
  onStartRide,
  onCompleteRide,
  onRequestPayout,
  onRechargeWallet,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'wallet' | 'kyc' | 'history'>('map');
  const [countdown, setCountdown] = useState<number>(15);

  // Offline Sync State
  const [syncStats, setSyncStats] = useState<SyncStats>(driverOfflineSyncService.getStats());
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [offlineActionToast, setOfflineActionToast] = useState<string | null>(null);

  // Modals & Safety
  const [showRechargeModal, setShowRechargeModal] = useState<boolean>(false);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showLowBalanceWarning, setShowLowBalanceWarning] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [selectedReceiptRide, setSelectedReceiptRide] = useState<Ride | null>(null);
  const [pastDriverRides, setPastDriverRides] = useState<PastRideRecord[]>([
    {
      id: 'SN-4821',
      receiptNumber: 'REC-4821-SN',
      passenger: {
        id: 'pass_sn_01',
        fullName: 'Fatou Bintou Sall',
        phone: '+221 77 412 88 90',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        rating: 4.95,
        savedPlaces: {},
      },
      driver,
      pickup: SENEGAL_LOCATIONS[1],
      destination: SENEGAL_LOCATIONS[0],
      category: 'standard',
      paymentMethod: 'wave',
      paymentStatus: 'paid',
      status: 'completed',
      pricing: {
        baseFare: 800,
        distanceCost: 2800,
        durationCost: 900,
        tollFee: 0,
        zoneMultiplier: 1.0,
        surgeMultiplier: 1.0,
        totalFare: 4500,
        platformCommission: 675,
        driverNetEarnings: 3825,
      },
      distanceKm: 14.2,
      durationMinutes: 26,
      createdAt: '2026-08-14T08:30:00Z',
      completedAt: '2026-08-14T08:58:00Z',
      routeCoordinates: [],
      currentRouteIndex: 0,
      landmarkHint: 'Devant la pharmacie des Almadies',
      ratingGiven: 5,
      feedbackGiven: 'Excellente conduite, voiture très propre.',
    },
    {
      id: 'SN-3902',
      receiptNumber: 'REC-3902-SN',
      passenger: {
        id: 'pass_sn_02',
        fullName: 'Ibrahima Ndiaye',
        phone: '+221 78 112 33 44',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        rating: 4.85,
        savedPlaces: {},
      },
      driver,
      pickup: SENEGAL_LOCATIONS[0],
      destination: SENEGAL_LOCATIONS[3],
      category: 'standard',
      paymentMethod: 'orange_money',
      paymentStatus: 'paid',
      status: 'completed',
      pricing: {
        baseFare: 1500,
        distanceCost: 11000,
        durationCost: 1500,
        tollFee: 3000,
        zoneMultiplier: 1.0,
        surgeMultiplier: 1.0,
        totalFare: 17000,
        platformCommission: 2550,
        driverNetEarnings: 14450,
      },
      distanceKm: 52.0,
      durationMinutes: 45,
      createdAt: '2026-08-14T06:15:00Z',
      completedAt: '2026-08-14T07:00:00Z',
      routeCoordinates: [],
      currentRouteIndex: 0,
      isFixedPricePackage: true,
      fixedPackageName: 'Forfait Dakar ↔ AIBD',
      ratingGiven: 5,
      feedbackGiven: 'Ponctuel et rapide sur l’autoroute à péage.',
    },
  ]);

  // Theme state (sombre/clair automatique basé sur l'heure locale)
  const [isThemeAuto, setIsThemeAuto] = useState<boolean>(true);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    const hour = new Date().getHours();
    // De nuit (19h à 7h) -> dark, sinon -> light
    return (hour < 7 || hour >= 19) ? 'dark' : 'light';
  });

  // Mettre à jour automatiquement le thème toutes les minutes si en mode auto
  useEffect(() => {
    if (!isThemeAuto) return;
    const checkTheme = () => {
      const hour = new Date().getHours();
      const nextTheme = (hour < 7 || hour >= 19) ? 'dark' : 'light';
      setThemeMode(nextTheme);
    };
    checkTheme();
    const interval = setInterval(checkTheme, 60000); // toutes les minutes
    return () => clearInterval(interval);
  }, [isThemeAuto]);

  // Formulaire Recharge Chauffeur
  const [rechargeMethod, setRechargeMethod] = useState<'wave' | 'orange_money'>('wave');
  const [rechargeAmount, setRechargeAmount] = useState<number>(5000);
  const [rechargePhone, setRechargePhone] = useState<string>(driver.phone);
  const [isRecharging, setIsRecharging] = useState<boolean>(false);
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null);

  // Formulaire Retrait Chauffeur
  const [payoutMethod, setPayoutMethod] = useState<'wave' | 'orange_money'>('wave');
  const [payoutAmount, setPayoutAmount] = useState<number>(20000);
  const [payoutPhone, setPayoutPhone] = useState<string>(driver.phone);

  const isOnline = driver.status === 'online';
  const isBusy = driver.status === 'busy' || Boolean(activeRide && activeRide.status !== 'searching_driver' && activeRide.status !== 'completed');
  const isBalanceCritical = driver.walletBalance < MIN_DRIVER_WALLET_THRESHOLD; // < 1 000 FCFA
  const isBalanceLow = driver.walletBalance >= MIN_DRIVER_WALLET_THRESHOLD && driver.walletBalance < 3000; // 1 000 - 3 000 FCFA

  // Estimation du nombre de courses possibles avec le solde actuel (moyenne 300 FCFA de commission par course)
  const estimatedRidesCount = Math.max(0, Math.floor(driver.walletBalance / 350));

  // Télémétrie GPS Chauffeur en temps réel (Emission toutes les 5s à Firestore ou file locale)
  const [lastGpsPing, setLastGpsPing] = useState<string | null>(null);
  const [gpsPingCount, setGpsPingCount] = useState<number>(0);
  const gpsEmitterRef = useRef<DriverGpsTelemetryEmitter | null>(null);

  // Abonnement aux changements du service de synchronisation hors-ligne
  useEffect(() => {
    const unsubscribe = driverOfflineSyncService.subscribe((stats) => {
      setSyncStats(stats);
    });
    return () => unsubscribe();
  }, []);

  // Sauvegarde automatique du cache de la course active et du profil chauffeur en local
  useEffect(() => {
    driverOfflineSyncService.saveActiveRideCache(activeRide);
    driverOfflineSyncService.saveDriverProfileCache(driver);
  }, [activeRide, driver]);

  // Forcer la synchronisation manuelle
  const handleForceSync = async () => {
    setIsManualSyncing(true);
    try {
      const res = await driverOfflineSyncService.syncPendingQueue();
      if (res.syncedCount > 0) {
        setOfflineActionToast(`✅ ${res.syncedCount} élément(s) synchronisé(s) avec succès !`);
        setTimeout(() => setOfflineActionToast(null), 3500);
      } else if (res.failedCount > 0) {
        setOfflineActionToast(`⚠️ Échec de synchronisation (${res.failedCount} restants)`);
        setTimeout(() => setOfflineActionToast(null), 3500);
      } else {
        setOfflineActionToast(`✨ File d'attente déjà à jour`);
        setTimeout(() => setOfflineActionToast(null), 2500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsManualSyncing(false);
    }
  };

  // Basculer la simulation de perte de réseau (Tunnel Dakar / Panne antenne)
  const handleToggleSimulation = () => {
    const isSimNow = driverOfflineSyncService.toggleNetworkSimulation();
    if (isSimNow) {
      setOfflineActionToast('⚠️ Simulation Hors-ligne activée : Les données sont stockées dans le LocalStorage.');
    } else {
      setOfflineActionToast('🟢 Reconnexion au réseau : Synchronisation automatique en cours...');
    }
    setTimeout(() => setOfflineActionToast(null), 4000);
  };

  // Enveloppes de gestion de statut de course tolérantes aux pannes réseau
  const handleDriverArrivedOfflineAware = (rideId: string) => {
    if (!syncStats.isOnline) {
      driverOfflineSyncService.queueRideStatusUpdate(driver.id, rideId, 'arrived');
      setOfflineActionToast('💾 Arrivée au point de départ enregistrée en local (Hors-ligne)');
      setTimeout(() => setOfflineActionToast(null), 3500);
    }
    onDriverArrived(rideId);
  };

  const handleStartRideOfflineAware = (rideId: string) => {
    if (!syncStats.isOnline) {
      driverOfflineSyncService.queueRideStatusUpdate(driver.id, rideId, 'in_progress', {
        startedAt: new Date().toISOString(),
      });
      setOfflineActionToast('💾 Démarrage de course enregistré en local (Hors-ligne)');
      setTimeout(() => setOfflineActionToast(null), 3500);
    }
    onStartRide(rideId);
  };

  const handleCompleteRideOfflineAware = (rideId: string) => {
    if (!syncStats.isOnline) {
      driverOfflineSyncService.queueRideStatusUpdate(driver.id, rideId, 'completed', {
        completedAt: new Date().toISOString(),
      });
      setOfflineActionToast('💾 Fin de course & commission enregistrées en local (Hors-ligne)');
      setTimeout(() => setOfflineActionToast(null), 3500);
    }

    if (activeRide) {
      const record: PastRideRecord = {
        ...activeRide,
        receiptNumber: `REC-${activeRide.id.replace('SN-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
      setPastDriverRides((prev) => [record, ...prev]);
    }

    onCompleteRide(rideId);
  };

  useEffect(() => {
    if (isOnline) {
      const emitter = new DriverGpsTelemetryEmitter(
        driver.id,
        assignedDriverLocation || driver.currentLocation,
        () => {
          setLastGpsPing(new Date().toLocaleTimeString('fr-FR'));
          setGpsPingCount((c) => c + 1);
        }
      );
      emitter.start(5000); // 5000ms = 5 secondes
      gpsEmitterRef.current = emitter;
      setLastGpsPing(new Date().toLocaleTimeString('fr-FR'));

      return () => {
        emitter.stop();
        gpsEmitterRef.current = null;
      };
    } else {
      if (gpsEmitterRef.current) {
        gpsEmitterRef.current.stop();
        gpsEmitterRef.current = null;
      }
    }
  }, [isOnline, driver.id]);

  // Synchronisation des coordonnées GPS
  useEffect(() => {
    if (assignedDriverLocation && gpsEmitterRef.current) {
      gpsEmitterRef.current.updateCoordinates(
        assignedDriverLocation.lat,
        assignedDriverLocation.lng,
        assignedDriverLocation.heading
      );
    }
  }, [assignedDriverLocation]);

  // Calcul d'ETA dynamique Chauffeur <-> Passager / Destination
  const currentEta = useMemo(() => {
    if (!activeRide) return null;
    const currentLoc = assignedDriverLocation || driver.currentLocation;
    const targetLoc = activeRide.status === 'in_progress' ? activeRide.destination : activeRide.pickup;
    return calculateRouteAndEta(currentLoc, targetLoc);
  }, [activeRide, assignedDriverLocation, driver.currentLocation]);

  // Timer de 15s lors d'une demande de course en attente
  useEffect(() => {
    let interval: any = null;
    if (activeRide && activeRide.status === 'searching_driver' && isOnline) {
      setCountdown(15);
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onDeclineRide(activeRide.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCountdown(15);
    }
    return () => clearInterval(interval);
  }, [activeRide?.status, isOnline]);

  // Gestion du passage en ligne avec contrôle de solde minimum
  const handleToggleOnlineAttempt = () => {
    if (!isOnline) {
      // Le chauffeur veut passer EN LIGNE
      if (driver.walletBalance < MIN_DRIVER_WALLET_THRESHOLD) {
        // Bloqué car solde insuffisant
        setShowLowBalanceWarning(true);
        setShowRechargeModal(true);
        return;
      }
      onToggleOnline(true);
    } else {
      // Le chauffeur passe HORS LIGNE
      onToggleOnline(false);
    }
  };

  // Traitement de la recharge par Wave ou Orange Money
  const handleConfirmRecharge = async () => {
    if (rechargeAmount < 500) return;
    setIsRecharging(true);
    try {
      // Appel au service de paiement
      const res = await SenegalPaymentService.createDriverRechargeSession({
        amountFcfa: rechargeAmount,
        driverId: driver.id,
        driverPhone: rechargePhone,
        method: rechargeMethod,
      });

      if (onRechargeWallet) {
        await onRechargeWallet(rechargeAmount, rechargeMethod);
      }

      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setRechargeSuccessMsg(res.message);
      setShowLowBalanceWarning(false);

      setTimeout(() => {
        setRechargeSuccessMsg(null);
        setShowRechargeModal(false);
      }, 2000);
    } catch (err) {
      console.error('Erreur recharge :', err);
    } finally {
      setIsRecharging(false);
    }
  };

  // Traitement du retrait
  const handleWithdraw = () => {
    if (payoutAmount <= 0 || payoutAmount > driver.walletBalance) return;
    if (onRequestPayout) {
      onRequestPayout({
        driverId: driver.id,
        driverName: driver.fullName,
        amount: payoutAmount,
        method: payoutMethod,
        recipientPhone: payoutPhone,
        fee: payoutMethod === 'wave' ? 0 : 200,
      });
    }
    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setShowPayoutModal(false);
  };

  // Dynamic theme-aware classes
  const isDark = themeMode === 'dark';
  const themeBgMain = isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800';
  const themeBgHeader = isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const themeTextMain = isDark ? 'text-slate-100' : 'text-slate-900';
  const themeTextMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const themeBgBandeau = isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-100 border-slate-200';
  const themeBgIndicator = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const themeTabs = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const themeCard = isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const themeNestedCard = isDark ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-50 border-slate-200';

  return (
    <div className={`flex flex-col h-full relative overflow-hidden ${themeBgMain}`}>
      {/* Top Header Mobile Driver */}
      <div className={`px-4 py-3 backdrop-blur-md border-b flex items-center justify-between z-10 ${themeBgHeader}`}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={driver.avatar}
              alt={driver.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            ></span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className={`text-sm font-bold ${themeTextMain}`}>{driver.fullName}</h3>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                ★ {driver.rating.toFixed(1)}
              </span>
            </div>
            <p className={`text-[11px] font-mono ${themeTextMuted}`}>
              {driver.vehicle.brand} {driver.vehicle.model} • <span className="text-emerald-400 font-bold">{driver.vehicle.plateNumber}</span>
            </p>
          </div>
        </div>

        {/* Boutons d'action : SOS, Theme Toggle & En Ligne/Hors Ligne */}
        <div className="flex items-center space-x-1.5">
          {activeRide && (
            <button
              onClick={() => setShowSosModal(true)}
              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center gap-1 shadow-md shadow-rose-900/40 active:scale-95"
              title="Urgence SOS Sécurité Chauffeur"
            >
              <ShieldAlert className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">SOS</span>
            </button>
          )}

          {/* Bouton de Bascule de Thème (Auto / Manuel) */}
          <button
            onClick={() => {
              setIsThemeAuto(false);
              setThemeMode(prev => prev === 'dark' ? 'light' : 'dark');
            }}
            onDoubleClick={() => {
              setIsThemeAuto(true);
              const hour = new Date().getHours();
              setThemeMode((hour < 7 || hour >= 19) ? 'dark' : 'light');
            }}
            className={`p-1.5 rounded-xl border flex items-center gap-1 transition-all ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isThemeAuto ? "Thème Auto basé sur l'heure locale (Clic pour forcer, double-clic pour restaurer)" : "Thème Manuel (Double-clic pour restaurer Auto)"}
          >
            {isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-500 animate-pulse" />}
            <span className="text-[9px] font-black uppercase hidden sm:inline-block">
              {isThemeAuto ? '🌙 Auto' : '☀️ Manuel'}
            </span>
          </button>

          {isBusy ? (
            <div className="px-3 py-1.5 bg-amber-950/80 border border-amber-500/50 text-amber-300 rounded-xl font-bold text-xs flex items-center space-x-1.5 shadow-md">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>EN COURSE (1/1)</span>
            </div>
          ) : (
            <button
              onClick={handleToggleOnlineAttempt}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md ${
                isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                  : isBalanceCritical
                  ? 'bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isOnline ? 'EN LIGNE' : isBalanceCritical ? 'RECHARGE REQUISE' : 'HORS LIGNE'}</span>
            </button>
          )}
        </div>
      </div>

      {/* BANDEAU SOLDE DE CRÉDIT CHAUFFEUR (MODÈLE YANGO) & ACTION RECHARGE */}
      <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 z-10 text-xs ${themeBgBandeau}`}>
        <div className="flex items-center space-x-2">
          <div
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              isBalanceCritical
                ? 'bg-rose-500 animate-ping'
                : isBalanceLow
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <span className={`text-[10px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Crédit Chauffeur :</span>
              <span
                className={`font-mono font-black ${
                  isBalanceCritical
                    ? 'text-rose-400'
                    : isBalanceLow
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {SenegalPaymentService.formatFCFA(driver.walletBalance)}
              </span>
            </div>
            <p className="text-[9px] leading-tight">
              {isBalanceCritical ? (
                <span className="text-rose-400 font-semibold">Solde &lt; 1 000 F : Bloqué (Recharge requise)</span>
              ) : isBalanceLow ? (
                <span className="text-amber-400">Solde faible (~{estimatedRidesCount} courses)</span>
              ) : (
                <span className="text-emerald-400/90 font-medium">Solde actif (~{estimatedRidesCount} courses) • Com. 15%</span>
              )}
            </p>
          </div>
        </div>

        {/* Bouton Rapide Recharge Wave / OM & Mini Sync */}
        <div className="flex items-center space-x-1.5">
          {(!syncStats.isOnline || syncStats.pendingCount > 0 || syncStats.isSimulatedOffline) && (
            <button
              onClick={() => setShowOfflineModal(true)}
              className="px-2 py-1 bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 animate-pulse"
              title="Hors-ligne / Synchro en attente"
            >
              <CloudOff className="w-3 h-3" />
              <span>{syncStats.pendingCount > 0 ? `Sync (${syncStats.pendingCount})` : 'Hors-ligne'}</span>
            </button>
          )}

          <button
            onClick={() => setShowRechargeModal(true)}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all shrink-0 active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Recharger</span>
          </button>
        </div>
      </div>

      {/* TOAST D'ACTION PERSISTANCE HORS-LIGNE */}
      {offlineActionToast && (
        <div className="mx-3 mt-2 p-2.5 bg-slate-900/95 border border-emerald-500/50 rounded-xl text-xs text-slate-100 flex items-center justify-between shadow-xl animate-fadeIn z-20">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-[11px]">{offlineActionToast}</span>
          </div>
          <button onClick={() => setOfflineActionToast(null)} className="text-slate-400 hover:text-white p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs (Carte / Portefeuille / Reçus / Documents KYC) */}
      <div className={`grid grid-cols-4 border-b text-xs font-semibold ${themeTabs}`}>
        <button
          onClick={() => setActiveTab('map')}
          className={`py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'map'
              ? (isDark ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-emerald-600 text-emerald-600 bg-emerald-50/50')
              : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="truncate">Nav</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'wallet'
              ? (isDark ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-emerald-600 text-emerald-600 bg-emerald-50/50')
              : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="truncate">Wallet</span>
          {isBalanceCritical && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-0.5" />}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'history'
              ? (isDark ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-emerald-600 text-emerald-600 bg-emerald-50/50')
              : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span className="truncate">Reçus</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'kyc'
              ? (isDark ? 'border-emerald-500 text-emerald-400 bg-slate-800/50' : 'border-emerald-600 text-emerald-600 bg-emerald-50/50')
              : (isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-500 hover:text-slate-800')
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="truncate">KYC</span>
        </button>
      </div>

      {/* MAIN CONTENT SELON ONGLET */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        
        {/* ONGLET 1: NAVIGATION & RÉCEPTION DES COURSES */}
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            <div className="w-full h-1/2 min-h-[220px] relative">
              <DakarMapView
                drivers={[driver]}
                selectedPickup={activeRide?.pickup || null}
                selectedDestination={activeRide?.destination || null}
                activeRide={activeRide}
                assignedDriverLocation={assignedDriverLocation || driver.currentLocation}
              />
            </div>

            {/* Bottom Actions for Driver */}
            <div className={`w-full flex-1 border-t rounded-t-2xl shadow-2xl p-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex flex-col justify-between ${themeCard}`}>
              
              {/* Télémétrie GPS Live Banner */}
              {isOnline && (
                <div
                  className={`flex items-center justify-between px-3 py-1.5 border rounded-xl text-xs mb-2 shadow-sm transition-colors ${
                    !syncStats.isOnline
                      ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
                      : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="relative flex h-2 w-2">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          !syncStats.isOnline ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      ></span>
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          !syncStats.isOnline ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      ></span>
                    </span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        !syncStats.isOnline ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      <Radio className={`w-3 h-3 ${!syncStats.isOnline ? 'text-amber-400' : 'text-emerald-400'}`} />
                      {!syncStats.isOnline ? 'GPS LocalStorage (Hors-ligne)' : 'GPS 5s Firestore (Live)'}
                    </span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 font-mono text-[11px] ${
                      !syncStats.isOnline ? 'text-amber-400/90' : 'text-emerald-400/90'
                    }`}
                  >
                    <span>{lastGpsPing ? `Ping : ${lastGpsPing}` : 'Initialisation...'}</span>
                    {syncStats.pendingLocationsCount > 0 && !syncStats.isOnline ? (
                      <span className="bg-amber-900/90 text-amber-200 px-1.5 py-0.2 rounded text-[10px]">
                        {syncStats.pendingLocationsCount} en attente
                      </span>
                    ) : gpsPingCount > 0 ? (
                      <span className="bg-emerald-800/80 px-1.5 py-0.2 rounded text-[10px]">
                        #{gpsPingCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Barre ETA Dynamique Course en cours */}
              {activeRide && currentEta && activeRide.status !== 'searching_driver' && (
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-emerald-500/30 rounded-xl text-xs mb-3 text-slate-200">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Temps Estimé (ETA)</p>
                      <p className="font-bold text-emerald-300 text-sm">{currentEta.etaText}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Distance Restante</p>
                    <p className="font-bold text-slate-100 text-sm">{currentEta.distanceKm} km</p>
                  </div>
                </div>
              )}

              {/* ALERTE SOLDE CRITIQUE (< 1 000 FCFA) */}
              {isBalanceCritical && !activeRide && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs space-y-2 mb-2">
                  <div className="flex items-center space-x-2 text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Solde de crédit insuffisant ({SenegalPaymentService.formatFCFA(driver.walletBalance)})</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    Selon le <strong>modèle Yango</strong>, un solde minimum de <strong>1 000 FCFA</strong> est obligatoire pour couvrir les commissions des courses. Rechargez via Wave ou Orange Money pour passer en ligne.
                  </p>
                  <button
                    onClick={() => setShowRechargeModal(true)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Recharger maintenant par Wave / Orange Money</span>
                  </button>
                </div>
              )}

              {/* ÉTAT HORS LIGNE */}
              {!isOnline && !activeRide && !isBalanceCritical && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-4">
                  <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 border border-slate-700">
                    <Power className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 text-sm">Vous êtes actuellement Hors Ligne</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Passez en ligne pour commencer à recevoir des courses des passagers à Dakar et ses environs.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleOnlineAttempt}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30"
                  >
                    Passer En Ligne
                  </button>
                </div>
              )}

              {/* ÉTAT EN LIGNE (EN ATTENTE DE COURSE) */}
              {isOnline && !activeRide && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 py-4">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400">
                      <Navigation className="w-6 h-6 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${themeTextMain}`}>Radar de Dispatch Actif</h4>
                    <p className={`text-xs mt-0.5 ${themeTextMuted}`}>
                      En attente de demandes de course...
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-2">
                    <div className={`p-2.5 rounded-xl text-left ${themeNestedCard}`}>
                      <p className={`text-[10px] uppercase font-semibold ${themeTextMuted}`}>Chiffre d'affaires perçu</p>
                      <p className="text-sm font-black text-emerald-400">{SenegalPaymentService.formatFCFA(driver.dailyEarnings)}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl text-left ${themeNestedCard}`}>
                      <p className={`text-[10px] uppercase font-semibold ${themeTextMuted}`}>Courses aujourd'hui</p>
                      <p className={`text-sm font-black ${themeTextMain}`}>6 courses</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAT DEMANDE DE COURSE ENTRANTE (DISPATCH AVEC MODÈLE ÉCONOMIQUE YANGO) */}
              {activeRide && activeRide.status === 'searching_driver' && (
                <div className="bg-slate-950 border-2 border-emerald-500/60 rounded-2xl p-4 shadow-2xl space-y-3 animate-bounce-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
                        Nouvelle Course Entrante
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs shadow">
                      {countdown}s
                    </div>
                  </div>

                  {/* Décomposition du Modèle Économique : Paiement Direct & Déduction Commission */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Montant perçu directement du client</p>
                        <p className="text-base font-black text-slate-100">
                          {SenegalPaymentService.formatFCFA(activeRide.pricing.totalFare)}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-slate-800 text-emerald-400 rounded-lg text-[10px] font-bold uppercase">
                        Paiement {activeRide.paymentMethod}
                      </span>
                    </div>

                    <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Commission plateforme prélevée (15%) :</span>
                      <span className="font-bold text-rose-400 font-mono">
                        -{SenegalPaymentService.formatFCFA(activeRide.pricing.platformCommission)}
                      </span>
                    </div>

                    <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">Votre gain net réel :</span>
                      <span className="text-sm font-black text-emerald-400">
                        {SenegalPaymentService.formatFCFA(activeRide.pricing.driverNetEarnings)}
                      </span>
                    </div>
                  </div>

                  {/* Détails du Trajet */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center space-x-2 text-slate-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                      <span className="truncate">
                        Prise en charge : <strong>{activeRide.pickup.quarter} ({activeRide.pickup.name})</strong>
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-300">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                      <span className="truncate">
                        Destination : <strong>{activeRide.destination.quarter}</strong> (~{activeRide.distanceKm} km)
                      </span>
                    </div>
                  </div>

                  {/* Boutons Accepter / Refuser */}
                  <div className="flex space-x-2 pt-1">
                    <button
                      onClick={() => onDeclineRide(activeRide.id)}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-bold rounded-xl border border-rose-500/20"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => onAcceptRide(activeRide.id)}
                      className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> ACCEPTER LA COURSE
                    </button>
                  </div>
                </div>
              )}

              {/* ÉTAT COURSE EN COURS (ÉTAPES DE GUIDAGE GPS, VOCAL & APPEL DIRECT) */}
              {activeRide && (activeRide.status === 'driver_assigned' || activeRide.status === 'driver_arrived' || activeRide.status === 'in_progress') && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-emerald-400">
                          {activeRide.status === 'driver_assigned' && '1. En route vers le client'}
                          {activeRide.status === 'driver_arrived' && '2. Arrivé au point de prise en charge'}
                          {activeRide.status === 'in_progress' && '3. Course en cours vers la destination'}
                        </p>
                        <h4 className="text-sm font-bold text-slate-100 mt-0.5 flex items-center gap-1.5">
                          <span>Passager: {activeRide.passenger.fullName}</span>
                          <span className="text-amber-400 text-xs">★ {activeRide.passenger.rating}</span>
                        </h4>
                      </div>

                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/30 rounded text-xs font-mono font-bold">
                        #{activeRide.id}
                      </span>
                    </div>

                    {/* Note Vocale & Repère passager */}
                    {(activeRide.voiceNoteUrl || activeRide.landmarkHint) && (
                      <VoiceNotePlayerCard
                        audioUrl={activeRide.voiceNoteUrl}
                        duration={activeRide.voiceNoteDuration || 5}
                        landmarkHint={activeRide.landmarkHint}
                        senderName={activeRide.passenger.fullName}
                        role="driver"
                      />
                    )}
                  </div>

                  {/* Boutons d'Appel Direct Vocal (Téléphonie & WhatsApp) */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${activeRide.passenger.phone}`}
                      className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                    >
                      <Phone className="w-4 h-4 fill-current animate-bounce" />
                      <span>Appel Direct</span>
                    </a>

                    <a
                      href={`https://wa.me/${activeRide.passenger.phone.replace(/[^0-9]/g, '') || '221774128890'}?text=${encodeURIComponent(`Bonjour ${activeRide.passenger.fullName}, je suis votre chauffeur Yoon VTC pour la course #${activeRide.id}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Actions par étape */}
                  {activeRide.status === 'driver_assigned' && (
                    <button
                      onClick={() => handleDriverArrivedOfflineAware(activeRide.id)}
                      className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>J'AI ARRIVÉ AU POINT DE DÉPART</span>
                    </button>
                  )}

                  {activeRide.status === 'driver_arrived' && (
                    <button
                      onClick={() => handleStartRideOfflineAware(activeRide.id)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>LE PASSAGER EST À BORD - DÉMARRER</span>
                    </button>
                  )}

                  {activeRide.status === 'in_progress' && (
                    <div className="space-y-2">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                        <span className="text-slate-400">À encaisser auprès du passager :</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {SenegalPaymentService.formatFCFA(activeRide.pricing.totalFare)} ({activeRide.paymentMethod})
                        </span>
                      </div>

                      <button
                        onClick={() => handleCompleteRideOfflineAware(activeRide.id)}
                        className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ARRIVÉ À DESTINATION - TERMINER LA COURSE</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 2: GAINS & WALLET CHAUFFEUR (MODÈLE YANGO / PRÉPAYÉ) */}
        {activeTab === 'wallet' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            
            {/* Carte Solde de Crédit Principal */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Solde de Crédit (Modèle Yango)
                </span>
                <span className="font-mono text-emerald-400">Commission: 15%</span>
              </div>

              <div className="flex items-baseline justify-between">
                <h2
                  className={`text-2xl font-black ${
                    isBalanceCritical
                      ? 'text-rose-400'
                      : isBalanceLow
                      ? 'text-amber-400'
                      : 'text-slate-100'
                  }`}
                >
                  {SenegalPaymentService.formatFCFA(driver.walletBalance)}
                </h2>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isBalanceCritical
                      ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                      : isBalanceLow
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isBalanceCritical ? 'Épuisé (< 1 000 F)' : isBalanceLow ? 'Faible' : 'Optimal'}
                </span>
              </div>

              {/* Bouton Principal de Recharge */}
              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/40 transition-transform active:scale-[0.99]"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Recharger par Wave / Orange Money</span>
                </button>

                {onRequestPayout && (
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="py-3 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-1"
                    title="Retirer des fonds"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Guide Explicatif du Modèle Économique (Yango) */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <Info className="w-4 h-4" />
                <span>Fonctionnement du Système de Crédit Yango</span>
              </div>

              <div className="space-y-2 text-slate-300 text-[11px] leading-relaxed">
                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    <strong>Encaissement direct :</strong> Le client vous règle la totalité de la course (en Espèces ou Wave/OM direct). La plateforme n'encaisse pas la course.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    <strong>Déduction automatique :</strong> À chaque fin de course, la commission de <strong>15%</strong> est automatiquement déduite de votre solde de crédit.
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    <strong>Seuil de 1 000 FCFA :</strong> Votre solde doit être supérieur à <strong>1 000 FCFA</strong> pour rester en ligne et recevoir des demandes de courses.
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques Financières */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Encaissé Aujourd'hui</span>
                </div>
                <p className="text-base font-bold text-emerald-400">
                  {SenegalPaymentService.formatFCFA(driver.dailyEarnings)}
                </p>
                <p className="text-[10px] text-slate-500">6 courses effectuées</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Total Semaine</span>
                </div>
                <p className="text-base font-bold text-sky-400">
                  {SenegalPaymentService.formatFCFA(driver.weeklyEarnings)}
                </p>
                <p className="text-[10px] text-slate-500">38 courses au total</p>
              </div>
            </div>

            {/* Historique des Transactions (Commissions déduites & Recharges) */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Historique des Transactions (Firestore)
                </h4>
                <span className="text-[10px] text-slate-500">Commissions & Recharges</span>
              </div>

              <div className="space-y-2 text-xs">
                {walletTransactions.length > 0 ? (
                  walletTransactions.map((txn) => {
                    const isCredit = txn.amount > 0;
                    return (
                      <div
                        key={txn.id}
                        className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              isCredit
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200 text-xs">{txn.description}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {new Date(txn.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })} • {txn.provider.toUpperCase()} • Réf: {txn.reference || txn.id}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono font-bold text-xs ${
                              isCredit ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isCredit ? `+${txn.amount} FCFA` : `${txn.amount} FCFA`}
                          </span>
                          <p className="text-[9px] text-slate-500 font-mono">
                            Solde: {txn.balanceAfter} FCFA
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-500 text-xs">
                    Aucune transaction récente enregistrée.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 3: PROFIL & VÉRIFICATION DOCUMENTS KYC */}
        {activeTab === 'kyc' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-semibold">Statut KYC Chauffeur</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  {driver.kyc.status === 'approved' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold text-emerald-400">Compte Validé & Actif</span>
                    </>
                  )}
                  {driver.kyc.status === 'pending' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="text-xs font-bold text-amber-400">En cours de validation</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-mono bg-slate-950 px-2 py-1 rounded text-slate-300 border border-slate-800">
                SN-{driver.id}
              </span>
            </div>

            {/* Liste des Documents Téléchargés */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Pièces Justificatives (Sénégal)
              </h4>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Carte Nationale d'Identité (CNI)</p>
                  <p className="text-[10px] text-slate-400">N° {driver.kyc.cniNumber}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                  Approuvé
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Permis de Conduire Sénégalais</p>
                  <p className="text-[10px] text-slate-400">Réf: {driver.kyc.licenseNumber}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                  Approuvé
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Carte Grise du Véhicule</p>
                  <p className="text-[10px] text-slate-400">{driver.vehicle.brand} {driver.vehicle.model} ({driver.vehicle.plateNumber})</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                  Approuvé
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Assurance Véhicule CEMAC</p>
                  <p className="text-[10px] text-slate-400">Expire le {driver.kyc.assuranceExpiry}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                  Valide
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-200">Visite Technique & Conformité</p>
                  <p className="text-[10px] text-slate-400">Contrôle technique agréé Dakar</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold">
                  Conforme
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 4: HISTORIQUE DES COURSES & REÇUS NUMÉRIQUES CHAUFFEUR */}
        {activeTab === 'history' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white">Historique des Courses</h4>
                <p className="text-xs text-slate-400">Reçus numériques, gains nets et commissions Yoon</p>
              </div>
              <span className="px-2 py-1 bg-emerald-950 border border-emerald-500/30 text-emerald-300 font-bold text-xs rounded-xl">
                {pastDriverRides.length} courses
              </span>
            </div>

            <div className="space-y-3">
              {pastDriverRides.map((ride) => (
                <div
                  key={ride.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 space-y-2.5 transition-all shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-white">#{ride.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                        Gain Net : {SenegalPaymentService.formatFCFA(ride.pricing.driverNetEarnings)}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(ride.completedAt || ride.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  {/* Trajet */}
                  <div className="text-xs space-y-1 text-slate-300">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                      <span className="truncate">{ride.pickup.quarter} ({ride.pickup.name})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="truncate">{ride.destination.quarter}</span>
                    </div>
                  </div>

                  {/* Décomposition Financière */}
                  <div className="bg-slate-950 p-2 rounded-xl text-[11px] flex justify-between items-center text-slate-300 font-mono">
                    <span>Client a payé: {SenegalPaymentService.formatFCFA(ride.pricing.totalFare)}</span>
                    <span className="text-rose-400">Commission (15%): -{SenegalPaymentService.formatFCFA(ride.pricing.platformCommission)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                    <span className="text-xs text-amber-400">
                      ★ {ride.ratingGiven || 5.0} • {ride.passenger.fullName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReceiptRide(ride);
                        setShowReceiptModal(true);
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Reçu Numérique</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL SOS URGENCE CHAUFFEUR */}
      {showSosModal && activeRide && (
        <SosEmergencyModal
          activeRide={activeRide}
          userRole="driver"
          onClose={() => setShowSosModal(false)}
        />
      )}

      {/* MODAL REÇU NUMÉRIQUE CHAUFFEUR */}
      {showReceiptModal && (selectedReceiptRide || activeRide) && (
        <DigitalReceiptModal
          ride={selectedReceiptRide || activeRide!}
          userRole="driver"
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedReceiptRide(null);
          }}
        />
      )}
      {showRechargeModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-4 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Recharger mon Crédit</h3>
                  <p className="text-[10px] text-slate-400">Modèle Yango • Prélèvement commission 15%</p>
                </div>
              </div>

              <button
                onClick={() => setShowRechargeModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Alerte si le chauffeur est bloqué par solde < 1 000 FCFA */}
            {showLowBalanceWarning && (
              <div className="p-2.5 bg-rose-950/70 border border-rose-500/50 rounded-xl text-xs text-rose-200 space-y-1">
                <p className="font-bold flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Solde minimum de 1 000 FCFA requis
                </p>
                <p className="text-[10px] leading-tight">
                  Rechargez pour débloquer votre statut <strong>« En Ligne »</strong> et recevoir des demandes de courses.
                </p>
              </div>
            )}

            {/* Choix du Moyen de Paiement : Wave ou Orange Money */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Moyen de paiement mobile</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRechargeMethod('wave')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    rechargeMethod === 'wave'
                      ? 'bg-sky-950/70 border-sky-400 text-sky-300 shadow-md ring-1 ring-sky-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Wave (0% frais)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRechargeMethod('orange_money')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                    rechargeMethod === 'orange_money'
                      ? 'bg-orange-950/70 border-orange-400 text-orange-300 shadow-md ring-1 ring-orange-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  <span>Orange Money</span>
                </button>
              </div>
            </div>

            {/* Montants Prédéfinis Rapides */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Sélectionner un montant</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[2000, 5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setRechargeAmount(amt)}
                    className={`py-2 rounded-lg text-xs font-bold font-mono transition-all ${
                      rechargeAmount === amt
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {amt >= 1000 ? `${amt / 1000}k F` : `${amt} F`}
                  </button>
                ))}
              </div>
            </div>

            {/* Saisie Montant Personnalisé */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <label className="font-semibold">Montant exact (FCFA)</label>
                <span className="text-emerald-400 font-mono font-bold">
                  ~{Math.floor(rechargeAmount / 350)} courses
                </span>
              </div>
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(Math.max(500, Number(e.target.value)))}
                min={500}
                step={500}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-base font-black text-emerald-400 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            {/* Numéro de téléphone mobile */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Numéro de téléphone (+221)</label>
              <input
                type="text"
                value={rechargePhone}
                onChange={(e) => setRechargePhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:border-emerald-500 outline-none"
                placeholder="+221 77 123 45 67"
              />
            </div>

            {/* Message de confirmation de recharge */}
            {rechargeSuccessMsg && (
              <div className="p-3 bg-emerald-950/90 border border-emerald-500/60 rounded-xl text-xs text-emerald-200 flex items-center space-x-2 animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{rechargeSuccessMsg}</span>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmRecharge}
                disabled={isRecharging || rechargeAmount < 500}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5"
              >
                {isRecharging ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Validation...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Recharger {SenegalPaymentService.formatFCFA(rechargeAmount)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RETRAIT GAINS VERS WAVE / ORANGE MONEY (OPTIONNEL) */}
      {showPayoutModal && onRequestPayout && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-4 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100">Retrait de Gains Chauffeur</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Mode de virement</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethod('wave')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 ${
                    payoutMethod === 'wave'
                      ? 'bg-sky-950/50 border-sky-400 text-sky-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Wave (0% frais)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPayoutMethod('orange_money')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 ${
                    payoutMethod === 'orange_money'
                      ? 'bg-orange-950/50 border-orange-400 text-orange-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-orange-400" />
                  <span>Orange Money</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Numéro de téléphone mobile (+221)</label>
              <input
                type="text"
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <label className="font-semibold">Montant à retirer (FCFA)</label>
                <span>Max : {driver.walletBalance} FCFA</span>
              </div>
              <input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                min={1000}
                max={driver.walletBalance}
                step={500}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleWithdraw}
                disabled={payoutAmount <= 0 || payoutAmount > driver.walletBalance}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30"
              >
                Confirmer le virement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DIAGNOSTIC & SYNCHRONISATION HORS-LIGNE (LOCALSTORAGE) */}
      {showOfflineModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-4 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Gestionnaire Hors-Ligne</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Stockage LocalStorage & Synchro</p>
                </div>
              </div>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* État du Réseau */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">État de connexion :</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                    !syncStats.isOnline
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {!syncStats.isOnline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                  {!syncStats.isOnline ? 'Mode Hors-Ligne' : 'Connecté (En Ligne)'}
                </span>
              </div>

              {syncStats.isSimulatedOffline && (
                <div className="text-[10px] bg-amber-950/60 border border-amber-500/30 p-2 rounded-lg text-amber-200">
                  ⚠️ <strong>Simulation active</strong> : Les appels réseaux sont volontairement interceptés et stockés dans le localStorage pour test.
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                <span className="text-slate-400">Dernière synchro réussie :</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {syncStats.lastSyncTime ? syncStats.lastSyncTime : 'Aucune'}
                </span>
              </div>
            </div>

            {/* Détails de la file d'attente LocalStorage */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>File d'attente locale</span>
                <span className="font-mono text-emerald-400">{syncStats.pendingCount} en attente</span>
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Positions GPS</p>
                  <p className="text-base font-black text-amber-400 font-mono">
                    {syncStats.pendingLocationsCount}
                  </p>
                  <p className="text-[9px] text-slate-500">Coordonnées horodatées</p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Statuts de Course</p>
                  <p className="text-base font-black text-sky-400 font-mono">
                    {syncStats.pendingRideStatusCount}
                  </p>
                  <p className="text-[9px] text-slate-500">Arrivée, Début, Fin</p>
                </div>
              </div>

              {/* Aperçu des éléments stockés */}
              {driverOfflineSyncService.getPendingQueue().length > 0 ? (
                <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 max-h-36 overflow-y-auto space-y-1 text-[11px] font-mono">
                  {driverOfflineSyncService
                    .getPendingQueue()
                    .slice(-5)
                    .reverse()
                    .map((item) => (
                      <div
                        key={item.id}
                        className="p-1.5 bg-slate-900/90 rounded border border-slate-800/80 flex items-center justify-between text-slate-300"
                      >
                        <div className="truncate pr-2">
                          <span className="text-emerald-400 font-bold">[{item.type}]</span>{' '}
                          {item.type === 'gps_location' &&
                            `Lat: ${item.payload.lat?.toFixed(4)}, Lng: ${item.payload.lng?.toFixed(4)}`}
                          {item.type === 'ride_status' &&
                            `Ride ${item.payload.rideId} ➔ ${item.payload.status}`}
                        </div>
                        <span className="text-[9px] text-slate-500 shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                  ✨ Aucun élément en attente. Tout est synchronisé avec Firestore.
                </div>
              )}
            </div>

            {/* Cache Local de la Course */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <span className="text-slate-400">Empreinte mémoire localStorage :</span>
              <span className="font-mono text-emerald-400 font-bold">
                ~{(syncStats.storageUsageBytes / 1024).toFixed(2)} KB
              </span>
            </div>

            {/* Boutons d'actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleForceSync}
                disabled={isManualSyncing || !syncStats.isOnline}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/40"
              >
                {isManualSyncing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Synchronisation vers Firestore...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Transmettre & Synchroniser ({syncStats.pendingCount})</span>
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleToggleSimulation}
                  className={`py-2 px-2 text-[11px] font-bold rounded-xl border flex items-center justify-center space-x-1.5 transition-colors ${
                    syncStats.isSimulatedOffline
                      ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {syncStats.isSimulatedOffline ? (
                    <>
                      <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Rétablir le Réseau</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simuler Perte 4G</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    driverOfflineSyncService.clearQueue();
                    setOfflineActionToast('🗑️ File d\'attente locale vidée');
                    setTimeout(() => setOfflineActionToast(null), 2500);
                  }}
                  disabled={syncStats.pendingCount === 0}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-rose-400 text-[11px] font-bold rounded-xl border border-slate-700 flex items-center justify-center space-x-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Vider la file</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
