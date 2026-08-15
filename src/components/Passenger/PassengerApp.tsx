import React, { useState, useEffect } from 'react';
import {
  Car,
  CarFront,
  Crown,
  MapPin,
  Navigation,
  CreditCard,
  Banknote,
  ShieldAlert,
  Share2,
  Phone,
  MessageSquare,
  Star,
  Clock,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Smartphone,
  Check,
  X,
  Mic,
  Volume2,
  Sparkles,
  Receipt,
  FileText,
  Info,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  GeoLocation,
  VehicleCategory,
  PaymentMethod,
  Ride,
  Driver,
  Passenger,
  PastRideRecord,
  FixedPricePackage,
} from '../../types/vtc';
import { SENEGAL_LOCATIONS, PRICING_RULES } from '../../data/senegalData';
import { calculateRidePrice } from '../../services/pricingEngine';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';
import { detectPassengerGpsLocation, haversineDistanceMeters } from '../../services/gpsService';
import { DakarMapView } from '../Map/DakarMapView';
import { VoiceNoteRecorder, VoiceNotePlayerCard } from '../Audio/VoiceNotePlayer';
import { SosEmergencyModal } from '../Safety/SosEmergencyModal';
import { ShareTripModal } from '../Safety/ShareTripModal';
import { DigitalReceiptModal } from '../History/DigitalReceiptModal';
import { RideHistoryModal } from '../History/RideHistoryModal';
import { FIXED_PRICE_PACKAGES, findMatchingFixedPackage } from '../../data/fixedPackages';
import confetti from 'canvas-confetti';

interface PassengerAppProps {
  passenger: Passenger;
  drivers: Driver[];
  activeRide: Ride | null;
  assignedDriverLocation: { lat: number; lng: number; heading: number } | null;
  onRequestRide: (params: {
    pickup: GeoLocation;
    destination: GeoLocation;
    category: VehicleCategory;
    paymentMethod: PaymentMethod;
    landmarkHint?: string;
    voiceNoteUrl?: string;
    voiceNoteDuration?: number;
    isFixedPricePackage?: boolean;
    fixedPackageName?: string;
  }) => void;
  onCancelRide: () => void;
  onRateRide: (rating: number, comment: string) => void;
  onTriggerSos: () => void;
}

const APPRECIATION_BADGES = [
  { id: 'safe', label: 'Conduite sûre', icon: '🛡️' },
  { id: 'clean', label: 'Véhicule propre', icon: '✨' },
  { id: 'polite', label: 'Chauffeur courtois', icon: '🤝' },
  { id: 'punctual', label: 'Ponctuel', icon: '⏱️' },
  { id: 'music', label: 'Bonne musique', icon: '🎵' },
  { id: 'ac', label: 'Climatisation parfaite', icon: '❄️' },
];

const CANCELLATION_REASONS = [
  { id: 'wait_time', label: "Temps d'attente trop long" },
  { id: 'driver_not_moving', label: 'Le chauffeur ne se déplace pas vers moi' },
  { id: 'change_plans', label: "Changement de programme ou d'horaire" },
  { id: 'wrong_pickup', label: 'Erreur sur le lieu de départ sélectionné' },
  { id: 'found_other', label: 'J’ai trouvé un autre moyen de transport' },
];

// Historique de courses initiales
const INITIAL_PAST_RIDES: PastRideRecord[] = [
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
    driver: {
      id: 'drv_sn_101',
      fullName: 'Babacar Fall',
      phone: '+221 77 521 34 89',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      rating: 4.88,
      totalRides: 1420,
      status: 'online',
      currentLocation: { lat: 14.738, lng: -17.502, heading: 45 },
      vehicle: {
        id: 'veh_01',
        brand: 'Peugeot',
        model: '301 Allure',
        year: 2022,
        plateNumber: 'DK-7482-BC',
        color: 'Gris Métallisé',
        category: 'standard',
        seats: 4,
      },
      kyc: {
        cniNumber: '1759198500214',
        cniFrontUrl: '',
        cniBackUrl: '',
        licenseNumber: '',
        licenseUrl: '',
        carteGriseUrl: '',
        assuranceUrl: '',
        assuranceExpiry: '',
        controleTechniqueUrl: '',
        status: 'approved',
      },
      walletBalance: 84500,
      dailyEarnings: 28500,
      weeklyEarnings: 164000,
    },
    pickup: SENEGAL_LOCATIONS[1], // Almadies
    destination: SENEGAL_LOCATIONS[0], // Plateau
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
    feedbackGiven: 'Excellent trajet ! Chauffeur très courtois et véhicule impeccable.',
  },
  {
    id: 'SN-3902',
    receiptNumber: 'REC-3902-SN',
    passenger: {
      id: 'pass_sn_01',
      fullName: 'Fatou Bintou Sall',
      phone: '+221 77 412 88 90',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: 4.95,
      savedPlaces: {},
    },
    driver: {
      id: 'drv_sn_102',
      fullName: 'Modou Diop',
      phone: '+221 78 345 67 12',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      rating: 4.92,
      totalRides: 890,
      status: 'online',
      currentLocation: { lat: 14.718, lng: -17.465, heading: 120 },
      vehicle: {
        id: 'veh_02',
        brand: 'Toyota',
        model: 'Corolla Hybrid',
        year: 2023,
        plateNumber: 'DK-3319-BN',
        color: 'Blanc Nacré',
        category: 'confort',
        seats: 4,
      },
      kyc: {
        cniNumber: '',
        cniFrontUrl: '',
        cniBackUrl: '',
        licenseNumber: '',
        licenseUrl: '',
        carteGriseUrl: '',
        assuranceUrl: '',
        assuranceExpiry: '',
        controleTechniqueUrl: '',
        status: 'approved',
      },
      walletBalance: 124000,
      dailyEarnings: 42000,
      weeklyEarnings: 215000,
    },
    pickup: SENEGAL_LOCATIONS[0], // Plateau
    destination: SENEGAL_LOCATIONS[3], // AIBD
    category: 'confort',
    paymentMethod: 'orange_money',
    paymentStatus: 'paid',
    status: 'completed',
    pricing: {
      baseFare: 1500,
      distanceCost: 14000,
      durationCost: 1500,
      tollFee: 3000,
      zoneMultiplier: 1.0,
      surgeMultiplier: 1.0,
      totalFare: 20000,
      platformCommission: 3000,
      driverNetEarnings: 17000,
    },
    distanceKm: 52.0,
    durationMinutes: 42,
    createdAt: '2026-08-13T14:15:00Z',
    completedAt: '2026-08-13T15:00:00Z',
    routeCoordinates: [],
    currentRouteIndex: 0,
    isFixedPricePackage: true,
    fixedPackageName: 'Forfait VIP Dakar ↔ AIBD',
    ratingGiven: 5,
    feedbackGiven: 'Trajet fluide et rapide vers l’AIBD, très professionnel.',
  },
];

export const PassengerApp: React.FC<PassengerAppProps> = ({
  passenger,
  drivers,
  activeRide,
  assignedDriverLocation,
  onRequestRide,
  onCancelRide,
  onRateRide,
  onTriggerSos,
}) => {
  const [pickup, setPickup] = useState<GeoLocation>(SENEGAL_LOCATIONS[1]); // Almadies (fallback initial)
  const [destination, setDestination] = useState<GeoLocation>(SENEGAL_LOCATIONS[0]); // Plateau

  // Auto-détection de la position GPS actuelle du passager comme point de départ prioritaire
  useEffect(() => {
    detectPassengerGpsLocation().then((res) => {
      if (res && res.location) {
        setPickup(res.location);
      }
    }).catch(() => {});
  }, []);
  const [category, setCategory] = useState<VehicleCategory>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [isSearchingLocation, setIsSearchingLocation] = useState<'pickup' | 'destination' | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Repère visuel & Note Vocale
  const [landmarkHint, setLandmarkHint] = useState<string>('');
  const [voiceNoteData, setVoiceNoteData] = useState<{ url: string; duration: number; textSummary?: string } | null>(null);
  const [showVoiceRecorderModal, setShowVoiceRecorderModal] = useState<boolean>(false);
  const [selectedFixedPackage, setSelectedFixedPackage] = useState<FixedPricePackage | null>(null);

  // Modals de sécurité, partage, reçu et historique
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('wait_time');
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showTripDetailsModal, setShowTripDetailsModal] = useState<boolean>(false);
  const [pastRides, setPastRides] = useState<PastRideRecord[]>(INITIAL_PAST_RIDES);

  // Lieux favoris enregistrés (Domicile, Travail, etc.)
  const [favoritePlaces, setFavoritePlaces] = useState<Array<{ id: string; name: string; icon: string; location: GeoLocation }>>(() => {
    try {
      const saved = localStorage.getItem('yoon_passenger_favorites');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'fav_1', name: 'Domicile', icon: '🏠', location: SENEGAL_LOCATIONS[1] },
      { id: 'fav_2', name: 'Travail / Bureau', icon: '💼', location: SENEGAL_LOCATIONS[0] },
      { id: 'fav_3', name: 'Aéroport AIBD', icon: '✈️', location: SENEGAL_LOCATIONS[4] },
      { id: 'fav_4', name: 'Almadies Plage', icon: '🏖️', location: SENEGAL_LOCATIONS[3] },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('yoon_passenger_favorites', JSON.stringify(favoritePlaces));
    } catch {}
  }, [favoritePlaces]);

  // Notification d'approche chauffeur (< 500m)
  const [showApproachingNotification, setShowApproachingNotification] = useState(false);
  const [hasNotifiedUnder500m, setHasNotifiedUnder500m] = useState(false);

  useEffect(() => {
    if (activeRide && (activeRide.status === 'driver_assigned' || activeRide.status === 'driver_arrived') && assignedDriverLocation && !hasNotifiedUnder500m) {
      const distMeters = haversineDistanceMeters(
        assignedDriverLocation.lat,
        assignedDriverLocation.lng,
        activeRide.pickup.lat,
        activeRide.pickup.lng
      );
      if (distMeters <= 500 || activeRide.status === 'driver_arrived') {
        setShowApproachingNotification(true);
        setHasNotifiedUnder500m(true);
      }
    }
    if (!activeRide) {
      setHasNotifiedUnder500m(false);
      setShowApproachingNotification(false);
    }
  }, [assignedDriverLocation, activeRide?.status]);

  // Rating & Review State
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>(['safe', 'clean', 'polite']);
  const [tipAmount, setTipAmount] = useState<number>(500);

  // Géolocalisation GPS Passager
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);

  const handleDetectGps = async () => {
    setIsLocatingGps(true);
    setGpsFeedback('Détection de vos coordonnées GPS satellites à Dakar...');
    try {
      const res = await detectPassengerGpsLocation();
      setPickup(res.location);
      setGpsFeedback(res.message);
      setTimeout(() => setGpsFeedback(null), 6000);
    } catch (err) {
      console.warn('Erreur GPS :', err);
    } finally {
      setIsLocatingGps(false);
    }
  };

  // Estimation du prix actuel
  const estimate = calculateRidePrice(pickup, destination, category, {
    forceFixedPackage: selectedFixedPackage || undefined,
  });

  const handleSelectLocation = (loc: GeoLocation) => {
    if (isSearchingLocation === 'pickup') {
      setPickup(loc);
    } else if (isSearchingLocation === 'destination') {
      setDestination(loc);
    }
    setIsSearchingLocation(null);
    setSearchQuery('');
    setSelectedFixedPackage(null);
  };

  // Sélection d'un forfait fixe (AIBD / Saly / Diamniadio / Thiès)
  const handleSelectFixedPackage = (pkg: FixedPricePackage) => {
    setSelectedFixedPackage(pkg);
    setCategory(pkg.category);

    const targetDest = SENEGAL_LOCATIONS.find((l) =>
      l.name.includes(pkg.destinationName) || l.quarter.includes(pkg.destinationName) || pkg.name.includes(l.name)
    ) || {
      name: pkg.destinationName,
      quarter: pkg.destinationName,
      city: 'Région Thiès',
      lat: 14.671,
      lng: -17.0732,
      popular: true,
    };

    setDestination(targetDest);
  };

  const handleConfirmBooking = () => {
    executeRideRequest();
  };

  const executeRideRequest = () => {
    const isFixed = Boolean(selectedFixedPackage || estimate.isFixedPricePackage);
    onRequestRide({
      pickup,
      destination,
      category,
      paymentMethod,
      landmarkHint: landmarkHint.trim() || voiceNoteData?.textSummary || undefined,
      voiceNoteUrl: voiceNoteData?.url,
      voiceNoteDuration: voiceNoteData?.duration,
      isFixedPricePackage: isFixed,
      fixedPackageName: selectedFixedPackage?.name || estimate.fixedPackageName,
    });
  };

  const handlePaymentApproved = () => {
    setShowPaymentModal(false);
    executeRideRequest();
  };

  const handleConfirmCancellation = () => {
    setShowCancelModal(false);
    onCancelRide();
  };

  const toggleBadge = (badgeId: string) => {
    setSelectedBadges((prev) =>
      prev.includes(badgeId) ? prev.filter((b) => b !== badgeId) : [...prev, badgeId]
    );
  };

  const handleFinishRating = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    const fullFeedback = [
      ratingComment.trim(),
      selectedBadges.length > 0
        ? `Compliments: ${selectedBadges
            .map((id) => APPRECIATION_BADGES.find((b) => b.id === id)?.label)
            .filter(Boolean)
            .join(', ')}`
        : '',
      tipAmount > 0 ? `Pourboire: +${tipAmount} FCFA` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    if (activeRide) {
      const record: PastRideRecord = {
        ...activeRide,
        receiptNumber: `REC-${activeRide.id.replace('SN-', '')}-${Math.floor(1000 + Math.random() * 9000)}`,
        ratingGiven: ratingVal,
        feedbackGiven: fullFeedback,
        tipAmount,
      };
      setPastRides((prev) => [record, ...prev]);
    }

    onRateRide(ratingVal, fullFeedback);
  };

  const filteredLocations = SENEGAL_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.quarter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const driverPhoneClean = activeRide?.driver?.phone.replace(/[^0-9]/g, '') || '221775213489';

  return (
    <div className="flex flex-col h-full bg-[#090b14] text-slate-100 relative overflow-hidden font-sans select-none dark before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] before:from-pink-900/20 before:via-[#090b14]/0 before:to-[#090b14]/0 after:absolute after:inset-0 after:bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] after:from-blue-900/20 after:via-[#090b14]/0 after:to-[#090b14]/0">
      {/* Top Header Uber Premium */}
      <div className="px-4 py-3 bg-[#111827]/95 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between z-20 shadow-lg shrink-0">
        <div 
          onClick={() => setShowHistoryModal(true)}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Ouvrir l'historique & le menu de profil"
        >
          <div className="relative">
            <img
              src={passenger.avatar}
              alt={passenger.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-blue-400 shadow-md group-hover:scale-105 transition-transform"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-900"></span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">{passenger.fullName}</h3>
              <span className="px-1.5 py-0.2 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px] rounded-full flex items-center gap-0.5">
                ★ {passenger.rating}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Bouton SOS d'urgence */}
          {activeRide && (
            <button
              onClick={() => setShowSosModal(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-md shadow-rose-900/50 active:scale-95 animate-pulse"
              title="Urgence SOS"
            >
              <ShieldAlert className="w-3.5 h-3.5 fill-current" />
              <span>SOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Système Simulée : Chauffeur à < 500m */}
      {showApproachingNotification && activeRide && activeRide.driver && (
        <div className="absolute top-16 left-4 right-4 z-30 bg-[#111827]/95 backdrop-blur-xl border-2 border-blue-400 rounded-2xl shadow-2xl p-3.5 flex items-center space-x-3 animate-bounce">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400 shrink-0">
            <Car className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">🔔 Notification Yoon VTC</span>
              <button 
                onClick={() => setShowApproachingNotification(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded bg-[#1F2937]"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              Votre chauffeur <span className="text-blue-400">{activeRide.driver.fullName}</span> est à moins de 500m !
            </p>
            <p className="text-[10px] text-slate-300">
              Préparez-vous au départ : {activeRide.pickup.quarter}. Véhicule : {activeRide.driver.vehicle.brand} ({activeRide.driver.vehicle.plateNumber})
            </p>
          </div>
        </div>
      )}

      {/* Map & Panels Area (Map in background, card floating at bottom) */}
      <div className="flex-1 relative overflow-hidden flex flex-col justify-end">
        {/* Map View - full-screen background */}
        <div className="absolute inset-0 z-0">
          <DakarMapView
            drivers={drivers}
            selectedPickup={pickup}
            selectedDestination={destination}
            activeRide={activeRide}
            assignedDriverLocation={assignedDriverLocation}
            onGpsLocatePassenger={handleDetectGps}
            theme='dark'
          />
        </div>

        {/* Dynamic Glassmorphic Bottom Card floating on top of the Map */}
        <div className="w-full max-h-[85%] bg-[#111827]/95 backdrop-blur-2xl border-t border-slate-800/90 rounded-t-3xl shadow-2xl p-4 overflow-y-auto z-10 flex flex-col justify-between">
          
          {/* ÉTAT 1: AUCUNE COURSE ACTIVE (RECHERCHE & CONFIGURATION DU TRAJET) */}
          {!activeRide && (
            <div className="space-y-3.5">
              {/* Trajet : Saisie Départ et Destination */}
              <div className="space-y-2 bg-[#0B0F19]/60 p-2.5 rounded-2xl border border-slate-800/50">
                {/* Point de Départ */}
                <div
                  onClick={() => setIsSearchingLocation('pickup')}
                  className="flex items-center space-x-3 p-2 rounded-xl bg-[#111827]/40 hover:bg-[#1F2937]/60 border border-slate-800/30 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-4 ring-blue-400/20 shrink-0"></div>
                  <div className="flex-1 truncate">
                    <p className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">Point de départ</p>
                    <p className="text-xs font-bold text-slate-100 truncate">{pickup.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                {/* Destination */}
                <div
                  onClick={() => setIsSearchingLocation('destination')}
                  className="flex items-center space-x-3 p-2 rounded-xl bg-[#111827]/40 hover:bg-[#1F2937]/60 border border-slate-800/30 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shrink-0"></div>
                  <div className="flex-1 truncate">
                    <p className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">Où allez-vous ?</p>
                    <p className="text-xs font-bold text-slate-100 truncate">{destination.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Raccourcis Trajets Favoris & Trafic Dakar */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Favoris à Dakar</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    ((new Date().getHours() >= 7 && new Date().getHours() <= 10) || (new Date().getHours() >= 17 && new Date().getHours() <= 20))
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current"></span>
                    <span>
                      {((new Date().getHours() >= 7 && new Date().getHours() <= 10) || (new Date().getHours() >= 17 && new Date().getHours() <= 20))
                        ? 'Heures de pointe • Trafic dense'
                        : 'Trafic fluide à Dakar'}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {[
                    { name: '🏠 Bureau ➔ Almadies', p: SENEGAL_LOCATIONS[0], d: SENEGAL_LOCATIONS[1] },
                    { name: '✈️ Dakar ➔ AIBD Aéroport', p: SENEGAL_LOCATIONS[1], d: SENEGAL_LOCATIONS[4] },
                    { name: '🏖️ Ngor ➔ Almadies', p: SENEGAL_LOCATIONS[3], d: SENEGAL_LOCATIONS[1] },
                    { name: '🌆 Plateau ➔ Mermoz', p: SENEGAL_LOCATIONS[0], d: SENEGAL_LOCATIONS[2] },
                  ].map((fav, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setPickup(fav.p);
                        setDestination(fav.d);
                        setSelectedFixedPackage(null);
                      }}
                      className="px-2.5 py-1 bg-[#0B0F19] hover:bg-[#1F2937] border border-slate-800 rounded-xl text-[11px] font-semibold text-slate-300 shrink-0 transition-all active:scale-95 flex items-center gap-1"
                    >
                      <span>{fav.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sélection des Gammes de Véhicules en Ligne Horizontale Défilante */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gamme de véhicule
                  </label>
                  {/* Bouton rapide d'affichage des détails */}
                  <button
                    type="button"
                    onClick={() => setShowTripDetailsModal(true)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>Détails & Options</span>
                  </button>
                </div>
                
                {/* Conteneur Horizontal Scrollable sans barre visible (les 4 types sur une seule ligne) */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {(Object.keys(PRICING_RULES) as VehicleCategory[]).map((catKey) => {
                    const rule = PRICING_RULES[catKey];
                    const catEstimate = calculateRidePrice(pickup, destination, catKey, {
                      forceFixedPackage: selectedFixedPackage || undefined,
                    });
                    const isSelected = category === catKey;

                    return (
                      <div
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`p-2 rounded-xl border cursor-pointer transition-all flex flex-col justify-between shrink-0 w-36 snap-start active:scale-[0.98] ${
                          isSelected
                            ? 'bg-blue-950/40 border-blue-400 ring-1 ring-blue-400 text-white shadow-lg shadow-blue-950/40'
                            : 'bg-[#0B0F19]/70 border-slate-800/60 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 truncate">
                            {catKey === 'eco' && <Car className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                            {catKey === 'standard' && <CarFront className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                            {catKey === 'confort' && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            {catKey === 'interurbain' && <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                            <span className="text-[11px] font-bold text-slate-100 truncate">{rule.name.split(' ')[1] || rule.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-300 bg-[#111827]/90 px-1.5 py-0.5 rounded-md shrink-0 flex items-center gap-1 font-mono">
                            <Users className="w-3 h-3 text-blue-400" />
                            <span>{rule.capacity.replace('places', '').trim()}</span>
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/40">
                          <span className={`text-xs font-black ${isSelected ? 'text-blue-400' : 'text-slate-200'}`}>
                            {SenegalPaymentService.formatFCFA(catEstimate.breakdown.totalFare)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Résumé épuré de l'itinéraire */}
              <div className="flex items-center justify-between text-xs px-1 text-slate-400 py-1 border-t border-slate-800/40 mt-1">
                <span className="flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-slate-500" />
                  <span>Distance : <strong>{estimate.distanceKm} km</strong> (~{estimate.durationMinutes} min)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTripDetailsModal(true)}
                  className="text-blue-400 font-bold hover:underline"
                >
                  Voir les détails ➔
                </button>
              </div>

              {/* Bouton de Commande Uber/Yango Style */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-400 hover:to-pink-400 active:scale-[0.99] text-white font-black text-sm rounded-2xl shadow-xl shadow-pink-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Commander Yoon</span>
                <span className="bg-[#0B0F19]/20 px-2 py-0.5 rounded-lg text-xs font-bold text-white">
                  {SenegalPaymentService.formatFCFA(estimate.breakdown.totalFare)}
                </span>
              </button>
            </div>
          )}

          {/* ÉTAT 2: RADAR ACTIF - RECHERCHE D'UN CHAUFFEUR EN COURS */}
          {activeRide && activeRide.status === 'searching_driver' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-5">
              {/* Animation Radar / Sonar */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping"></div>
                <div className="absolute inset-2 rounded-full border border-blue-500/40 animate-pulse"></div>

                {/* Icône Centrale Voiture */}
                <div className="relative w-14 h-14 bg-[#0B0F19] border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-400 shadow-2xl z-10">
                  <Car className="w-7 h-7 text-blue-400 animate-pulse" />
                </div>
              </div>

              <div>
                <h4 className="font-black text-base text-white tracking-tight">Recherche d'un chauffeur Yoon...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Envoi de la requête aux chauffeurs <strong className="text-blue-400">{activeRide.category.toUpperCase()}</strong> disponibles à {pickup.quarter}.
                </p>
                {activeRide.landmarkHint && (
                  <p className="text-xs text-blue-300 font-mono mt-1">📍 Repère transmis : "{activeRide.landmarkHint}"</p>
                )}
              </div>

              <button
                onClick={() => setShowCancelModal(true)}
                className="px-5 py-2.5 bg-[#0B0F19] hover:bg-[#1F2937] text-rose-400 border border-rose-500/40 text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                Annuler la recherche
              </button>
            </div>
          )}

          {/* ÉTAT 3: CHAUFFEUR ASSIGNÉ / EN ROUTE / EN COURSE (PRIORITÉ APPEL VOCAL DIRECT) */}
          {activeRide && (activeRide.status === 'driver_assigned' || activeRide.status === 'driver_arrived' || activeRide.status === 'in_progress') && activeRide.driver && (
            <div className="space-y-3.5">
              {/* Barre de Progression de la Course */}
              <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="text-[10px] uppercase font-black tracking-wider text-blue-400">
                        {activeRide.status === 'driver_assigned' && 'Chauffeur en approche'}
                        {activeRide.status === 'driver_arrived' && 'Chauffeur arrivé sur place'}
                        {activeRide.status === 'in_progress' && 'En route vers la destination'}
                      </p>
                      <p className="text-xs font-bold text-white">
                        {activeRide.status === 'driver_assigned' && 'Arrivée estimée dans ~3 min'}
                        {activeRide.status === 'driver_arrived' && 'Votre véhicule vous attend au départ'}
                        {activeRide.status === 'in_progress' && `Arrivée à ${destination.quarter} (~${estimate.durationMinutes} min)`}
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-1 bg-blue-950 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-mono font-bold">
                    #{activeRide.id}
                  </span>
                </div>
              </div>

              {/* Carte Profil Chauffeur & Véhicule */}
              <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={activeRide.driver.avatar}
                      alt={activeRide.driver.fullName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-blue-400 shadow-md"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{activeRide.driver.fullName}</span>
                        <span className="text-amber-400 font-mono text-[10px]">★ {activeRide.driver.rating}</span>
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        {activeRide.driver.vehicle.brand} {activeRide.driver.vehicle.model} ({activeRide.driver.vehicle.color})
                      </p>
                      <p className="text-[10px] font-mono text-blue-400 font-bold">
                        Plaque: {activeRide.driver.vehicle.plateNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Note Vocale / Repère joint si présent */}
                {(activeRide.voiceNoteUrl || activeRide.landmarkHint) && (
                  <VoiceNotePlayerCard
                    audioUrl={activeRide.voiceNoteUrl}
                    duration={activeRide.voiceNoteDuration || 5}
                    landmarkHint={activeRide.landmarkHint}
                    senderName="Vous (Passager)"
                    role="passenger"
                  />
                )}
              </div>

              {/* PRIORITÉ ABSOLUE : BOUTONS D'APPEL DIRECT ET VOCAL */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Appel Téléphonique Direct */}
                <a
                  href={`tel:${activeRide.driver.phone}`}
                  className="py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/40 active:scale-95 text-xs transition-transform"
                >
                  <Phone className="w-4 h-4 fill-current animate-bounce" />
                  <span>Appel Direct ({activeRide.driver.phone})</span>
                </a>

                {/* 2. Appel / Message WhatsApp Direct */}
                <a
                  href={`https://wa.me/${driverPhoneClean}?text=${encodeURIComponent(`Bonjour ${activeRide.driver.fullName}, je suis votre passager pour la course #${activeRide.id} Yoon VTC.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 bg-blue-700 hover:bg-blue-600 text-white font-black rounded-2xl flex items-center justify-center space-x-2 shadow-lg shadow-blue-950/40 active:scale-95 text-xs transition-transform"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Appel WhatsApp</span>
                </a>
              </div>

              {/* Boutons Sécurité : SOS, Partager Trajet, Annuler */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setShowSosModal(true)}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow active:scale-95 text-[11px]"
                >
                  <ShieldAlert className="w-4 h-4 fill-current" />
                  <span>SOS Sécurité</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="py-2.5 bg-[#1F2937] hover:bg-slate-700 text-slate-100 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-slate-700 active:scale-95 text-[11px]"
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  <span>Partager</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="py-2.5 bg-rose-950/40 hover:bg-rose-950/60 text-rose-400 font-bold rounded-xl flex items-center justify-center space-x-1.5 border border-rose-500/30 active:scale-95 text-[11px]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Annuler</span>
                </button>
              </div>
            </div>
          )}

          {/* ÉTAT 4: COURSE TERMINÉE (NOTATION 5 ÉTOILES, BADGES & REÇU NUMÉRIQUE) */}
          {activeRide && activeRide.status === 'completed' && (
            <div className="space-y-3.5 text-center py-1">
              <div className="w-12 h-12 bg-blue-500/20 border-2 border-blue-400 rounded-full flex items-center justify-center text-blue-400 mx-auto shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-blue-400" />
              </div>
              
              <div>
                <h4 className="font-black text-lg text-white">Trajet terminé avec succès !</h4>
                <p className="text-xs text-slate-300">Merci d’avoir voyagé avec Yoon VTC Sénégal</p>
              </div>

              {/* Bouton Reçu Numérique Officiel */}
              <div className="bg-[#0B0F19] p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total réglé :</span>
                  <span className="font-black text-blue-400 text-sm font-mono">
                    {SenegalPaymentService.formatFCFA(activeRide.pricing.totalFare)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowReceiptModal(true)}
                  className="w-full py-2.5 bg-[#111827] hover:bg-[#1F2937] border border-blue-500/40 text-blue-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Afficher le Reçu Numérique & Détails</span>
                </button>
              </div>

              {/* Évaluation 5 Étoiles Interactive */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-200">
                  Notez votre expérience avec <strong className="text-blue-400">{activeRide.driver?.fullName}</strong>
                </p>
                
                <div className="flex justify-center items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-slate-600 hover:text-amber-400 transition-transform active:scale-125"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                      />
                    </button>
                  ))}
                </div>

                {/* Badges d'Appréciation Rapides */}
                <div className="space-y-1 text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Qu'avez-vous particulièrement apprécié ?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {APPRECIATION_BADGES.map((badge) => {
                      const isSelected = selectedBadges.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          onClick={() => toggleBadge(badge.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                            isSelected
                              ? 'bg-blue-950/60 border-blue-400 text-blue-300 shadow-sm'
                              : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span>{badge.icon}</span>
                          <span>{badge.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pourboire pour le chauffeur */}
                <div className="space-y-1 text-left">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ajouter un pourboire au chauffeur</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 500, 1000, 2000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setTipAmount(amount)}
                        className={`py-1.5 rounded-xl border text-xs font-bold transition-all ${
                          tipAmount === amount
                            ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-md'
                            : 'bg-[#0B0F19] text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {amount === 0 ? 'Aucun' : `+${amount} F`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commentaire optionnel */}
                <textarea
                  rows={2}
                  placeholder="Laisser un compliment ou un commentaire pour le chauffeur..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full p-2.5 bg-[#0B0F19] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 resize-none"
                ></textarea>
              </div>

              <button
                onClick={handleFinishRating}
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-blue-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                Envoyer mon avis & Clôturer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL SOS / URGENCE */}
      {showSosModal && activeRide && (
        <SosEmergencyModal
          activeRide={activeRide}
          userRole="passenger"
          onClose={() => setShowSosModal(false)}
        />
      )}

      {/* MODAL PARTAGER MON TRAJET */}
      {showShareModal && activeRide && (
        <ShareTripModal
          activeRide={activeRide}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* MODAL REÇU NUMÉRIQUE */}
      {showReceiptModal && activeRide && (
        <DigitalReceiptModal
          ride={activeRide}
          userRole="passenger"
          onClose={() => setShowReceiptModal(false)}
        />
      )}

      {/* MODAL DÉTAILS ET OPTIONS DU TRAJET */}
      {showTripDetailsModal && (
        <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-xl z-50 p-4 flex flex-col justify-end animate-fadeIn">
          <div className="w-full bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90%] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                Détails du trajet & Tarifs
              </h3>
              <button
                onClick={() => setShowTripDetailsModal(false)}
                className="p-1.5 rounded-full bg-[#1F2937] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Weather Widget */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-sky-100 to-indigo-100 dark:from-sky-900/40 dark:to-indigo-900/40 rounded-2xl border border-sky-200 dark:border-sky-800/50">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">🌤️</div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-sky-900 dark:text-sky-100">Dakar, Sénégal</span>
                  <span className="text-[10px] text-sky-800/80 dark:text-sky-200/80 font-medium">Partiellement nuageux</span>
                </div>
              </div>
              <div className="text-xl font-black text-sky-950 dark:text-white">28°C</div>
            </div>

            {/* Time Estimation */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#0B0F19] rounded-2xl border border-slate-800/80 mb-4">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Départ immédiat</p>
                <p className="text-sm font-black text-white">{new Date().toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Arrivée estimée</p>
                <p className="text-sm font-black text-white">{new Date(Date.now() + estimate.durationMinutes * 60000).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}</p>
              </div>
            </div>

            {/* Itinerary Metrics */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#0B0F19] rounded-2xl border border-slate-800/80">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Distance totale</p>
                <p className="text-sm font-black text-white">{estimate.distanceKm} km</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Durée estimée</p>
                <p className="text-sm font-black text-white">{estimate.durationMinutes} min</p>
              </div>
            </div>

            {/* Fare Breakdown Details */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Détails de la tarification ({category.toUpperCase()})</h4>
              <div className="p-3 bg-[#0B0F19] rounded-xl border border-slate-800/85 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Prise en charge de base</span>
                  <span className="font-semibold text-slate-200">{SenegalPaymentService.formatFCFA(estimate.breakdown.baseFare)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coût de la distance ({estimate.distanceKm} km)</span>
                  <span className="font-semibold text-slate-200">{SenegalPaymentService.formatFCFA(estimate.breakdown.distanceCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Coût de la durée (~{estimate.durationMinutes} min)</span>
                  <span className="font-semibold text-slate-200">{SenegalPaymentService.formatFCFA(estimate.breakdown.durationCost)}</span>
                </div>
                {estimate.breakdown.tollFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Péage Autoroute Dakar inclus</span>
                    <span className="font-semibold text-blue-400">+{SenegalPaymentService.formatFCFA(estimate.breakdown.tollFee)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800/60 pt-2 flex justify-between font-bold text-sm">
                  <span className="text-white">Total estimé</span>
                  <span className="text-blue-400">{SenegalPaymentService.formatFCFA(estimate.breakdown.totalFare)}</span>
                </div>
              </div>
            </div>

            {/* Forfaits Fixes Interurbains & VIP optionnels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Forfaits fixes directs</h4>
                <span className="text-[9px] text-blue-400">péage inclus</span>
              </div>
              <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                {FIXED_PRICE_PACKAGES.map((pkg) => {
                  const isSelected = selectedFixedPackage?.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        handleSelectFixedPackage(pkg);
                        setShowTripDetailsModal(false);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all border flex flex-col items-start ${
                        isSelected
                          ? 'bg-blue-950/80 border-blue-400 text-white ring-1 ring-blue-400 shadow-md'
                          : 'bg-[#0B0F19] border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{pkg.name.replace('Forfait ', '')}</span>
                      <span className="text-amber-400 font-mono mt-0.5">
                        {SenegalPaymentService.formatFCFA(pkg.priceFcfa)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Vocale & Repère */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Note Vocale & Repère Chauffeur</h4>
                <button
                  type="button"
                  onClick={() => setShowVoiceRecorderModal(true)}
                  className="px-2 py-1 bg-blue-950 hover:bg-blue-900 border border-blue-500/30 rounded-lg text-blue-300 text-[10px] font-bold flex items-center gap-1"
                >
                  <Mic className="w-3 h-3" />
                  <span>{voiceNoteData ? 'Modifier vocal' : '+ Note vocale'}</span>
                </button>
              </div>

              <input
                type="text"
                placeholder="Ex: Devant la Brioche Dorée, face à la mosquée ou portail vert..."
                value={landmarkHint}
                onChange={(e) => setLandmarkHint(e.target.value)}
                className="w-full bg-[#0B0F19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-400"
              />

              {voiceNoteData && (
                <div className="p-2 bg-blue-950/40 border border-blue-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-blue-300">Message vocal joint ({voiceNoteData.duration}s)</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">{voiceNoteData.textSummary}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceNoteData(null)}
                    className="p-1 text-rose-400 hover:text-rose-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Action */}
            <button
              onClick={() => setShowTripDetailsModal(false)}
              className="w-full py-2.5 bg-[#1F2937] hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs"
            >
              Fermer et retourner à l'écran principal
            </button>
          </div>
        </div>
      )}

      {/* MODAL HISTORIQUE DES COURSES */}
      {showHistoryModal && (
        <RideHistoryModal
          pastRides={pastRides}
          userRole="passenger"
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* MODAL RECHERCHE DE LIEU */}
      {isSearchingLocation && (
        <div className="absolute inset-0 bg-[#0B0F19]/95 backdrop-blur-xl z-50 p-4 flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">
              {isSearchingLocation === 'pickup' ? 'Définir le lieu de départ' : 'Définir la destination'}
            </h3>
            <button
              onClick={() => setIsSearchingLocation(null)}
              className="p-1 rounded-full bg-[#1F2937] text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative my-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Rechercher un quartier ou un lieu à Dakar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#111827] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Raccourcis Favoris Enregistrés */}
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider px-1">
              <span>⭐ Vos Lieux Favoris</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {favoritePlaces.map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => handleSelectLocation(fav.location)}
                  className="p-2 bg-[#111827] hover:bg-[#1F2937] border border-slate-800 rounded-xl cursor-pointer flex items-center space-x-2 transition-all active:scale-95"
                >
                  <span className="text-base">{fav.icon}</span>
                  <div className="flex-1 truncate">
                    <p className="text-xs font-bold text-slate-200 truncate">{fav.name}</p>
                    <p className="text-[9px] text-slate-400 truncate">{fav.location.quarter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">
            Tous les lieux à Dakar
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {filteredLocations.map((loc, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectLocation(loc)}
                className="p-2.5 rounded-xl hover:bg-[#111827] border border-transparent hover:border-slate-800 cursor-pointer flex items-center space-x-3 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold text-slate-100 truncate">{loc.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{loc.quarter} • {loc.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ANNULATION DE COURSE AVEC MOTIFS */}
      {showCancelModal && (
        <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-xl z-50 p-4 flex flex-col justify-center items-center animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111827] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Annulation de la course
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full bg-[#1F2937] text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Veuillez nous indiquer la raison de l'annulation pour nous aider à améliorer la qualité du service à Dakar :
            </p>

            <div className="space-y-2">
              {CANCELLATION_REASONS.map((reason) => (
                <div
                  key={reason.id}
                  onClick={() => setSelectedCancelReason(reason.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer text-xs font-medium transition-all flex items-center justify-between ${
                    selectedCancelReason === reason.id
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{reason.label}</span>
                  {selectedCancelReason === reason.id && <Check className="w-4 h-4 text-rose-400" />}
                </div>
              ))}
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 bg-[#1F2937] hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                Garder la course
              </button>
              <button
                onClick={handleConfirmCancellation}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-900/30"
              >
                Confirmer l’annulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
