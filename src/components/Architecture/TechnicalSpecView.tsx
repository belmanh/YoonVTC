import React, { useState } from 'react';
import {
  Layers,
  Database,
  Smartphone,
  Calculator,
  CreditCard,
  Code2,
  Copy,
  Check,
  Server,
  Network,
  Cpu,
  Shield,
  Zap,
} from 'lucide-react';

export const TechnicalSpecView: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'architecture' | 'database' | 'mobile_structure' | 'pricing_code' | 'payment_api'>('architecture');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" />
            Architecture Technique & Spécifications (Sénégal VTC)
          </h2>
          <p className="text-xs text-slate-400">
            Livrables complets : Stack système, schémas Firestore/PostgreSQL, structure Flutter/RN, algorithme de prix et webhooks Wave/Orange Money
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection('architecture')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'architecture' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Architecture Globale
          </button>
          <button
            onClick={() => setActiveSection('database')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'database' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Base de Données (PostGIS/Firestore)
          </button>
          <button
            onClick={() => setActiveSection('mobile_structure')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'mobile_structure' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Structure Flutter / React Native
          </button>
          <button
            onClick={() => setActiveSection('pricing_code')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'pricing_code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            4. Algorithme Prix Sénégal
          </button>
          <button
            onClick={() => setActiveSection('payment_api')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeSection === 'payment_api' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5. Intégration Wave & Orange Money
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        
        {/* SECTION 1: ARCHITECTURE GLOBALE */}
        {activeSection === 'architecture' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Architecture Overview Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-100">Frontend Mobile (Client & Chauffeur)</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong>Flutter (Dart)</strong> pour un codebase unique Android & iOS haute performance (60 FPS), rendu cartographique OpenStreetMap / Google Maps SDK fluide et gestion d'état réactive (BLoC ou Riverpod).
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-blue-400">
                  <Server className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-100">Backend & Dispatch Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong>Node.js (NestJS / TypeScript)</strong> ou <strong>Go (Golang)</strong> couplé à <strong>Redis Geospatial (GEOADD / GEORADIUS)</strong> et WebSockets (Socket.io / gRPC) pour un tracking de localisation à haute fréquence (3s).
                </p>
              </div>

              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-100">Persistance & Données Spatiales</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong>PostgreSQL + PostGIS</strong> pour les calculs d'itinéraires et index spatiaux géométriques <code>GIST</code>, combiné à <strong>Firebase Firestore / Supabase</strong> pour la synchronisation d'état en direct.
                </p>
              </div>
            </div>

            {/* Diagramme de flux textuel structuré */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                Flux de Dispatch & Cycle de Vie d'une Course (Sénégal)
              </h3>
              
              <div className="space-y-3 text-xs text-slate-300 font-mono bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-loose">
                <p className="text-sky-400 font-bold">1. PASSAGER COMMANDE UNE COURSE</p>
                <p>   Passager App ──(POST /api/v1/rides/quote)──► Backend Pricing Engine</p>
                <p>   Backend calcule: Base Fare + (Km * 250 F) + (Min * 40 F) + Péage AIBD + Surge VDN</p>
                <p>   Passager choisit: Wave Sénégal / Orange Money / Cash</p>
                <br />
                <p className="text-amber-400 font-bold">2. DISPATCH GÉOSPATIAL EN TEMPS RÉEL</p>
                <p>   Backend interroge Redis: <span className="text-blue-400">GEORADIUS drivers:locations {`{lat}`} {`{lng}`} 3 km WITHCOORD</span></p>
                <p>   Tri par proximité + note chauffeur + catégorie (Éco, Standard, Confort)</p>
                <p>   Push WebSocket vers Chauffeur le plus proche (Timer 15s dégressif)</p>
                <br />
                <p className="text-blue-400 font-bold">3. ACCEPTATION & TRACKING GPS EN DIRECT</p>
                <p>   Chauffeur ACCEPTE ──► Socket Room `ride_{'{id}'}` créée</p>
                <p>   Chauffeur GPS émet toutes les 3s ──► Passager reçoit coordonnées + Polyline animée</p>
                <br />
                <p className="text-purple-400 font-bold">4. TERMINAISON & RÈGLEMENT AUTOMATISÉ</p>
                <p>   Chauffeur clique "Terminer la Course" ──► Clôture du trajet</p>
                <p>   Si Wave/OM : Débit automatique passager ➔ Crédit Wallet Chauffeur (85%) + Commission Yoon (15%)</p>
                <p>   Si Cash : Passager règle le chauffeur en liquide ➔ Débit de la commission 15% sur le Wallet Chauffeur</p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: BASE DE DONNÉES (POSTGRESQL & FIRESTORE) */}
        {activeSection === 'database' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Schéma Relationnel PostgreSQL / PostGIS DDL</h3>
                <p className="text-xs text-slate-400">Modélisation complète avec types spatiaux GEOGRAPHY, clés étrangères et index de performance</p>
              </div>
              <button
                onClick={() => handleCopy(POSTGRES_SCHEMA, 'pg_schema')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                {copiedKey === 'pg_schema' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier DDL SQL</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto bg-slate-950 leading-relaxed">
                <code>{POSTGRES_SCHEMA}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-sm text-slate-100">Structure Collections Firestore (NoSQL Temps Réel)</h3>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto bg-slate-950 p-3 rounded-xl leading-relaxed">
                  <code>{FIRESTORE_SCHEMA}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: STRUCTURE FLUTTER / REACT NATIVE */}
        {activeSection === 'mobile_structure' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Arborescence du Projet Flutter (Clean Architecture)</h3>
                <p className="text-xs text-slate-400">Pattern modulaire recommandé (BLoC / Riverpod, Data / Domain / Presentation)</p>
              </div>
              <button
                onClick={() => handleCopy(FLUTTER_STRUCTURE, 'flutter_tree')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                {copiedKey === 'flutter_tree' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier Arborescence</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <pre className="text-xs font-mono text-blue-300 overflow-x-auto bg-slate-950 p-4 rounded-xl leading-relaxed">
                <code>{FLUTTER_STRUCTURE}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SECTION 4: ALGORITHME DE CALCUL DE PRIX SÉNÉGAL */}
        {activeSection === 'pricing_code' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Script de Calcul Dynamique de Tarif (FCFA / Sénégal)</h3>
                <p className="text-xs text-slate-400">Prise en compte de la distance, durée, péages autoroute, forfaits AIBD et surge de trafic</p>
              </div>
              <button
                onClick={() => handleCopy(PRICING_ENGINE_CODE, 'pricing_engine')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                {copiedKey === 'pricing_engine' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier Code TS</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <pre className="text-xs font-mono text-sky-200 overflow-x-auto bg-slate-950 p-4 rounded-xl leading-relaxed">
                <code>{PRICING_ENGINE_CODE}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SECTION 5: INTÉGRATION WAVE & ORANGE MONEY API */}
        {activeSection === 'payment_api' && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-100">Webhooks & Endpoints Backend (Wave & Orange Money)</h3>
                <p className="text-xs text-slate-400">Code Node.js / Express avec vérification de signature cryptographique HMAC SHA256</p>
              </div>
              <button
                onClick={() => handleCopy(PAYMENT_API_CODE, 'payment_code')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5"
              >
                {copiedKey === 'payment_code' ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copier Implémentation API</span>
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <pre className="text-xs font-mono text-amber-200 overflow-x-auto bg-slate-950 p-4 rounded-xl leading-relaxed">
                <code>{PAYMENT_API_CODE}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// DONNÉES DES CODES ET SCHÉMAS
const POSTGRES_SCHEMA = `-- ============================================================
-- YOON VTC SÉNÉGAL - SCHÉMA DE BASE DE DONNÉES POSTGRESQL + POSTGIS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Table des Utilisateurs (Passagers & Chauffeurs)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL, -- Ex: '+221771234567'
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    role VARCHAR(20) NOT NULL CHECK (role IN ('passenger', 'driver', 'admin')),
    rating_avg NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Véhicules Chauffeurs
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand VARCHAR(50) NOT NULL, -- Ex: 'Toyota', 'Peugeot'
    model VARCHAR(50) NOT NULL, -- Ex: 'Corolla', '301'
    year INT NOT NULL,
    plate_number VARCHAR(20) UNIQUE NOT NULL, -- Ex: 'DK-7482-BC'
    color VARCHAR(30) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('eco', 'standard', 'confort', 'interurbain')),
    is_active BOOLEAN DEFAULT TRUE
);

-- 3. Table des Documents & Validation KYC Chauffeur
CREATE TABLE driver_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cni_number VARCHAR(30) NOT NULL,
    cni_front_url TEXT NOT NULL,
    cni_back_url TEXT NOT NULL,
    license_number VARCHAR(30) NOT NULL,
    license_url TEXT NOT NULL,
    carte_grise_url TEXT NOT NULL,
    assurance_url TEXT NOT NULL,
    assurance_expiry DATE NOT NULL,
    controle_technique_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Table des Positions Géographiques en Direct (PostGIS GIST Index)
CREATE TABLE driver_telemetry (
    driver_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_location GEOGRAPHY(POINT, 4326) NOT NULL,
    heading NUMERIC(5, 2) DEFAULT 0,
    is_online BOOLEAN DEFAULT FALSE,
    is_busy BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX idx_driver_geo_gist ON driver_telemetry USING GIST (current_location);

-- 5. Table des Courses (Rides)
CREATE TABLE rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passenger_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES users(id),
    pickup_location GEOGRAPHY(POINT, 4326) NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_location GEOGRAPHY(POINT, 4326) NOT NULL,
    destination_address TEXT NOT NULL,
    category VARCHAR(20) NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    base_fare INT NOT NULL, -- Montants en FCFA (XOF)
    distance_cost INT NOT NULL,
    duration_cost INT NOT NULL,
    toll_fee INT DEFAULT 0, -- Péage autoroute
    surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
    total_fare INT NOT NULL, -- Total en FCFA
    platform_commission INT NOT NULL, -- 15% en FCFA
    driver_net_earnings INT NOT NULL, -- 85% en FCFA
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('wave', 'orange_money', 'cash')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    status VARCHAR(30) DEFAULT 'searching_driver' CHECK (
        status IN ('searching_driver', 'driver_assigned', 'driver_arrived', 'in_progress', 'completed', 'cancelled')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 6. Portefeuilles Chauffeurs (Wallets)
CREATE TABLE driver_wallets (
    driver_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance_fcfa INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`;

const FIRESTORE_SCHEMA = `// Collections NoSQL Firestore pour la réactivité temps réel
{
  "rides": {
    "ride_id_abc123": {
      "passengerId": "usr_pass_001",
      "driverId": "usr_drv_102",
      "status": "in_progress", // 'searching' | 'assigned' | 'arrived' | 'in_progress' | 'completed'
      "pickup": {
        "name": "Almadies",
        "geopoint": [14.7454, -17.5186]
      },
      "destination": {
        "name": "Plateau Place de l'Indépendance",
        "geopoint": [14.6698, -17.4332]
      },
      "pricing": {
        "totalFare": 4500, // FCFA
        "commission": 675,  // 15%
        "driverNet": 3825,  // 85%
        "currency": "XOF"
      },
      "driverLiveLocation": {
        "lat": 14.7180,
        "lng": -17.4650,
        "heading": 120,
        "updatedAt": "2026-08-14T11:58:00Z"
      }
    }
  },
  "drivers_live": {
    "usr_drv_102": {
      "isOnline": true,
      "isBusy": true,
      "geo": [14.7180, -17.4650],
      "category": "confort",
      "plateNumber": "DK-3319-BN"
    }
  }
}`;

const FLUTTER_STRUCTURE = `yoon_vtc_mobile/
├── android/
├── ios/
├── lib/
│   ├── core/
│   │   ├── api/
│   │   │   ├── dio_client.dart
│   │   │   └── api_interceptors.dart
│   │   ├── constants/
│   │   │   ├── colors.dart (Emerald #10B981, Deep Slate #020617)
│   │   │   └── senegal_regions.dart (Dakar, Thiès, Mbour, AIBD)
│   │   ├── services/
│   │   │   ├── location_service.dart (Geolocator GPS)
│   │   │   ├── websocket_service.dart (Socket.io dispatch)
│   │   │   └── local_storage.dart
│   │   └── theme/
│   │       └── app_theme.dart
│   │
│   ├── features/
│   │   ├── auth/ (OTP SMS Sénégal +221)
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/screens/phone_auth_screen.dart
│   │   │
│   │   ├── passenger/
│   │   │   ├── domain/entities/ride_estimate.dart
│   │   │   ├── presentation/
│   │   │   │   ├── bloc/passenger_ride_bloc.dart
│   │   │   │   ├── screens/
│   │   │   │   │   ├── home_booking_screen.dart
│   │   │   │   │   ├── live_ride_tracking_screen.dart
│   │   │   │   │   └── ride_receipt_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       ├── vehicle_tier_card.dart
│   │   │   │       ├── wave_om_payment_sheet.dart
│   │   │   │       └── sos_emergency_button.dart
│   │   │
│   │   ├── driver/
│   │   │   ├── presentation/
│   │   │   │   ├── bloc/driver_dispatch_bloc.dart
│   │   │   │   ├── screens/
│   │   │   │   │   ├── driver_radar_screen.dart
│   │   │   │   │   ├── trip_navigation_screen.dart
│   │   │   │   │   ├── driver_wallet_screen.dart
│   │   │   │   │   └── kyc_upload_screen.dart
│   │   │   │   └── widgets/
│   │   │   │       ├── incoming_ride_modal.dart (15s timer)
│   │   │   │       └── payout_modal.dart (Wave / OM)
│   │   │
│   │   └── payments/
│   │       ├── wave_checkout_handler.dart
│   │       └── orange_money_ussd_handler.dart
│   │
│   └── main.dart
└── pubspec.yaml (geolocator, google_maps_flutter, flutter_bloc, web_socket_channel, dio)`;

const PRICING_ENGINE_CODE = `/**
 * Yoon VTC Sénégal - Moteur de Calcul Tarifaire Officiel (FCFA)
 */
export interface PricingConfig {
  baseFare: number;       // Ex: 800 FCFA
  pricePerKm: number;     // Ex: 250 FCFA
  pricePerMinute: number; // Ex: 40 FCFA
  minFare: number;        // Ex: 1500 FCFA
  commissionRate: number; // Ex: 0.15 (15%)
}

export function computeSenegalRidePrice(
  distanceKm: number,
  durationMinutes: number,
  isAIBD: boolean,
  category: 'eco' | 'standard' | 'confort' | 'interurbain',
  surgeFactor: number = 1.0
) {
  // 1. Gestion des forfaits Aéroport AIBD
  if (isAIBD) {
    const aibdFare = category === 'confort' ? 22000 : 15000;
    const tollIncluded = 3000;
    const commission = Math.round(aibdFare * 0.15);
    return {
      totalFare: aibdFare,
      tollFee: tollIncluded,
      platformCommission: commission,
      driverNet: aibdFare - commission,
    };
  }

  // 2. Grilles standard par gamme
  const rates = {
    eco: { base: 500, km: 180, min: 30, minFare: 1000, com: 0.12 },
    standard: { base: 800, km: 250, min: 40, minFare: 1500, com: 0.15 },
    confort: { base: 1500, km: 400, min: 60, minFare: 2500, com: 0.15 },
    interurbain: { base: 3000, km: 220, min: 25, minFare: 12000, com: 0.10 },
  }[category];

  const rawFare = (rates.base + distanceKm * rates.km + durationMinutes * rates.min) * surgeFactor;
  
  // Arrondi commercial sénégalais au multiple de 100 FCFA supérieur
  const totalFare = Math.max(rates.minFare, Math.ceil(rawFare / 100) * 100);
  const platformCommission = Math.round(totalFare * rates.com);
  const driverNet = totalFare - platformCommission;

  return {
    totalFare,
    platformCommission,
    driverNet,
  };
}`;

const PAYMENT_API_CODE = `import express from 'express';
import crypto from 'crypto';
const router = express.Router();

const WAVE_WEBHOOK_SECRET = process.env.WAVE_WEBHOOK_SECRET || 'wave_sec_sn_98412';
const OM_MERCHANT_KEY = process.env.OM_MERCHANT_KEY || 'om_key_sn_12415';

/**
 * 1. Webhook Wave Sénégal (Validation Signature HMAC SHA256)
 */
router.post('/webhooks/wave', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['wave-signature'] as string;
  const rawBody = req.body.toString();

  // Vérification de la signature cryptographique
  const expectedSig = crypto
    .createHmac('sha256', WAVE_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Signature Wave Invalide' });
  }

  const event = JSON.parse(rawBody);

  if (event.type === 'checkout.session.completed') {
    const session = event.data;
    const rideId = session.client_reference;
    const amountXOF = parseInt(session.amount);

    console.log(\`[WAVE SÉNÉGAL] Recharge crédit chauffeur ou paiement direct reçu pour la course \${rideId}: \${amountXOF} FCFA\`);

    // Modèle Yango : Recharge crédit prépayé chauffeur ou déduction automatique
    await processYangoDriverWalletTransaction(rideId, amountXOF, 'wave');
  }

  res.status(200).json({ received: true });
});

/**
 * 2. Webhook / Callback Orange Money WebPay Sénégal
 */
router.post('/webhooks/orange-money', express.json(), async (req, res) => {
  const { status, notif_token, txnid, order_id, amount } = req.body;

  if (status === 'SUCCESS') {
    console.log(\`[ORANGE MONEY] Transaction réussie \${txnid} pour recharge/course \${order_id}\`);
    await processYangoDriverWalletTransaction(order_id, amount, 'orange_money');
    return res.status(200).json({ status: 'ACKNOWLEDGED' });
  }

  res.status(400).json({ error: 'Transaction non aboutie' });
});

/**
 * Traitement Modèle Yango :
 * 1. Recharge crédit chauffeur (Top-Up) via Wave/OM
 * 2. Prélèvement automatique commission 15% à chaque fin de course
 */
async function processYangoDriverWalletTransaction(referenceId: string, amountFcfa: number, method: string) {
  console.log(\`[MODÈLE YANGO] Transaction \${referenceId} traitée (\${amountFcfa} FCFA via \${method})\`);
}

export default router;`;
