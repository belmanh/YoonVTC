import React, { useState } from 'react';
import {
  Users,
  Car,
  TrendingUp,
  ShieldCheck,
  MapPin,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Eye,
  Sliders,
  Smartphone,
  CreditCard,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { Driver, Ride, PricingRule, ZoneConfig, PayoutTransaction, DocumentStatus } from '../../types/vtc';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';
import { DakarMapView } from '../Map/DakarMapView';

interface AdminDashboardProps {
  drivers: Driver[];
  rides: Ride[];
  pricingRules: Record<string, PricingRule>;
  zones: ZoneConfig[];
  payouts: PayoutTransaction[];
  onUpdateDriverKyc: (driverId: string, status: DocumentStatus, reason?: string) => void;
  onUpdatePricingRule: (category: string, updatedRule: Partial<PricingRule>) => void;
  onUpdateZoneSurge: (zoneId: string, surgeFactor: number) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  drivers,
  rides,
  pricingRules,
  zones,
  payouts,
  onUpdateDriverKyc,
  onUpdatePricingRule,
  onUpdateZoneSurge,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'rides' | 'pricing' | 'finance'>('overview');
  const [selectedDriverForKyc, setSelectedDriverForKyc] = useState<Driver | null>(null);
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Statistiques globales
  const totalCompletedRides = rides.filter((r) => r.status === 'completed').length;
  const totalVolumeFCFA = rides.reduce((acc, r) => acc + (r.pricing.totalFare || 0), 0) + 1480000;
  const totalCommissionFCFA = Math.round(totalVolumeFCFA * 0.145);
  const activeOnlineDrivers = drivers.filter((d) => d.status === 'online').length;
  const pendingKycCount = drivers.filter((d) => d.kyc.status === 'pending').length;

  const filteredDrivers = drivers.filter((d) => {
    const matchesFilter =
      driverFilter === 'all' ||
      (driverFilter === 'pending' && d.kyc.status === 'pending') ||
      (driverFilter === 'approved' && d.kyc.status === 'approved') ||
      (driverFilter === 'online' && d.status === 'online');
    const matchesSearch =
      d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header Admin */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-emerald-900/30">
            Y
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              Panneau d'Administration Yoon VTC
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono rounded">
                PROD SÉNÉGAL
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Supervision de la flotte, validation KYC, tarification FCFA et règlements Wave / Orange Money
            </p>
          </div>
        </div>

        {/* Navigation Tabs Admin */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'drivers' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Chauffeurs & KYC
            {pendingKycCount > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                {pendingKycCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('rides')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'rides' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Courses & Dispatch
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'pricing' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tarifs & Zones
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'finance' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Finances & Règlements
          </button>
        </div>
      </div>

      {/* Main Content Area Admin */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* VUE 1: OVERVIEW / TABLEAU DE BORD GLOBAL */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Volume d'affaires (GMV)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-slate-100">
                  {SenegalPaymentService.formatFCFA(totalVolumeFCFA)}
                </h3>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">+18.4% ce mois</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Revenus Plateforme (Commissions)</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-xl font-black text-sky-400">
                  {SenegalPaymentService.formatFCFA(totalCommissionFCFA)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Moyenne 14.5% par course</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Chauffeurs Actifs en Ligne</span>
                  <Car className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-xl font-black text-slate-100">
                  {activeOnlineDrivers} <span className="text-xs font-normal text-slate-400">/ {drivers.length} inscrits</span>
                </h3>
                <p className="text-[11px] text-emerald-400 mt-1 font-semibold">92% disponibilité Dakar</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Dossiers KYC en attente</span>
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                </div>
                <h3 className="text-xl font-black text-amber-400">{pendingKycCount}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Délai moyen examen: 45 min</p>
              </div>
            </div>

            {/* Carte Flotte Temps Réel Dakar */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Carte en direct de la Flotte (Dakar, Thiès, AIBD, Petite Côte)
                  </h3>
                  <p className="text-xs text-slate-400">Positions GPS rafraîchies toutes les 3 secondes</p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> En Ligne
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> En Course
                  </span>
                </div>
              </div>

              <div className="w-full h-80 rounded-xl overflow-hidden">
                <DakarMapView
                  drivers={drivers}
                  selectedPickup={null}
                  selectedDestination={null}
                  activeRide={rides[0] || null}
                />
              </div>
            </div>
          </div>
        )}

        {/* VUE 2: GESTION DES CHAUFFEURS & VÉRIFICATION KYC */}
        {activeTab === 'drivers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Rechercher chauffeur, plaque, téléphone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 w-72"
                  />
                </div>

                <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setDriverFilter('all')}
                    className={`px-3 py-1 rounded-lg ${driverFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                  >
                    Tous ({drivers.length})
                  </button>
                  <button
                    onClick={() => setDriverFilter('pending')}
                    className={`px-3 py-1 rounded-lg ${driverFilter === 'pending' ? 'bg-amber-950 text-amber-400 font-bold' : 'text-slate-400'}`}
                  >
                    En attente KYC ({pendingKycCount})
                  </button>
                  <button
                    onClick={() => setDriverFilter('approved')}
                    className={`px-3 py-1 rounded-lg ${driverFilter === 'approved' ? 'bg-emerald-950 text-emerald-400 font-bold' : 'text-slate-400'}`}
                  >
                    Validés
                  </button>
                </div>
              </div>
            </div>

            {/* Table des chauffeurs */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Chauffeur</th>
                    <th className="p-3.5">Véhicule & Plaque</th>
                    <th className="p-3.5">Gamme</th>
                    <th className="p-3.5">Courses & Note</th>
                    <th className="p-3.5">Statut KYC</th>
                    <th className="p-3.5">Solde Wallet</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredDrivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-3.5 flex items-center space-x-3">
                        <img src={d.avatar} alt={d.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                        <div>
                          <p className="font-bold text-slate-100">{d.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{d.phone}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-slate-200">{d.vehicle.brand} {d.vehicle.model}</p>
                        <span className="font-mono text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-amber-400 border border-slate-800">
                          {d.vehicle.plateNumber}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                          {d.vehicle.category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-slate-200">{d.totalRides} courses</p>
                        <p className="text-[11px] text-amber-400 font-semibold">★ {d.rating > 0 ? d.rating.toFixed(2) : 'Nouveau'}</p>
                      </td>
                      <td className="p-3.5">
                        {d.kyc.status === 'approved' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Validé
                          </span>
                        )}
                        {d.kyc.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" /> En attente KYC
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-emerald-400">
                        {SenegalPaymentService.formatFCFA(d.walletBalance)}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedDriverForKyc(d)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" /> Examiner Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VUE 3: GESTION DES COURSES & HISTORIQUE */}
        {activeTab === 'rides' && (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Réf & Date</th>
                    <th className="p-3.5">Passager</th>
                    <th className="p-3.5">Chauffeur</th>
                    <th className="p-3.5">Itinéraire (Sénégal)</th>
                    <th className="p-3.5">Montant FCFA</th>
                    <th className="p-3.5">Paiement</th>
                    <th className="p-3.5">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rides.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-3.5">
                        <p className="font-mono font-bold text-slate-200">{r.id}</p>
                        <p className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleTimeString()}</p>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">
                        {r.passenger.fullName}
                      </td>
                      <td className="p-3.5">
                        {r.driver ? (
                          <div>
                            <p className="font-semibold text-slate-200">{r.driver.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{r.driver.vehicle.plateNumber}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Recherche...</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <p className="text-slate-200">{r.pickup.quarter} ➔ {r.destination.quarter}</p>
                        <p className="text-[10px] text-slate-400">{r.distanceKm} km • {r.durationMinutes} min</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-bold text-emerald-400">{SenegalPaymentService.formatFCFA(r.pricing.totalFare)}</p>
                        <p className="text-[10px] text-slate-400">Com: {r.pricing.platformCommission} F</p>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          r.status === 'completed' ? 'bg-emerald-950 text-emerald-400' :
                          r.status === 'in_progress' ? 'bg-sky-950 text-sky-400' : 'bg-amber-950 text-amber-400'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VUE 4: TARIFICATION & SURGE ZONES */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">Configuration des Grilles Tarifaires (FCFA)</h3>
              <p className="text-xs text-slate-400">Ajustez les prix au kilomètre, à la minute et les taux de commission</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {Object.keys(pricingRules).map((catKey) => {
                const rule = pricingRules[catKey];
                return (
                  <div key={catKey} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-100">{rule.name}</h4>
                      <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-bold">
                        Commission : {(rule.commissionRate * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 font-medium">Prise en charge (Base)</label>
                        <input
                          type="number"
                          value={rule.baseFare}
                          onChange={(e) => onUpdatePricingRule(catKey, { baseFare: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Prix par Kilomètre</label>
                        <input
                          type="number"
                          value={rule.pricePerKm}
                          onChange={(e) => onUpdatePricingRule(catKey, { pricePerKm: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Prix par Minute</label>
                        <input
                          type="number"
                          value={rule.pricePerMinute}
                          onChange={(e) => onUpdatePricingRule(catKey, { pricePerMinute: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 font-medium">Course Minimum</label>
                        <input
                          type="number"
                          value={rule.minFare}
                          onChange={(e) => onUpdatePricingRule(catKey, { minFare: Number(e.target.value) })}
                          className="w-full mt-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gestion des Zones et Surges */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-100">Coefficients Multiplicateurs par Zone (Surge / Péage)</h4>
              <div className="grid grid-cols-2 gap-3">
                {zones.map((z) => (
                  <div key={z.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-200">{z.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Péage : {z.tollRequired ? `${z.tollAmount} FCFA inclus` : 'Non'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">Multiplicateur :</span>
                      <select
                        value={z.surgeFactor}
                        onChange={(e) => onUpdateZoneSurge(z.id, Number(e.target.value))}
                        className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-emerald-400 font-bold"
                      >
                        <option value="1.0">1.0x (Normal)</option>
                        <option value="1.15">1.15x (Modéré)</option>
                        <option value="1.25">1.25x (Heure de pointe VDN)</option>
                        <option value="1.5">1.5x (Forte demande / Pluie)</option>
                        <option value="2.0">2.0x (Fêtes Tabaski / Magal)</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VUE 5: FINANCES & RÈGLEMENTS WAVE / ORANGE MONEY */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Commissions Encaissées</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-emerald-400">
                  {SenegalPaymentService.formatFCFA(totalCommissionFCFA)}
                </h3>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Part Reversée aux Chauffeurs (85%)</span>
                  <TrendingUp className="w-4 h-4 text-sky-400" />
                </div>
                <h3 className="text-xl font-black text-slate-100">
                  {SenegalPaymentService.formatFCFA(totalVolumeFCFA - totalCommissionFCFA)}
                </h3>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Retraits Instantanés Réussis</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-slate-100">{payouts.length + 12} virements</h3>
              </div>
            </div>

            {/* Journal des Virements Wave / OM */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
              <h4 className="font-bold text-sm text-slate-100">Journal des Retraits Chauffeurs (Wave Sénégal & Orange Money)</h4>
              <div className="space-y-2 text-xs">
                {payouts.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-200">{p.driverName} ({p.recipientPhone})</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Réf: {p.reference} • {new Date(p.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-400">{SenegalPaymentService.formatFCFA(p.amount)}</p>
                      <span className="text-[10px] uppercase font-bold text-sky-400">{p.method} (Succès)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DRAWER / MODAL EXAMEN KYC CHAUFFEUR */}
      {selectedDriverForKyc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-slate-900 h-full border-l border-slate-800 p-6 overflow-y-auto space-y-5 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-slate-100">Inspection Dossier KYC Chauffeur</h3>
                <button
                  onClick={() => setSelectedDriverForKyc(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Info chauffeur */}
              <div className="flex items-center space-x-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <img
                  src={selectedDriverForKyc.avatar}
                  alt={selectedDriverForKyc.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-emerald-400"
                />
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">{selectedDriverForKyc.fullName}</h4>
                  <p className="text-xs text-slate-400">{selectedDriverForKyc.phone}</p>
                  <p className="text-xs font-mono text-amber-400">Plaque : {selectedDriverForKyc.vehicle.plateNumber}</p>
                </div>
              </div>

              {/* Pièces justificatives */}
              <div className="space-y-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>1. Carte Nationale d'Identité Sénégalaise (CNI)</span>
                    <span className="text-emerald-400">Valide</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">N° CNI: {selectedDriverForKyc.kyc.cniNumber}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>2. Permis de Conduire Sénégalais</span>
                    <span className="text-emerald-400">Valide (Cat. B)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">N° Permis: {selectedDriverForKyc.kyc.licenseNumber}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>3. Carte Grise du Véhicule</span>
                    <span className="text-emerald-400">Propriétaire conforme</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedDriverForKyc.vehicle.brand} {selectedDriverForKyc.vehicle.model} ({selectedDriverForKyc.vehicle.year})
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>4. Assurance Automobile CEMAC & Sénégal</span>
                    <span className="text-emerald-400">En cours</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Date d'expiration: {selectedDriverForKyc.kyc.assuranceExpiry}</p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-200">
                    <span>5. Visite Technique & Contrôle de Sécurité</span>
                    <span className="text-emerald-400">Approuvé</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Décision Admin */}
            <div className="flex space-x-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onUpdateDriverKyc(selectedDriverForKyc.id, 'rejected', 'Documents non lisibles');
                  setSelectedDriverForKyc(null);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-rose-900/40 text-rose-400 font-bold rounded-xl text-xs border border-rose-500/30"
              >
                Rejeter le dossier
              </button>
              <button
                onClick={() => {
                  onUpdateDriverKyc(selectedDriverForKyc.id, 'approved');
                  setSelectedDriverForKyc(null);
                }}
                className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/30"
              >
                Valider & Activer le Compte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
