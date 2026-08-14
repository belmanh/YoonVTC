import React from 'react';
import {
  Play,
  FastForward,
  RotateCcw,
  Zap,
  ShieldAlert,
  MapPin,
  TrendingUp,
  Radio,
} from 'lucide-react';
import { GeoLocation, Ride, VehicleCategory, PaymentMethod } from '../../types/vtc';
import { SENEGAL_LOCATIONS } from '../../data/senegalData';

interface DispatchSimulatorControlsProps {
  activeRide: Ride | null;
  isSimulatingMovement: boolean;
  isRushHour: boolean;
  onToggleRushHour: () => void;
  onLaunchPresetRide: (from: GeoLocation, to: GeoLocation, cat: VehicleCategory, pay: PaymentMethod) => void;
  onTogglePlaySimulation: () => void;
  onStepForward: () => void;
  onResetRide: () => void;
  onTriggerSos: () => void;
}

export const DispatchSimulatorControls: React.FC<DispatchSimulatorControlsProps> = ({
  activeRide,
  isSimulatingMovement,
  isRushHour,
  onToggleRushHour,
  onLaunchPresetRide,
  onTogglePlaySimulation,
  onStepForward,
  onResetRide,
  onTriggerSos,
}) => {
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-20 text-xs shadow-md">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 font-bold text-slate-200">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400">Scénarios Rapides Dakar :</span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => onLaunchPresetRide(SENEGAL_LOCATIONS[1], SENEGAL_LOCATIONS[0], 'standard', 'wave')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold whitespace-nowrap border border-slate-700 flex items-center gap-1"
          >
            <MapPin className="w-3 h-3 text-emerald-400" />
            Almadies ➔ Plateau (Standard)
          </button>

          <button
            onClick={() => onLaunchPresetRide(SENEGAL_LOCATIONS[0], SENEGAL_LOCATIONS[3], 'confort', 'orange_money')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold whitespace-nowrap border border-slate-700 flex items-center gap-1"
          >
            <MapPin className="w-3 h-3 text-amber-400" />
            Dakar ➔ AIBD (Forfait VIP)
          </button>

          <button
            onClick={() => onLaunchPresetRide(SENEGAL_LOCATIONS[2], SENEGAL_LOCATIONS[12], 'interurbain', 'cash')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold whitespace-nowrap border border-slate-700 flex items-center gap-1"
          >
            <MapPin className="w-3 h-3 text-indigo-400" />
            Mermoz ➔ Saly Mbour (Interurbain)
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Toggle Heure de Pointe */}
        <button
          onClick={onToggleRushHour}
          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
            isRushHour
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 ring-1 ring-amber-500'
              : 'bg-slate-800 text-slate-400 border border-slate-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isRushHour ? 'Heure de Pointe (1.25x)' : 'Trafic Fluide (1.0x)'}</span>
        </button>

        {/* Contrôles de simulation de trajet */}
        {activeRide && (
          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={onTogglePlaySimulation}
              className={`p-1.5 rounded-md font-bold text-xs flex items-center gap-1 ${
                isSimulatingMovement
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
              }`}
              title={isSimulatingMovement ? 'Pause simulation GPS' : 'Lancer simulation GPS'}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulatingMovement ? 'Pause' : 'GPS Auto'}</span>
            </button>

            <button
              onClick={onStepForward}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md"
              title="Avancer étape suivante"
            >
              <FastForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetRide}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-md"
              title="Réinitialiser la course"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
