import React, { useState, useEffect } from 'react';
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
  Smartphone,
  CreditCard,
  Building2,
} from 'lucide-react';
import { Driver, Ride, PayoutTransaction } from '../../types/vtc';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';
import { DakarMapView } from '../Map/DakarMapView';
import confetti from 'canvas-confetti';

interface DriverAppProps {
  driver: Driver;
  activeRide: Ride | null;
  assignedDriverLocation: { lat: number; lng: number; heading: number } | null;
  onToggleOnline: (isOnline: boolean) => void;
  onAcceptRide: (rideId: string) => void;
  onDeclineRide: (rideId: string) => void;
  onDriverArrived: (rideId: string) => void;
  onStartRide: (rideId: string) => void;
  onCompleteRide: (rideId: string) => void;
  onRequestPayout: (payout: Omit<PayoutTransaction, 'id' | 'timestamp' | 'status' | 'reference'>) => void;
}

export const DriverApp: React.FC<DriverAppProps> = ({
  driver,
  activeRide,
  assignedDriverLocation,
  onToggleOnline,
  onAcceptRide,
  onDeclineRide,
  onDriverArrived,
  onStartRide,
  onCompleteRide,
  onRequestPayout,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'wallet' | 'kyc'>('map');
  const [countdown, setCountdown] = useState<number>(15);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<'wave' | 'orange_money'>('wave');
  const [payoutAmount, setPayoutAmount] = useState<number>(20000);
  const [payoutPhone, setPayoutPhone] = useState(driver.phone);

  const isOnline = driver.status === 'online';

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

  const handleWithdraw = () => {
    if (payoutAmount <= 0 || payoutAmount > driver.walletBalance) return;
    
    onRequestPayout({
      driverId: driver.id,
      driverName: driver.fullName,
      amount: payoutAmount,
      method: payoutMethod,
      recipientPhone: payoutPhone,
      fee: payoutMethod === 'wave' ? 0 : 200,
    });

    confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
    setShowPayoutModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Top Header Mobile Driver */}
      <div className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img
              src={driver.avatar}
              alt={driver.fullName}
              className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
            />
            <span
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                isOnline ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            ></span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-bold text-slate-100">{driver.fullName}</h3>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                ★ {driver.rating.toFixed(1)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {driver.vehicle.brand} {driver.vehicle.model} • <span className="text-emerald-400 font-bold">{driver.vehicle.plateNumber}</span>
            </p>
          </div>
        </div>

        {/* Toggle En Ligne / Hors Ligne */}
        <button
          onClick={() => onToggleOnline(!isOnline)}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-all shadow-md ${
            isOnline
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isOnline ? 'EN LIGNE' : 'HORS LIGNE'}</span>
        </button>
      </div>

      {/* Navigation Tabs (Carte / Portefeuille / Documents KYC) */}
      <div className="grid grid-cols-3 bg-slate-900 border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('map')}
          className={`py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'map'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Navigation</span>
        </button>

        <button
          onClick={() => setActiveTab('wallet')}
          className={`py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'wallet'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>Gains & Wallet</span>
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`py-2.5 flex items-center justify-center space-x-1.5 border-b-2 transition-colors ${
            activeTab === 'kyc'
              ? 'border-emerald-500 text-emerald-400 bg-slate-800/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Profil & KYC</span>
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
            <div className="w-full flex-1 bg-slate-900 border-t border-slate-800 rounded-t-2xl shadow-2xl p-4 overflow-y-auto flex flex-col justify-between">
              
              {/* ÉTAT HORS LIGNE */}
              {!isOnline && !activeRide && (
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
                    onClick={() => onToggleOnline(true)}
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
                    <h4 className="font-bold text-slate-100 text-sm">Radar de Dispatch Actif</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      En attente de demandes de course dans votre zone (Dakar & VDN)...
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full pt-2">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Gains du jour</p>
                      <p className="text-sm font-black text-emerald-400">{SenegalPaymentService.formatFCFA(driver.dailyEarnings)}</p>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Courses aujourd'hui</p>
                      <p className="text-sm font-black text-slate-100">6 courses</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ÉTAT DEMANDE DE COURSE ENTRANTE (POPUP DE DISPATCH AVEC TIMER 15s) */}
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

                  {/* Prix net Chauffeur */}
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Votre gain net (après 15%)</p>
                      <p className="text-lg font-black text-emerald-400">
                        {SenegalPaymentService.formatFCFA(activeRide.pricing.driverNetEarnings)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Paiement</p>
                      <span className="text-xs font-bold text-slate-200 uppercase">
                        {activeRide.paymentMethod}
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

              {/* ÉTAT COURSE EN COURS (ÉTAPES DE GUIDAGE GPS) */}
              {activeRide && (activeRide.status === 'driver_assigned' || activeRide.status === 'driver_arrived' || activeRide.status === 'in_progress') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-400">
                        {activeRide.status === 'driver_assigned' && '1. En route vers le client'}
                        {activeRide.status === 'driver_arrived' && '2. Arrivé au point de prise en charge'}
                        {activeRide.status === 'in_progress' && '3. Course en cours vers la destination'}
                      </p>
                      <h4 className="text-sm font-bold text-slate-100 mt-0.5">
                        Passager: {activeRide.passenger.fullName}
                      </h4>
                    </div>

                    <a
                      href={`tel:${activeRide.passenger.phone}`}
                      className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                      title="Appeler le passager"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Actions par étape */}
                  {activeRide.status === 'driver_assigned' && (
                    <button
                      onClick={() => onDriverArrived(activeRide.id)}
                      className="w-full py-3.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>J'AI ARRIVÉ AU POINT DE DÉPART</span>
                    </button>
                  )}

                  {activeRide.status === 'driver_arrived' && (
                    <button
                      onClick={() => onStartRide(activeRide.id)}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>LE PASSAGER EST À BORD - DÉMARRER</span>
                    </button>
                  )}

                  {activeRide.status === 'in_progress' && (
                    <button
                      onClick={() => onCompleteRide(activeRide.id)}
                      className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ARRIVÉ À DESTINATION - TERMINER LA COURSE</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 2: GAINS & WALLET CHAUFFEUR (RETRAIT WAVE / ORANGE MONEY) */}
        {activeTab === 'wallet' && (
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* Carte Solde Principal */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Solde disponible
                </span>
                <span className="font-mono text-emerald-400">Commission plateforme: 15%</span>
              </div>
              <h2 className="text-2xl font-black text-slate-100">
                {SenegalPaymentService.formatFCFA(driver.walletBalance)}
              </h2>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={() => setShowPayoutModal(true)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Retirer mes gains (Wave / OM)</span>
                </button>
              </div>
            </div>

            {/* Statistiques Financières */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Aujourd'hui</span>
                </div>
                <p className="text-base font-bold text-emerald-400">
                  {SenegalPaymentService.formatFCFA(driver.dailyEarnings)}
                </p>
                <p className="text-[10px] text-slate-500">6 courses terminées</p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cette semaine</span>
                </div>
                <p className="text-base font-bold text-sky-400">
                  {SenegalPaymentService.formatFCFA(driver.weeklyEarnings)}
                </p>
                <p className="text-[10px] text-slate-500">38 courses au total</p>
              </div>
            </div>

            {/* Historique des paiements & prélèvements */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dernières opérations Wallet
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-200">Course Almadies ➔ Plateau</p>
                    <p className="text-[10px] text-slate-500">Wave • Commission: -675 FCFA (15%)</p>
                  </div>
                  <span className="font-bold text-emerald-400">+3 825 FCFA</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-200">Retrait instantané Wave Sénégal</p>
                    <p className="text-[10px] text-slate-500">Virement vers {driver.phone}</p>
                  </div>
                  <span className="font-bold text-rose-400">-25 000 FCFA</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-950 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-200">Course Mermoz ➔ AIBD</p>
                    <p className="text-[10px] text-slate-500">Orange Money • Forfait Aéroport</p>
                  </div>
                  <span className="font-bold text-emerald-400">+12 750 FCFA</span>
                </div>
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
      </div>

      {/* MODAL RETRAIT GAINS VERS WAVE / ORANGE MONEY */}
      {showPayoutModal && (
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
    </div>
  );
};
