import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Car,
  Layers,
  LayoutDashboard,
  Code2,
  PhoneCall,
  Activity,
  CheckCircle2,
  Sparkles,
  MapPin,
  Flame,
  Shield,
  UserCheck,
  LogIn,
  LogOut,
} from 'lucide-react';
import {
  Driver,
  Passenger,
  Ride,
  VehicleCategory,
  PaymentMethod,
  PricingRule,
  ZoneConfig,
  PayoutTransaction,
  DriverWalletTransaction,
  MIN_DRIVER_WALLET_THRESHOLD,
  DocumentStatus,
  GeoLocation,
} from './types/vtc';
import {
  INITIAL_DRIVERS,
  INITIAL_PASSENGER,
  PRICING_RULES,
  SENEGAL_ZONES,
  SENEGAL_LOCATIONS,
  INITIAL_WALLET_TRANSACTIONS,
} from './data/senegalData';
import { calculateRidePrice, generateRoutePoints } from './services/pricingEngine';
import { deductDriverCommission, rechargeDriverWallet } from './services/dbService';
import { PassengerApp } from './components/Passenger/PassengerApp';
import { DriverApp } from './components/Driver/DriverApp';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { TechnicalSpecView } from './components/Architecture/TechnicalSpecView';
import { DispatchSimulatorControls } from './components/Simulator/DispatchSimulatorControls';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PhoneAuthModal } from './components/Auth/PhoneAuthModal';

function YoonVtcApp() {
  const { currentUser, userProfile, logout, isConfigured } = useAuth();

  // Navigation principale de la suite Yoon VTC
  const [activeView, setActiveView] = useState<'split' | 'passenger' | 'driver' | 'admin' | 'architecture'>('split');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authDefaultRole, setAuthDefaultRole] = useState<'passenger' | 'driver'>('passenger');
  
  // Données d'état
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [passenger, setPassenger] = useState<Passenger>(INITIAL_PASSENGER);
  const [pricingRules, setPricingRules] = useState<Record<string, PricingRule>>(PRICING_RULES);
  const [zones, setZones] = useState<ZoneConfig[]>(SENEGAL_ZONES);
  const [payouts, setPayouts] = useState<PayoutTransaction[]>([
    {
      id: 'pay_sn_001',
      driverId: 'drv_sn_101',
      driverName: 'Babacar Fall',
      amount: 25000,
      method: 'wave',
      recipientPhone: '+221 77 521 34 89',
      fee: 0,
      status: 'success',
      timestamp: '2026-08-14T09:30:00Z',
      reference: 'WAVE_PAYOUT_94812',
    },
    {
      id: 'pay_sn_002',
      driverId: 'drv_sn_102',
      driverName: 'Modou Diop',
      amount: 40000,
      method: 'orange_money',
      recipientPhone: '+221 78 345 67 12',
      fee: 200,
      status: 'success',
      timestamp: '2026-08-14T10:15:00Z',
      reference: 'OM_PAYOUT_33104',
    },
  ]);

  // Historique des transactions du portefeuille de crédit chauffeur (Commissions & Recharges)
  const [walletTransactions, setWalletTransactions] = useState<DriverWalletTransaction[]>(INITIAL_WALLET_TRANSACTIONS);

  // Course en direct
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [isSimulatingMovement, setIsSimulatingMovement] = useState<boolean>(false);
  const [isRushHour, setIsRushHour] = useState<boolean>(false);
  const [assignedDriverLocation, setAssignedDriverLocation] = useState<{ lat: number; lng: number; heading: number } | null>(null);

  // Synchronisation avec le profil Firebase authentifié
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'driver') {
        setDrivers((prev) => [
          {
            id: userProfile.uid,
            fullName: userProfile.fullName || 'Chauffeur Connecté',
            phoneNumber: userProfile.phone || '+221770000000',
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            rating: userProfile.ratingAvg || 5.0,
            totalRides: 142,
            acceptanceRate: 98,
            walletBalance: userProfile.walletBalance || 35000,
            dailyEarnings: 18500,
            weeklyEarnings: 124000,
            status: userProfile.isOnline ? 'online' : 'offline',
            currentLocation: {
              lat: 14.7167,
              lng: -17.4677,
              heading: 90,
            },
            vehicle: {
              brand: userProfile.vehicleDetails?.brand || 'Peugeot',
              model: userProfile.vehicleDetails?.model || '301',
              color: userProfile.vehicleDetails?.color || 'Blanc',
              plateNumber: userProfile.vehicleDetails?.plateNumber || 'DK-9921-AZ',
              category: userProfile.vehicleDetails?.category || 'standard',
              year: userProfile.vehicleDetails?.year || 2023,
            },
            kyc: {
              cniNumber: '1-894-1992-00412',
              driverLicenseNumber: 'PC-SN-2018-8472',
              vehicleRegistrationNumber: 'CG-SN-784129',
              insuranceExpiryDate: '2027-04-30',
              technicalInspectionDate: '2027-01-15',
              status: 'approved',
            },
          },
          ...prev.filter((d) => d.id !== userProfile.uid),
        ]);
      } else {
        setPassenger((prev) => ({
          ...prev,
          id: userProfile.uid,
          fullName: userProfile.fullName || prev.fullName,
          phoneNumber: userProfile.phone || prev.phoneNumber,
        }));
      }
    }
  }, [userProfile]);

  // Chauffeur sélectionné pour l'application chauffeur
  const activeDriver = drivers[0];

  // 1. Demande de course par le Passager
  const handleRequestRide = (params: {
    pickup: GeoLocation;
    destination: GeoLocation;
    category: VehicleCategory;
    paymentMethod: PaymentMethod;
    landmarkHint?: string;
    voiceNoteUrl?: string;
    voiceNoteDuration?: number;
    isFixedPricePackage?: boolean;
    fixedPackageName?: string;
  }) => {
    const pricing = calculateRidePrice(params.pickup, params.destination, params.category, {
      isRushHour,
      customPricingRules: pricingRules,
    });

    const routeCoordinates = generateRoutePoints(params.pickup, params.destination, 20);

    const newRide: Ride = {
      id: `SN-${Math.floor(1000 + Math.random() * 9000)}`,
      passenger,
      pickup: params.pickup,
      destination: params.destination,
      category: params.category,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'cash' ? 'pending' : 'paid',
      status: 'searching_driver',
      pricing: pricing.breakdown,
      distanceKm: pricing.distanceKm,
      durationMinutes: pricing.durationMinutes,
      createdAt: new Date().toISOString(),
      routeCoordinates,
      currentRouteIndex: 0,
      landmarkHint: params.landmarkHint,
      voiceNoteUrl: params.voiceNoteUrl,
      voiceNoteDuration: params.voiceNoteDuration,
      isFixedPricePackage: params.isFixedPricePackage || pricing.isFixedPricePackage,
      fixedPackageName: params.fixedPackageName || pricing.fixedPackageName,
    };

    setActiveRide(newRide);
    setAssignedDriverLocation({ lat: params.pickup.lat + 0.008, lng: params.pickup.lng - 0.005, heading: 45 });
  };

  // 2. Chauffeur accepte la course
  const handleAcceptRide = (rideId: string) => {
    if (!activeRide || activeRide.id !== rideId) return;

    setActiveRide({
      ...activeRide,
      driver: activeDriver,
      status: 'driver_assigned',
      acceptedAt: new Date().toISOString(),
    });

    setDrivers((prev) =>
      prev.map((d) => (d.id === activeDriver.id ? { ...d, status: 'busy' } : d))
    );
  };

  // 3. Chauffeur décline la course
  const handleDeclineRide = (rideId: string) => {
    if (!activeRide || activeRide.id !== rideId) return;
    setActiveRide(null);
    setAssignedDriverLocation(null);
  };

  // 4. Chauffeur arrivé au point de départ
  const handleDriverArrived = (rideId: string) => {
    if (!activeRide || activeRide.id !== rideId) return;
    setActiveRide({
      ...activeRide,
      status: 'driver_arrived',
    });
  };

  // 5. Démarrage de la course
  const handleStartRide = (rideId: string) => {
    if (!activeRide || activeRide.id !== rideId) return;
    setActiveRide({
      ...activeRide,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    });
    setIsSimulatingMovement(true);
  };

  // 6. Terminaison de la course (Modèle Yango : Encaissement direct + Prélèvement commission sur crédit chauffeur)
  const handleCompleteRide = (rideId: string) => {
    if (!activeRide || activeRide.id !== rideId) return;

    const totalFareCollected = activeRide.pricing.totalFare; // 100% perçu directement par le chauffeur du passager
    const platformCommission = activeRide.pricing.platformCommission; // ex: 15% (300 FCFA sur 2000 FCFA)
    const driverNetGain = activeRide.pricing.driverNetEarnings;

    setActiveRide({
      ...activeRide,
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    setIsSimulatingMovement(false);

    let updatedWalletBalance = 0;

    // Déduction automatique de la commission plateforme du solde de crédit Chauffeur
    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === activeDriver.id) {
          const newBalance = Math.max(0, d.walletBalance - platformCommission);
          updatedWalletBalance = newBalance;
          const isBelowThreshold = newBalance < MIN_DRIVER_WALLET_THRESHOLD;

          return {
            ...d,
            // Si le solde passe sous le seuil de 1 000 FCFA, désactiver le statut en ligne
            status: isBelowThreshold ? 'offline' : 'online',
            walletBalance: newBalance,
            dailyEarnings: d.dailyEarnings + totalFareCollected,
            weeklyEarnings: d.weeklyEarnings + totalFareCollected,
            totalRides: d.totalRides + 1,
          };
        }
        return d;
      })
    );

    // Enregistrement de la transaction de commission dans l'historique
    const commissionTxn: DriverWalletTransaction = {
      id: `txn_comm_${Date.now()}`,
      driverId: activeDriver.id,
      amount: -platformCommission,
      type: 'commission',
      provider: activeRide.paymentMethod,
      description: `Commission course #${activeRide.id.substring(0, 8)} (15% sur ${totalFareCollected} FCFA direct)`,
      rideId: activeRide.id,
      createdAt: new Date().toISOString(),
      status: 'success',
      balanceAfter: updatedWalletBalance,
    };
    setWalletTransactions((prev) => [commissionTxn, ...prev]);

    // Persistance Firestore si configuré
    deductDriverCommission(
      activeDriver.id,
      activeRide.id,
      platformCommission,
      totalFareCollected,
      activeRide.paymentMethod
    );
  };

  // 7. Recharge du portefeuille de crédit Chauffeur via Wave ou Orange Money
  const handleRechargeWallet = async (amount: number, method: 'wave' | 'orange_money') => {
    let newBalanceCalculated = 0;

    setDrivers((prev) =>
      prev.map((d) => {
        if (d.id === activeDriver.id) {
          const newBalance = d.walletBalance + amount;
          newBalanceCalculated = newBalance;
          return {
            ...d,
            walletBalance: newBalance,
          };
        }
        return d;
      })
    );

    const rechargeTxn: DriverWalletTransaction = {
      id: `txn_topup_${Date.now()}`,
      driverId: activeDriver.id,
      amount: amount,
      type: 'deposit',
      provider: method,
      description: `Recharge crédit chauffeur (+${amount} FCFA via ${method === 'wave' ? 'Wave Sénégal' : 'Orange Money'})`,
      createdAt: new Date().toISOString(),
      status: 'success',
      balanceAfter: newBalanceCalculated,
    };
    setWalletTransactions((prev) => [rechargeTxn, ...prev]);

    // Persistance Firestore
    await rechargeDriverWallet(activeDriver.id, amount, method);
  };

  // 8. Notation de fin de course par le Passager
  const handleRateRide = (rating: number, feedback: string) => {
    if (!activeRide) return;
    setActiveRide(null);
    setAssignedDriverLocation(null);
  };

  // 9. Toggle Chauffeur En Ligne / Hors Ligne avec contrôle de solde de crédit
  const handleToggleOnline = (isOnline: boolean) => {
    if (isOnline && activeDriver.walletBalance < MIN_DRIVER_WALLET_THRESHOLD) {
      // Bloquer le passage en ligne si le solde est insuffisant (< 1 000 FCFA)
      return;
    }
    setDrivers((prev) =>
      prev.map((d) => (d.id === activeDriver.id ? { ...d, status: isOnline ? 'online' : 'offline' } : d))
    );
  };

  // 9. Demande de virement Payout Chauffeur
  const handleRequestPayout = (payoutData: Omit<PayoutTransaction, 'id' | 'timestamp' | 'status' | 'reference'>) => {
    const newTxn: PayoutTransaction = {
      ...payoutData,
      id: `pay_sn_${Date.now()}`,
      status: 'success',
      timestamp: new Date().toISOString(),
      reference: `${payoutData.method.toUpperCase()}_SN_${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setPayouts([newTxn, ...payouts]);
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === payoutData.driverId
          ? { ...d, walletBalance: Math.max(0, d.walletBalance - payoutData.amount) }
          : d
      )
    );
  };

  // 10. Validation Admin KYC
  const handleUpdateDriverKyc = (driverId: string, status: DocumentStatus, reason?: string) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? {
              ...d,
              kyc: {
                ...d.kyc,
                status,
                rejectionReason: reason,
                reviewedAt: new Date().toISOString(),
              },
            }
          : d
      )
    );
  };

  // 11. Mise à jour de la grille tarifaire par l'admin
  const handleUpdatePricingRule = (catKey: string, updatedRule: Partial<PricingRule>) => {
    setPricingRules((prev) => ({
      ...prev,
      [catKey]: { ...prev[catKey], ...updatedRule },
    }));
  };

  // 12. Mise à jour des surcharges de zones
  const handleUpdateZoneSurge = (zoneId: string, surgeFactor: number) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, surgeFactor } : z))
    );
  };

  // 13. Déclencheur Scénario prédéfini
  const handleLaunchPresetRide = (from: GeoLocation, to: GeoLocation, cat: VehicleCategory, pay: PaymentMethod) => {
    handleRequestRide({
      pickup: from,
      destination: to,
      category: cat,
      paymentMethod: pay,
    });
  };

  // Simulation automatique pas à pas du déplacement GPS du véhicule le long des coordonnées
  useEffect(() => {
    let timer: any = null;
    if (isSimulatingMovement && activeRide && activeRide.status === 'in_progress') {
      timer = setInterval(() => {
        setActiveRide((prev) => {
          if (!prev) return null;
          const nextIndex = prev.currentRouteIndex + 1;
          if (nextIndex >= prev.routeCoordinates.length) {
            clearInterval(timer);
            setIsSimulatingMovement(false);
            return {
              ...prev,
              currentRouteIndex: prev.routeCoordinates.length - 1,
            };
          }

          const currentPoint = prev.routeCoordinates[nextIndex];
          const prevPoint = prev.routeCoordinates[nextIndex - 1];

          // Calcul d'orientation du véhicule en degrés
          const dLat = currentPoint[0] - prevPoint[0];
          const dLng = currentPoint[1] - prevPoint[1];
          const heading = (Math.atan2(dLng, dLat) * 180) / Math.PI;

          setAssignedDriverLocation({
            lat: currentPoint[0],
            lng: currentPoint[1],
            heading,
          });

          return {
            ...prev,
            currentRouteIndex: nextIndex,
          };
        });
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [isSimulatingMovement, activeRide?.status]);

  // Avance manuelle d'un pas
  const handleStepForward = () => {
    if (!activeRide) return;
    const nextIndex = Math.min(activeRide.currentRouteIndex + 1, activeRide.routeCoordinates.length - 1);
    const point = activeRide.routeCoordinates[nextIndex];
    setAssignedDriverLocation({ lat: point[0], lng: point[1], heading: 90 });
    setActiveRide({ ...activeRide, currentRouteIndex: nextIndex });
  };

  const openAuthForRole = (role: 'passenger' | 'driver') => {
    setAuthDefaultRole(role);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      
      {/* GLOBAL NAVBAR / NAVIGATION PRINCIPALE */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-900/40">
              Y
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                Yoon VTC Sénégal
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                  SÉNÉGAL 🇸🇳
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* VUES SÉLECTEUR */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveView('split')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'split' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Double Écran (Passager + Chauffeur)</span>
          </button>

          <button
            onClick={() => setActiveView('passenger')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'passenger' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span>App Passager</span>
          </button>

          <button
            onClick={() => setActiveView('driver')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'driver' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>App Chauffeur</span>
          </button>

          <button
            onClick={() => setActiveView('admin')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'admin' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Backoffice Admin</span>
          </button>

          <button
            onClick={() => setActiveView('architecture')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center space-x-1.5 transition-all ${
              activeView === 'architecture' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Livrables Firebase & Code</span>
          </button>
        </div>

        {/* SECTION AUTHENTIFICATION SMS SÉNÉGAL (+221) */}
        <div className="flex items-center space-x-2">
          {currentUser || userProfile ? (
            <div className="flex items-center gap-2 bg-slate-950 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <div className="text-left leading-none">
                <p className="text-[11px] font-bold text-slate-100 flex items-center gap-1">
                  <span>{userProfile?.fullName || 'Utilisateur'}</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-1 rounded uppercase">
                    {userProfile?.role === 'driver' ? 'Chauffeur' : 'Passager'}
                  </span>
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.phoneNumber || userProfile?.phone || '+221 77 000 00 00'}
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthForRole('passenger')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion SMS (+221)</span>
            </button>
          )}

          {/* BADGE PAIEMENTS SÉNÉGAL */}
          <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold">
            <span className="px-2 py-1 rounded-md bg-sky-950/60 border border-sky-500/40 text-sky-300 font-mono text-[11px]">
              Wave 💙
            </span>
            <span className="px-2 py-1 rounded-md bg-orange-950/60 border border-orange-500/40 text-orange-300 font-mono text-[11px]">
              OM 🧡
            </span>
          </div>
        </div>
      </header>

      {/* DISPATCH CONTROLS & TEST SCENARIOS BAR */}
      <DispatchSimulatorControls
        activeRide={activeRide}
        isSimulatingMovement={isSimulatingMovement}
        isRushHour={isRushHour}
        onToggleRushHour={() => setIsRushHour(!isRushHour)}
        onLaunchPresetRide={handleLaunchPresetRide}
        onTogglePlaySimulation={() => setIsSimulatingMovement(!isSimulatingMovement)}
        onStepForward={handleStepForward}
        onResetRide={() => {
          setActiveRide(null);
          setAssignedDriverLocation(null);
          setIsSimulatingMovement(false);
        }}
        onTriggerSos={() => {
          if (activeRide) {
            setActiveRide({ ...activeRide, sosAlertTriggered: true });
          }
        }}
      />

      {/* MAIN CONTAINER CONTENT ACCORDING TO ACTIVE VIEW */}
      <main className="flex-1 relative overflow-hidden flex bg-slate-950">
        
        {/* VUE SPLIT : DOUBLE SMARTPHONE CÔTE À CÔTE */}
        {activeView === 'split' && (
          <div className="flex-1 flex items-center justify-center p-4 gap-6 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Smartphone Passager */}
            <div className="w-[410px] h-[730px] rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700 flex flex-col shrink-0 relative">
              {/* Notch Smartphone */}
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700"></div>
              </div>
              <div className="flex-1 rounded-[24px] overflow-hidden flex flex-col border border-slate-800">
                <PassengerApp
                  passenger={passenger}
                  drivers={drivers}
                  activeRide={activeRide}
                  assignedDriverLocation={assignedDriverLocation}
                  onRequestRide={handleRequestRide}
                  onCancelRide={() => setActiveRide(null)}
                  onRateRide={handleRateRide}
                  onTriggerSos={() => {}}
                />
              </div>
            </div>

            {/* Smartphone Chauffeur */}
            <div className="w-[410px] h-[730px] rounded-[36px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700 flex flex-col shrink-0 relative">
              {/* Notch Smartphone */}
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-700"></div>
              </div>
              <div className="flex-1 rounded-[24px] overflow-hidden flex flex-col border border-slate-800">
                <DriverApp
                  driver={activeDriver}
                  activeRide={activeRide}
                  assignedDriverLocation={assignedDriverLocation}
                  walletTransactions={walletTransactions}
                  onToggleOnline={handleToggleOnline}
                  onAcceptRide={handleAcceptRide}
                  onDeclineRide={handleDeclineRide}
                  onDriverArrived={handleDriverArrived}
                  onStartRide={handleStartRide}
                  onCompleteRide={handleCompleteRide}
                  onRequestPayout={handleRequestPayout}
                  onRechargeWallet={handleRechargeWallet}
                />
              </div>
            </div>
          </div>
        )}

        {/* VUE PLEIN ÉCRAN PASSAGER */}
        {activeView === 'passenger' && (
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-950">
            <div className="w-full max-w-md h-[740px] rounded-[32px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 flex flex-col">
              <div className="flex-1 rounded-[24px] overflow-hidden flex flex-col border border-slate-800">
                <PassengerApp
                  passenger={passenger}
                  drivers={drivers}
                  activeRide={activeRide}
                  assignedDriverLocation={assignedDriverLocation}
                  onRequestRide={handleRequestRide}
                  onCancelRide={() => setActiveRide(null)}
                  onRateRide={handleRateRide}
                  onTriggerSos={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* VUE PLEIN ÉCRAN CHAUFFEUR */}
        {activeView === 'driver' && (
          <div className="flex-1 flex items-center justify-center p-4 bg-slate-950">
            <div className="w-full max-w-md h-[740px] rounded-[32px] bg-slate-900 p-3 shadow-2xl border-4 border-slate-800 flex flex-col">
              <div className="flex-1 rounded-[24px] overflow-hidden flex flex-col border border-slate-800">
                <DriverApp
                  driver={activeDriver}
                  activeRide={activeRide}
                  assignedDriverLocation={assignedDriverLocation}
                  walletTransactions={walletTransactions}
                  onToggleOnline={handleToggleOnline}
                  onAcceptRide={handleAcceptRide}
                  onDeclineRide={handleDeclineRide}
                  onDriverArrived={handleDriverArrived}
                  onStartRide={handleStartRide}
                  onCompleteRide={handleCompleteRide}
                  onRequestPayout={handleRequestPayout}
                  onRechargeWallet={handleRechargeWallet}
                />
              </div>
            </div>
          </div>
        )}

        {/* VUE PANNEAU D'ADMINISTRATION */}
        {activeView === 'admin' && (
          <div className="flex-1 flex flex-col">
            <AdminDashboard
              drivers={drivers}
              rides={activeRide ? [activeRide] : []}
              pricingRules={pricingRules}
              zones={zones}
              payouts={payouts}
              onUpdateDriverKyc={handleUpdateDriverKyc}
              onUpdatePricingRule={handleUpdatePricingRule}
              onUpdateZoneSurge={handleUpdateZoneSurge}
            />
          </div>
        )}

        {/* VUE LIVRABLES TECHNIQUES & CODE */}
        {activeView === 'architecture' && (
          <div className="flex-1 flex flex-col">
            <TechnicalSpecView />
          </div>
        )}
      </main>

      {/* MODAL AUTHENTIFICATION SMS (+221) */}
      <PhoneAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultRole={authDefaultRole}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <YoonVtcApp />
    </AuthProvider>
  );
}
