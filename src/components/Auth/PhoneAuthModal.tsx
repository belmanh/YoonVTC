import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  X,
  User,
  Car,
  Phone,
  KeyRound,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isValidSenegalPhoneNumber, formatSenegalPhoneNumber } from '../../services/authService';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: 'passenger' | 'driver';
  onAuthSuccess?: () => void;
}

export const PhoneAuthModal: React.FC<PhoneAuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'passenger',
  onAuthSuccess,
}) => {
  const { sendOTPCode, verifyOTPCode, isConfigured } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [role, setRole] = useState<'passenger' | 'driver'>(defaultRole);
  const [fullName, setFullName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [vehicleBrand, setVehicleBrand] = useState<string>('Peugeot');
  const [vehicleModel, setVehicleModel] = useState<string>('301');
  const [plateNumber, setPlateNumber] = useState<string>('DK-8942-BC');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // Synchronisation du rôle par défaut
  useEffect(() => {
    setRole(defaultRole);
  }, [defaultRole]);

  // Décompte pour renvoi OTP
  useEffect(() => {
    let timer: any = null;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  // 1. Soumission du numéro de téléphone
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formatted = formatSenegalPhoneNumber(phoneNumber);
    if (!isValidSenegalPhoneNumber(formatted)) {
      setErrorMessage(
        'Veuillez saisir un numéro sénégalais valide à 9 chiffres (ex: 77 123 45 67 ou 78 456 78 90).'
      );
      return;
    }

    setIsLoading(true);
    try {
      await sendOTPCode(formatted, 'recaptcha-container');
      setStep('otp');
      setCountdown(60);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors de l\'envoi du SMS OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Soumission du code de confirmation SMS
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Le code SMS doit comporter 6 chiffres.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTPCode(otpCode, {
        fullName: fullName.trim() || (role === 'driver' ? 'Chauffeur Yoon' : 'Passager Yoon'),
        role,
        ...(role === 'driver' && {
          vehicleDetails: {
            brand: vehicleBrand,
            model: vehicleModel,
            plateNumber,
            category: 'standard',
            color: 'Blanc',
            year: 2023,
          },
        }),
      });

      setStep('success');
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Code de vérification invalide.');
    } finally {
      setIsLoading(false);
    }
  };

  // Raccourci de test démo
  const handleFillDemo = (demoPhone: string, demoRole: 'passenger' | 'driver') => {
    setPhoneNumber(demoPhone);
    setRole(demoRole);
    setFullName(demoRole === 'driver' ? 'Babacar Fall' : 'Aminata Ndiaye');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Conteneur reCAPTCHA invisible requis par Firebase */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Bouton Fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-white flex items-center justify-center gap-1.5">
            Authentification SMS Sénégal 🇸🇳
          </h3>
          <p className="text-xs text-slate-400">
            Connexion sécurisée par OTP pour Passagers & Chauffeurs
          </p>

          {!isConfigured && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold mt-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Mode Simulation Démo actif (Code : 123456)</span>
            </div>
          )}
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ÉTAPE 1 : CHOIX DU RÔLE ET NUMÉRO DE TÉLÉPHONE */}
        {step === 'phone' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            {/* Sélecteur de rôle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRole('passenger')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  role === 'passenger'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Passager</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('driver')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  role === 'driver'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Chauffeur VTC</span>
              </button>
            </div>

            {/* Nom complet */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Nom & Prénom</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'driver' ? 'Ex: Babacar Fall' : 'Ex: Aminata Ndiaye'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex justify-between">
                <span>Numéro de téléphone (+221)</span>
                <span className="text-slate-500 text-[10px]">Orange, Free, Expresso</span>
              </label>
              <div className="flex gap-2">
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 flex items-center gap-1 shrink-0">
                  <span>🇸🇳</span>
                  <span>+221</span>
                </div>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="77 123 45 67"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Détails véhicule si chauffeur */}
            {role === 'driver' && (
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" />
                  <span>Véhicule Chauffeur</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={vehicleBrand}
                    onChange={(e) => setVehicleBrand(e.target.value)}
                    placeholder="Marque (Peugeot)"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Immat. (DK-1234-AA)"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Raccourcis de test */}
            <div className="pt-1">
              <p className="text-[11px] text-slate-400 font-semibold mb-1.5">Numéros de test rapides :</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('+221775213489', 'driver')}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-300 font-mono border border-slate-700"
                >
                  🚗 Chauffeur 775213489
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('+221783456712', 'passenger')}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] text-slate-300 font-mono border border-slate-700"
                >
                  👤 Passager 783456712
                </button>
              </div>
            </div>

            {/* Bouton d'envoi SMS */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Envoi du SMS en cours...</span>
              ) : (
                <>
                  <span>Recevoir le code de vérification SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ÉTAPE 2 : SAISIE DU CODE OTP */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center space-y-1 bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-300">
                Code SMS envoyé au{' '}
                <span className="font-mono font-bold text-blue-400">
                  {formatSenegalPhoneNumber(phoneNumber)}
                </span>
              </p>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline"
              >
                Modifier le numéro
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Code à 6 chiffres</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ex: 123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-blue-400 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Renvoi de code & timer */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              {countdown > 0 ? (
                <span>Renvoyer dans {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isLoading}
                  className="text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Renvoyer un nouveau code</span>
                </button>
              )}
              <span className="text-[11px] text-slate-500">Validation instantanée</span>
            </div>

            {/* Bouton de confirmation */}
            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Vérification du code...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmer & Accéder à Yoon VTC</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ÉTAPE 3 : SUCCÈS */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 border border-blue-400 mx-auto flex items-center justify-center text-blue-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white">Connexion Réussie !</h4>
            <p className="text-xs text-slate-400">
              Profil synchronisé avec Firebase Firestore. Redirection en cours...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneAuthModal;
