import React, { useState } from 'react';
import {
  Share2,
  Copy,
  CheckCircle2,
  MessageCircle,
  Smartphone,
  X,
  MapPin,
  Car,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { Ride } from '../../types/vtc';

interface ShareTripModalProps {
  activeRide: Ride;
  onClose: () => void;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({
  activeRide,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://yoon.sn/track/${activeRide.id}`;
  const driverName = activeRide.driver?.fullName || 'Chauffeur VTC';
  const vehicleInfo = `${activeRide.driver?.vehicle.brand} ${activeRide.driver?.vehicle.model} (${activeRide.driver?.vehicle.plateNumber || 'DK-7482-BC'})`;

  const shareMessage = `🚕 Suis mon trajet en direct sur Yoon VTC :\n` +
    `Départ : ${activeRide.pickup.quarter}\n` +
    `Destination : ${activeRide.destination.quarter}\n` +
    `Véhicule : ${vehicleInfo}\n` +
    `Chauffeur : ${driverName}\n` +
    `Lien de suivi temps réel : ${shareUrl}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mon trajet Yoon VTC en direct',
          text: shareMessage,
          url: shareUrl,
        });
      } catch (e) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-4 flex items-center justify-center animate-fadeIn">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-950 border border-blue-500/40 rounded-xl text-blue-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Partager mon trajet</h3>
              <p className="text-[10px] text-slate-400">Suivi temps réel sécurisé pour vos proches</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aperçu du trajet partagé */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center space-x-2 text-blue-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Lien de sécurité chiffré</span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <p className="flex items-center space-x-1.5 truncate">
              <MapPin className="w-3 h-3 text-blue-400 shrink-0" />
              <span>De <strong>{activeRide.pickup.quarter}</strong> à <strong>{activeRide.destination.quarter}</strong></span>
            </p>
            <p className="flex items-center space-x-1.5 truncate">
              <Car className="w-3 h-3 text-sky-400 shrink-0" />
              <span>{vehicleInfo}</span>
            </p>
          </div>
        </div>

        {/* Lien de partage et bouton Copier */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
            Lien web de suivi en direct
          </label>
          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1.5">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 bg-transparent px-2 text-xs text-blue-300 font-mono outline-none truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shrink-0"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          </div>
        </div>

        {/* Boutons de partage direct (WhatsApp / SMS / Système) */}
        <div className="space-y-2 pt-1">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-900/40"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Partager sur WhatsApp</span>
          </a>

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`sms:?body=${encodeURIComponent(shareMessage)}`}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <Smartphone className="w-3.5 h-3.5 text-sky-400" />
              <span>Envoyer par SMS</span>
            </a>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 border border-slate-700"
            >
              <Share2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Autres options</span>
            </button>
          </div>
        </div>

        {/* Bouton Fermer */}
        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
