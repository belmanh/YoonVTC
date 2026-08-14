import React, { useState } from 'react';
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
  Star,
  Clock,
  ChevronRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  QrCode,
  Smartphone,
  Check,
  X,
} from 'lucide-react';
import {
  GeoLocation,
  VehicleCategory,
  PaymentMethod,
  Ride,
  Driver,
  Passenger,
} from '../../types/vtc';
import { SENEGAL_LOCATIONS, PRICING_RULES } from '../../data/senegalData';
import { calculateRidePrice } from '../../services/pricingEngine';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';
import { DakarMapView } from '../Map/DakarMapView';
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
  }) => void;
  onCancelRide: () => void;
  onRateRide: (rating: number, comment: string) => void;
  onTriggerSos: () => void;
}

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
  const [pickup, setPickup] = useState<GeoLocation>(SENEGAL_LOCATIONS[1]); // Almadies
  const [destination, setDestination] = useState<GeoLocation>(SENEGAL_LOCATIONS[0]); // Plateau
  const [category, setCategory] = useState<VehicleCategory>('standard');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wave');
  const [isSearchingLocation, setIsSearchingLocation] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [tipAmount, setTipAmount] = useState<number>(500);

  // Estimation du prix actuel
  const estimate = calculateRidePrice(pickup, destination, category);

  const handleSelectLocation = (loc: GeoLocation) => {
    if (isSearchingLocation === 'pickup') {
      setPickup(loc);
    } else if (isSearchingLocation === 'destination') {
      setDestination(loc);
    }
    setIsSearchingLocation(null);
    setSearchQuery('');
  };

  const handleConfirmBooking = () => {
    if (paymentMethod === 'wave' || paymentMethod === 'orange_money') {
      setShowPaymentModal(true);
    } else {
      onRequestRide({
        pickup,
        destination,
        category,
        paymentMethod,
      });
    }
  };

  const handlePaymentApproved = () => {
    setShowPaymentModal(false);
    onRequestRide({
      pickup,
      destination,
      category,
      paymentMethod,
    });
  };

  const handleFinishRating = () => {
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    onRateRide(ratingVal, ratingComment);
  };

  const filteredLocations = SENEGAL_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.quarter.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Top Header Mobile */}
      <div className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={passenger.avatar}
              alt={passenger.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Passager (Sénégal)</p>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              {passenger.fullName}
              <span className="text-[11px] text-amber-400 font-semibold">★ {passenger.rating}</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {activeRide && (
            <button
              onClick={() => setShowSosModal(true)}
              className="px-2.5 py-1.5 bg-rose-600/20 border border-rose-500/40 text-rose-400 rounded-lg text-xs font-bold flex items-center space-x-1 hover:bg-rose-600/30 transition-colors shadow-sm animate-pulse"
              title="Urgence SOS"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>SOS</span>
            </button>
          )}

          <div className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-[11px] font-mono text-emerald-400 font-bold">
            {paymentMethod === 'wave' && '💙 Wave Pay'}
            {paymentMethod === 'orange_money' && '🧡 Orange Money'}
            {paymentMethod === 'cash' && '💵 Cash FCFA'}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        {/* Leaflet Map View */}
        <div className="w-full h-1/2 min-h-[220px] relative">
          <DakarMapView
            drivers={drivers}
            selectedPickup={pickup}
            selectedDestination={destination}
            activeRide={activeRide}
            assignedDriverLocation={assignedDriverLocation}
          />
        </div>

        {/* Dynamic Bottom Sheet / Panels */}
        <div className="w-full flex-1 bg-slate-900 border-t border-slate-800 rounded-t-2xl shadow-2xl p-4 overflow-y-auto z-10 flex flex-col justify-between">
          
          {/* ÉTAT 1: AUCUNE COURSE ACTIVE (RECHERCHE & CONFIGURATION) */}
          {!activeRide && (
            <div className="space-y-4">
              {/* Sélecteurs de Trajet (Départ / Destination) */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                {/* Départ */}
                <div
                  onClick={() => setIsSearchingLocation('pickup')}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 shrink-0"></div>
                  <div className="flex-1 truncate">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Point de départ</p>
                    <p className="text-xs font-semibold text-slate-100 truncate">{pickup.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>

                {/* Destination */}
                <div
                  onClick={() => setIsSearchingLocation('destination')}
                  className="flex items-center space-x-3 p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 cursor-pointer transition-colors"
                >
                  <div className="w-3 h-3 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shrink-0"></div>
                  <div className="flex-1 truncate">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Où allez-vous ? (Destination)</p>
                    <p className="text-xs font-semibold text-slate-100 truncate">{destination.name}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Métriques du trajet estimé */}
              <div className="flex items-center justify-between text-xs px-2 text-slate-300">
                <span className="flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  Distance: <strong className="text-slate-100">{estimate.distanceKm} km</strong>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Durée: <strong className="text-slate-100">{estimate.durationMinutes} min</strong>
                </span>
                {estimate.breakdown.tollFee > 0 && (
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium border border-amber-500/30">
                    Péage: +{estimate.breakdown.tollFee} F
                  </span>
                )}
              </div>

              {/* Sélection de la Gamme de Véhicules */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Gamme de véhicule
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PRICING_RULES) as VehicleCategory[]).map((catKey) => {
                    const rule = PRICING_RULES[catKey];
                    const catEstimate = calculateRidePrice(pickup, destination, catKey);
                    const isSelected = category === catKey;

                    return (
                      <div
                        key={catKey}
                        onClick={() => setCategory(catKey)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 text-slate-100 shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1.5">
                            {catKey === 'eco' && <Car className="w-4 h-4 text-emerald-400" />}
                            {catKey === 'standard' && <CarFront className="w-4 h-4 text-sky-400" />}
                            {catKey === 'confort' && <Crown className="w-4 h-4 text-amber-400" />}
                            {catKey === 'interurbain' && <MapPin className="w-4 h-4 text-indigo-400" />}
                            <span className="text-xs font-bold">{rule.name.split(' ')[1] || rule.name}</span>
                          </div>
                        </div>

                        <div className="flex items-baseline justify-between mt-1">
                          <span className="text-[10px] text-slate-400">{rule.capacity}</span>
                          <span className={`text-xs font-extrabold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {SenegalPaymentService.formatFCFA(catEstimate.breakdown.totalFare)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sélection du Moyen de Paiement */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Moyen de paiement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wave')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition-all ${
                      paymentMethod === 'wave'
                        ? 'bg-sky-950/40 border-sky-400 text-sky-300 ring-1 ring-sky-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1 text-sky-400" />
                    <span>Wave Sénégal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('orange_money')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition-all ${
                      paymentMethod === 'orange_money'
                        ? 'bg-orange-950/40 border-orange-400 text-orange-300 ring-1 ring-orange-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1 text-orange-400" />
                    <span>Orange Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center text-xs font-semibold transition-all ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-950/40 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mb-1 text-emerald-400" />
                    <span>Espèces (Cash)</span>
                  </button>
                </div>
              </div>

              {/* Bouton de Commande */}
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Commander {PRICING_RULES[category].name}</span>
                <span className="bg-emerald-700/80 px-2 py-0.5 rounded text-xs">
                  {SenegalPaymentService.formatFCFA(estimate.breakdown.totalFare)}
                </span>
              </button>
            </div>
          )}

          {/* ÉTAT 2: RECHERCHE D'UN CHAUFFEUR EN COURS */}
          {activeRide && activeRide.status === 'searching_driver' && (
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 animate-ping"></div>
                <div className="w-14 h-14 bg-emerald-600/20 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400">
                  <Navigation className="w-7 h-7 animate-spin" />
                </div>
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-100">Recherche de chauffeurs à proximité...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Envoi de la requête aux chauffeurs {activeRide.category.toUpperCase()} de {pickup.quarter}
                </p>
              </div>
              <button
                onClick={onCancelRide}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-lg"
              >
                Annuler la recherche
              </button>
            </div>
          )}

          {/* ÉTAT 3: CHAUFFEUR ASSIGNÉ / EN ROUTE / EN COURSE */}
          {activeRide && (activeRide.status === 'driver_assigned' || activeRide.status === 'driver_arrived' || activeRide.status === 'in_progress') && activeRide.driver && (
            <div className="space-y-4">
              {/* Bannière de Statut */}
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-emerald-400">
                      {activeRide.status === 'driver_assigned' && 'Chauffeur en approche'}
                      {activeRide.status === 'driver_arrived' && 'Chauffeur arrivé au point de départ'}
                      {activeRide.status === 'in_progress' && 'Course en cours vers la destination'}
                    </p>
                    <p className="text-xs font-bold text-slate-200">
                      {activeRide.status === 'driver_assigned' && 'Arrivée estimée dans ~3 min'}
                      {activeRide.status === 'driver_arrived' && 'Veuillez monter à bord du véhicule'}
                      {activeRide.status === 'in_progress' && `Arrivée à ${destination.quarter} (~${estimate.durationMinutes} min)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 border border-slate-700"
                    title="Partager le trajet"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <a
                    href={`tel:${activeRide.driver.phone}`}
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                    title="Appeler le chauffeur"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Fiche Chauffeur & Véhicule */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={activeRide.driver.avatar}
                    alt={activeRide.driver.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{activeRide.driver.fullName}</h4>
                    <p className="text-xs text-slate-400 font-medium">
                      {activeRide.driver.vehicle.brand} {activeRide.driver.vehicle.model} • {activeRide.driver.vehicle.color}
                    </p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {activeRide.driver.rating.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-500">({activeRide.driver.totalRides} courses)</span>
                    </div>
                  </div>
                </div>

                {/* Plaque d'immatriculation Sénégalaise */}
                <div className="text-right">
                  <div className="px-2.5 py-1 bg-slate-900 border-2 border-slate-700 rounded-md font-mono text-xs font-black text-amber-400 tracking-wider shadow-inner">
                    {activeRide.driver.vehicle.plateNumber}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Sénégal 🇸🇳</span>
                </div>
              </div>

              {/* Détail Prix & Méthode */}
              <div className="flex items-center justify-between text-xs px-2 text-slate-300">
                <span>Total à régler :</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {SenegalPaymentService.formatFCFA(activeRide.pricing.totalFare)}
                </span>
              </div>
            </div>
          )}

          {/* ÉTAT 4: COURSE TERMINÉE (NOTATION & REÇU NUMÉRIQUE) */}
          {activeRide && activeRide.status === 'completed' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base text-slate-100">Vous êtes arrivé à destination !</h4>
                <p className="text-xs text-slate-400">Merci d’avoir voyagé avec Yoon VTC Sénégal</p>
              </div>

              {/* Reçu Numérique */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Prise en charge</span>
                  <span>{activeRide.pricing.baseFare} FCFA</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Distance ({activeRide.distanceKm} km)</span>
                  <span>{activeRide.pricing.distanceCost} FCFA</span>
                </div>
                {activeRide.pricing.tollFee > 0 && (
                  <div className="flex justify-between text-amber-400">
                    <span>Péage Autoroute de l'Avenir</span>
                    <span>+{activeRide.pricing.tollFee} FCFA</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-sm text-slate-100">
                  <span>Total payé ({activeRide.paymentMethod.toUpperCase()})</span>
                  <span className="text-emerald-400">{SenegalPaymentService.formatFCFA(activeRide.pricing.totalFare)}</span>
                </div>
              </div>

              {/* Évaluation Chauffeur */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">Notez votre chauffeur {activeRide.driver?.fullName}</p>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingVal(star)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= ratingVal ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                      />
                    </button>
                  ))}
                </div>

                <div className="flex justify-center space-x-2 pt-1">
                  {[0, 500, 1000, 2000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTipAmount(amount)}
                      className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium ${
                        tipAmount === amount
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {amount === 0 ? 'Pas de pourboire' : `+${amount} F pourboire`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFinishRating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/30"
              >
                Envoyer l'évaluation & Terminer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL RECHERCHE DE LIEU */}
      {isSearchingLocation && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-100">
              {isSearchingLocation === 'pickup' ? 'Choisir le point de départ' : 'Choisir la destination'}
            </h3>
            <button
              onClick={() => setIsSearchingLocation(null)}
              className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un quartier, rue ou lieu (ex: Almadies, AIBD, Plateau...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5">
            {filteredLocations.map((loc, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectLocation(loc)}
                className="p-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 rounded-xl cursor-pointer flex items-center space-x-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 truncate">
                  <p className="text-xs font-bold text-slate-200 truncate">{loc.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {loc.quarter}, {loc.city}
                  </p>
                </div>
                {loc.popular && (
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    Populaire
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL PAIEMENT WAVE / ORANGE MONEY SIMULATION */}
      {showPaymentModal && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 p-4 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-2xl space-y-4">
            {paymentMethod === 'wave' ? (
              <>
                <div className="w-12 h-12 bg-sky-500/20 border border-sky-400 text-sky-400 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-sky-400">Paiement Sécurisé Wave Sénégal</h3>
                <p className="text-xs text-slate-300">
                  Scannez le QR Code ou validez la notification push Wave sur votre téléphone (+221 77/78/76/70).
                </p>
                <div className="p-4 bg-white rounded-xl inline-block shadow-lg mx-auto">
                  <QrCode className="w-28 h-28 text-slate-950" />
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300">
                  Montant à débiter : <strong className="text-sky-400">{SenegalPaymentService.formatFCFA(estimate.breakdown.totalFare)}</strong>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-orange-500/20 border border-orange-400 text-orange-400 rounded-full flex items-center justify-center mx-auto">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-orange-400">Paiement Orange Money Sénégal</h3>
                <p className="text-xs text-slate-300">
                  Composez le <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-400 font-mono">#144#391#</code> pour obtenir votre code d'autorisation OTP.
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                  <input
                    type="text"
                    placeholder="Entrez le code OTP reçu par SMS"
                    defaultValue="849201"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-center text-sm font-mono tracking-widest text-orange-400"
                  />
                  <div className="text-[11px] text-slate-400">
                    Montant : <strong className="text-orange-400">{SenegalPaymentService.formatFCFA(estimate.breakdown.totalFare)}</strong>
                  </div>
                </div>
              </>
            )}

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handlePaymentApproved}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOS URGENCE SÉNÉGAL */}
      {showSosModal && (
        <div className="absolute inset-0 bg-rose-950/90 backdrop-blur-md z-50 p-4 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/50 rounded-2xl p-5 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-600/20 border border-rose-500 rounded-full flex items-center justify-center text-rose-500 mx-auto animate-bounce">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-rose-400">Centre d'Alerte SOS & Sécurité</h3>
            <p className="text-xs text-slate-300">
              Votre position GPS en temps réel sera immédiatement transmise aux services de secours et à vos contacts d'urgence.
            </p>

            <div className="space-y-2">
              <a
                href="tel:17"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
              >
                <Phone className="w-4 h-4" /> <span>Police Secours (17) / Gendarmerie (800 00 20 20)</span>
              </a>
              <button
                onClick={() => {
                  onTriggerSos();
                  setShowSosModal(false);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-semibold rounded-xl border border-rose-500/30"
              >
                Diffuser Alerte Silencieuse au Support Yoon
              </button>
            </div>

            <button
              onClick={() => setShowSosModal(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL PARTAGE DE TRAJET */}
      {showShareModal && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-4 flex flex-col justify-center items-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100">Partager mon trajet en direct</h3>
            <p className="text-xs text-slate-300">
              Permettez à vos proches de suivre en direct votre position GPS et le numéro d'immatriculation du chauffeur ({activeRide?.driver?.vehicle.plateNumber}).
            </p>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-emerald-400 break-all select-all">
              https://yoon.sn/track/{activeRide?.id || 'live-ride-7492'}
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
