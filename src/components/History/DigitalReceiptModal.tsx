import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  CheckCircle2,
  MapPin,
  Car,
  User,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  X,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { Ride, PastRideRecord } from '../../types/vtc';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';

interface DigitalReceiptModalProps {
  ride: Ride | PastRideRecord;
  userRole: 'passenger' | 'driver' | 'admin';
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  ride,
  userRole,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  const receiptId = (ride as PastRideRecord).receiptNumber || `REC-${ride.id.replace('SN-', '')}-${Date.now().toString().slice(-4)}`;
  const dateFormatted = new Date(ride.completedAt || ride.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = new Date(ride.completedAt || ride.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownload = () => {
    setDownloadSuccess(true);
    // Simuler le téléchargement du reçu PDF
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Reçu Yoon VTC #${receiptId}`,
        text: `Reçu de course Yoon VTC de ${ride.pickup.quarter} à ${ride.destination.quarter} - Montant : ${SenegalPaymentService.formatFCFA(ride.pricing.totalFare)}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      setSharedSuccess(true);
      setTimeout(() => setSharedSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-4 flex items-center justify-center animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        
        {/* En-tête du reçu */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-900/40">
              Y
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5">
                Reçu Numérique de Course
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">N° {receiptId} • Yoon VTC Sénégal</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps du reçu officiel (Format carte de paiement) */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
          
          {/* Montant Total Payé */}
          <div className="text-center py-2 border-b border-slate-900 space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Montant Total Payé</p>
            <h2 className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {SenegalPaymentService.formatFCFA(ride.pricing.totalFare)}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-300">
              {ride.paymentMethod === 'wave' && (
                <span className="px-2 py-0.5 bg-sky-950 text-sky-400 border border-sky-500/40 rounded-full font-bold flex items-center gap-1 text-[10px]">
                  <Smartphone className="w-3 h-3" /> Wave Sénégal (0% frais)
                </span>
              )}
              {ride.paymentMethod === 'orange_money' && (
                <span className="px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-500/40 rounded-full font-bold flex items-center gap-1 text-[10px]">
                  <CreditCard className="w-3 h-3" /> Orange Money
                </span>
              )}
              {ride.paymentMethod === 'cash' && (
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-500/40 rounded-full font-bold flex items-center gap-1 text-[10px]">
                  <Banknote className="w-3 h-3" /> Espèces (Règlement direct)
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono">
                {ride.paymentStatus === 'paid' ? '• Validé' : '• Encaissé'}
              </span>
            </div>
          </div>

          {/* Date & Détails de la course */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-900 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Date & Heure</span>
              <p className="text-slate-200 font-semibold">{dateFormatted}</p>
              <p className="text-slate-400 text-[10px] font-mono">{timeFormatted}</p>
            </div>

            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Catégorie Véhicule</span>
              <p className="text-slate-200 font-semibold capitalize">
                {ride.isFixedPricePackage ? (
                  <span className="text-amber-400 font-bold">Forfait Interurbain</span>
                ) : (
                  `Yoon ${ride.category}`
                )}
              </p>
              <p className="text-slate-400 text-[10px] font-mono">{ride.distanceKm} km • {ride.durationMinutes} min</p>
            </div>
          </div>

          {/* Itinéraire du trajet */}
          <div className="space-y-2 border-b border-slate-900 pb-3 text-xs">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Itinéraire Parcouru</span>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0"></div>
                <div>
                  <p className="font-bold text-slate-200">{ride.pickup.name}</p>
                  <p className="text-[10px] text-slate-400">{ride.pickup.quarter}, {ride.pickup.city}</p>
                  {ride.landmarkHint && (
                    <p className="text-[10px] text-emerald-400/90 italic mt-0.5">📍 Repère : {ride.landmarkHint}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0"></div>
                <div>
                  <p className="font-bold text-slate-200">{ride.destination.name}</p>
                  <p className="text-[10px] text-slate-400">{ride.destination.quarter}, {ride.destination.city}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informations Chauffeur et Passager */}
          <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-900 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Chauffeur VTC</span>
              <p className="font-bold text-slate-200">{ride.driver?.fullName || 'Babacar Fall'}</p>
              <p className="text-[10px] text-slate-400">
                {ride.driver?.vehicle.brand} {ride.driver?.vehicle.model}
              </p>
              <p className="text-[10px] font-mono text-emerald-400 font-bold">
                {ride.driver?.vehicle.plateNumber || 'DK-7482-BC'}
              </p>
            </div>

            <div className="space-y-1 text-right">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">Passager</span>
              <p className="font-bold text-slate-200">{ride.passenger.fullName}</p>
              <p className="text-[10px] text-slate-400">{ride.passenger.phone}</p>
            </div>
          </div>

          {/* Décomposition Tarifaire Détaillée */}
          <div className="space-y-1.5 text-xs">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">Décomposition Tarifaire</span>
            
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Prise en charge de base :</span>
                <span className="font-mono">{SenegalPaymentService.formatFCFA(ride.pricing.baseFare)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Distance parcourue ({ride.distanceKm} km) :</span>
                <span className="font-mono">{SenegalPaymentService.formatFCFA(ride.pricing.distanceCost)}</span>
              </div>

              {ride.pricing.tollFee > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Péage Autoroute de l'Avenir :</span>
                  <span className="font-mono">{SenegalPaymentService.formatFCFA(ride.pricing.tollFee)}</span>
                </div>
              )}

              {/* Si vue chauffeur : détails commission et net */}
              {userRole === 'driver' && (
                <div className="pt-1 mt-1 border-t border-slate-900 space-y-1 text-slate-400 text-[10px]">
                  <div className="flex justify-between text-rose-400">
                    <span>Commission plateforme Yoon VTC (15%) :</span>
                    <span className="font-mono font-bold">-{SenegalPaymentService.formatFCFA(ride.pricing.platformCommission)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold text-xs">
                    <span>Gain net chauffeur :</span>
                    <span className="font-mono">{SenegalPaymentService.formatFCFA(ride.pricing.driverNetEarnings)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions : Télécharger PDF & Partager */}
        <div className="flex space-x-2 pt-1">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Reçu Téléchargé !</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Télécharger le Reçu PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border border-slate-700"
            title="Partager le reçu"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{sharedSuccess ? 'Lien copié' : 'Partager'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
