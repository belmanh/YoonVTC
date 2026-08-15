import React, { useState } from 'react';
import {
  FileText,
  MapPin,
  Calendar,
  Clock,
  Car,
  CheckCircle2,
  X,
  ChevronRight,
  Sparkles,
  Smartphone,
  CreditCard,
  Banknote,
  Receipt,
  Search,
} from 'lucide-react';
import { Ride, PastRideRecord } from '../../types/vtc';
import { SenegalPaymentService } from '../../services/waveOrangeMoneyService';
import { DigitalReceiptModal } from './DigitalReceiptModal';

interface RideHistoryModalProps {
  pastRides: PastRideRecord[];
  userRole: 'passenger' | 'driver';
  onClose: () => void;
}

export const RideHistoryModal: React.FC<RideHistoryModalProps> = ({
  pastRides,
  userRole,
  onClose,
}) => {
  const [selectedRideForReceipt, setSelectedRideForReceipt] = useState<PastRideRecord | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'interurbain' | 'dakar'>('all');

  const MAX_RETENTION_DAYS = 90;
  const now = Date.now();
  const validPastRides = pastRides.filter((r) => {
    const rideTime = new Date(r.createdAt).getTime();
    const diffDays = (now - rideTime) / (1000 * 60 * 60 * 24);
    return diffDays <= MAX_RETENTION_DAYS;
  });

  const filteredRides = validPastRides.filter((r) => {
    if (filterType === 'interurbain') return r.isFixedPricePackage || r.distanceKm > 25;
    if (filterType === 'dakar') return !r.isFixedPricePackage && r.distanceKm <= 25;
    return true;
  });

  const totalSpentOrEarned = validPastRides.reduce((sum, r) => sum + r.pricing.totalFare, 0);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 p-4 flex items-center justify-center animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-950 border border-blue-500/40 rounded-xl text-blue-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Historique des Courses & Reçus
              </h3>
              <p className="text-[10px] text-slate-400">
                {userRole === 'passenger' ? 'Vos trajets effectués à Dakar & Régions' : 'Vos courses réalisées et commissions'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sommaire Total */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              {userRole === 'passenger' ? 'Total Dépenses Courses' : 'Total Chiffre d’Affaires Courses'}
            </span>
            <p className="text-lg font-black text-blue-400 font-mono">
              {SenegalPaymentService.formatFCFA(totalSpentOrEarned)}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-300 font-mono">
            {validPastRides.length} course{validPastRides.length > 1 ? 's' : ''} (90j max)
          </span>
        </div>

        {/* Filtres rapides */}
        <div className="flex space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Toutes ({validPastRides.length})
          </button>
          <button
            onClick={() => setFilterType('interurbain')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'interurbain' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forfaits AIBD / Saly
          </button>
          <button
            onClick={() => setFilterType('dakar')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-colors ${
              filterType === 'dakar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dakar Urbain
          </button>
        </div>

        {/* Liste des courses passées */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {filteredRides.length > 0 ? (
            filteredRides.map((ride) => (
              <div
                key={ride.id}
                onClick={() => setSelectedRideForReceipt(ride)}
                className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all space-y-2 group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                      #{ride.id}
                    </span>
                    {ride.isFixedPricePackage && (
                      <span className="px-1.5 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/40 rounded text-[9px] font-bold">
                        Forfait Fixe
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-blue-400 text-sm">
                    {SenegalPaymentService.formatFCFA(ride.pricing.totalFare)}
                  </span>
                </div>

                {/* Trajet */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></div>
                    <span className="truncate">{ride.pickup.quarter} ({ride.pickup.name})</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></div>
                    <span className="truncate">{ride.destination.quarter}</span>
                  </div>
                </div>

                {/* Footer Course : Date, Véhicule & Bouton Reçu */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                  <div className="flex items-center space-x-2">
                    <span>{new Date(ride.createdAt).toLocaleDateString('fr-FR')}</span>
                    {userRole === 'driver' && (
                      <>
                        <span>•</span>
                        <span className="capitalize">{ride.paymentMethod}</span>
                      </>
                    )}
                    {ride.ratingGiven && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                          ★ {ride.ratingGiven}/5
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-blue-400 font-bold group-hover:underline flex items-center gap-0.5">
                    <span>Voir reçu</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-500 text-xs space-y-1">
              <FileText className="w-8 h-8 mx-auto text-slate-700" />
              <p>Aucune course dans cette catégorie.</p>
            </div>
          )}
        </div>

        {/* Modal de reçu spécifique si sélectionné */}
        {selectedRideForReceipt && (
          <DigitalReceiptModal
            ride={selectedRideForReceipt}
            userRole={userRole}
            onClose={() => setSelectedRideForReceipt(null)}
          />
        )}
      </div>
    </div>
  );
};
