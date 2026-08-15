import React, { useState } from 'react';
import {
  ShieldAlert,
  Phone,
  AlertTriangle,
  MapPin,
  Car,
  User,
  Share2,
  CheckCircle2,
  X,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Ride } from '../../types/vtc';

interface SosEmergencyModalProps {
  activeRide: Ride;
  userRole: 'passenger' | 'driver';
  onClose: () => void;
}

export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  activeRide,
  userRole,
  onClose,
}) => {
  const [sosSent, setSosSent] = useState(false);
  const [selectedEmergencyContact, setSelectedEmergencyContact] = useState<string | null>(null);

  const SENEGAL_EMERGENCY_NUMBERS = [
    {
      name: 'Police Secours Sénégal',
      number: '17',
      telHref: 'tel:17',
      description: 'Intervention d’urgence Police Nationale Dakar & Régions',
      badge: 'Urgence 24/7',
    },
    {
      name: 'Gendarmerie Nationale (Numéro Vert)',
      number: '800 00 20 20',
      telHref: 'tel:800002020',
      description: 'Autoroute à péage, axes interurbains, sécurité routière',
      badge: 'Gratuit',
    },
    {
      name: 'SAMU National (Urgences Médicales)',
      number: '15 15',
      telHref: 'tel:1515',
      description: 'Assistance médicale et ambulances d’urgence',
      badge: 'Santé',
    },
    {
      name: 'Sapeurs-Pompiers (BNSP)',
      number: '18',
      telHref: 'tel:18',
      description: 'Secours aux victimes, accidents et incendies',
      badge: 'Pompiers',
    },
  ];

  const handleSendPlatformSos = () => {
    setSosSent(true);
    // Simuler l'alerte temps réel vers le centre de dispatching sécurité Yoon VTC
    setTimeout(() => {
      // toast ou alerte
    }, 1500);
  };

  const getEmergencyMessage = () => {
    const lat = activeRide.driver?.currentLocation.lat || activeRide.pickup.lat;
    const lng = activeRide.driver?.currentLocation.lng || activeRide.pickup.lng;
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    return encodeURIComponent(
      `🚨 [ALERTE SOS YOON VTC] J'ai besoin d'une assistance d'urgence !\n` +
      `Course ID: #${activeRide.id}\n` +
      `Véhicule: ${activeRide.driver?.vehicle.brand} ${activeRide.driver?.vehicle.model} (${activeRide.driver?.vehicle.plateNumber || 'VTC'})\n` +
      `Chauffeur: ${activeRide.driver?.fullName || 'Assigné'}\n` +
      `Passager: ${activeRide.passenger.fullName}\n` +
      `Trajet: ${activeRide.pickup.quarter} -> ${activeRide.destination.quarter}\n` +
      `Position GPS en direct: ${mapsLink}`
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-4 flex items-center justify-center animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-rose-600/80 rounded-2xl p-5 shadow-2xl shadow-rose-950/50 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* En-tête Alerte Rouge */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-900/50 animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-rose-400 uppercase tracking-wide">
                Bouton SOS & Urgence Sécurité
              </h3>
              <p className="text-xs text-slate-400">Assistance immédiate 24/7 au Sénégal</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Détails de la course en cours pour identification rapide */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Course active : <strong>#{activeRide.id}</strong></span>
            <span className="text-emerald-400 font-bold font-mono">{activeRide.status.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5 truncate">
              <Car className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {activeRide.driver?.vehicle.plateNumber || 'DK-7482-BC'} ({activeRide.driver?.vehicle.brand})
              </span>
            </div>

            <div className="flex items-center space-x-1.5 truncate">
              <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">
                {userRole === 'passenger' ? activeRide.driver?.fullName : activeRide.passenger.fullName}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">
              {activeRide.pickup.quarter} ➔ {activeRide.destination.quarter}
            </span>
          </div>
        </div>

        {/* Action 1 : Alerte Rapide Centre de Dispatch Yoon VTC */}
        <div className="space-y-2">
          {!sosSent ? (
            <button
              type="button"
              onClick={handleSendPlatformSos}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-rose-900/40 active:scale-98 transition-transform"
            >
              <ShieldAlert className="w-5 h-5" />
              <span>DÉCLENCHER L’ALERTE SOS YOON VTC</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-xl text-center space-y-1">
              <div className="flex items-center justify-center space-x-2 text-rose-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Alerte transmise aux équipes de sécurité !</span>
              </div>
              <p className="text-[11px] text-rose-200/90">
                Vos coordonnées GPS et les détails du véhicule ont été transmis en priorité haute.
              </p>
            </div>
          )}

          {/* Partager l'alerte via WhatsApp / SMS aux proches */}
          <a
            href={`https://wa.me/?text=${getEmergencyMessage()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Envoyer alerte WhatsApp à mes proches</span>
          </a>
        </div>

        {/* Action 2 : Numéros d'urgence nationaux (Appel Direct) */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Services d'urgence nationaux au Sénégal :
          </p>

          <div className="space-y-1.5">
            {SENEGAL_EMERGENCY_NUMBERS.map((em, idx) => (
              <a
                key={idx}
                href={em.telHref}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between transition-colors group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-100 group-hover:text-rose-400 transition-colors">
                      {em.name}
                    </span>
                    <span className="px-1.5 py-0.2 bg-slate-800 text-amber-400 border border-slate-700 rounded text-[9px] font-bold">
                      {em.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">{em.description}</p>
                </div>

                <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 text-white font-black text-xs rounded-lg group-hover:bg-rose-500 shadow">
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>{em.number}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Bouton Fermer */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            Fermer l’écran d'urgence
          </button>
        </div>
      </div>
    </div>
  );
};
