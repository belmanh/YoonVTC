export type RideStatus = 
  | 'idle' 
  | 'searching_driver' 
  | 'driver_assigned' 
  | 'driver_arrived' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export type VehicleCategory = 'eco' | 'standard' | 'confort' | 'interurbain';

export type PaymentMethod = 'wave' | 'orange_money' | 'cash';

export type DriverStatus = 'online' | 'offline' | 'busy';

export type DocumentStatus = 'pending' | 'approved' | 'rejected';

export interface GeoLocation {
  name: string;
  quarter: string;
  city: string;
  lat: number;
  lng: number;
  popular?: boolean;
}

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  year: number;
  plateNumber: string; // Ex: DK-8492-BC
  color: string;
  category: VehicleCategory;
  seats: number;
}

export interface DriverKyc {
  cniNumber: string;
  cniFrontUrl: string;
  cniBackUrl: string;
  licenseNumber: string;
  licenseUrl: string;
  carteGriseUrl: string;
  assuranceUrl: string;
  assuranceExpiry: string;
  controleTechniqueUrl: string;
  status: DocumentStatus;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  phone: string; // Ex: +221 77 654 32 10
  avatar: string;
  rating: number;
  totalRides: number;
  status: DriverStatus;
  currentLocation: {
    lat: number;
    lng: number;
    heading: number;
  };
  vehicle: Vehicle;
  kyc: DriverKyc;
  walletBalance: number; // In FCFA
  dailyEarnings: number; // In FCFA
  weeklyEarnings: number; // In FCFA
}

export interface Passenger {
  id: string;
  fullName: string;
  phone: string; // Ex: +221 78 123 45 67
  avatar: string;
  rating: number;
  savedPlaces: {
    home?: GeoLocation;
    work?: GeoLocation;
  };
}

export interface PriceBreakdown {
  baseFare: number;
  distanceCost: number;
  durationCost: number;
  tollFee: number; // Péage autoroute si AIBD / Rufisque
  zoneMultiplier: number;
  surgeMultiplier: number;
  totalFare: number; // Final in FCFA
  platformCommission: number; // 15% in FCFA
  driverNetEarnings: number; // 85% in FCFA
}

export interface Ride {
  id: string;
  passenger: Passenger;
  driver?: Driver;
  pickup: GeoLocation;
  destination: GeoLocation;
  category: VehicleCategory;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';
  transactionRef?: string;
  status: RideStatus;
  pricing: PriceBreakdown;
  distanceKm: number;
  durationMinutes: number;
  createdAt: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  driverRating?: number;
  passengerFeedback?: string;
  routeCoordinates: [number, number][];
  currentRouteIndex: number;
  sosAlertTriggered?: boolean;
}

export interface PricingRule {
  category: VehicleCategory;
  name: string;
  description: string;
  baseFare: number; // FCFA
  pricePerKm: number; // FCFA
  pricePerMinute: number; // FCFA
  minFare: number; // FCFA
  commissionRate: number; // e.g. 0.15 (15%)
  icon: string;
  capacity: string;
}

export interface ZoneConfig {
  id: string;
  name: string;
  surgeFactor: number;
  tollRequired: boolean;
  tollAmount: number;
  activePromos?: string;
}

export interface PayoutTransaction {
  id: string;
  driverId: string;
  driverName: string;
  amount: number; // FCFA
  method: 'wave' | 'orange_money';
  recipientPhone: string;
  fee: number;
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  reference: string;
}

export const MIN_DRIVER_WALLET_THRESHOLD = 1000; // 1 000 FCFA solde minimum pour passer en ligne (Modèle Yango)

export interface DriverWalletTransaction {
  id: string;
  driverId: string;
  amount: number; // FCFA (négatif pour commission, positif pour recharge/dépôt)
  type: 'commission' | 'deposit' | 'withdrawal' | 'bonus' | 'adjustment';
  provider: 'wave' | 'orange_money' | 'cash' | 'system';
  description: string;
  reference?: string;
  rideId?: string;
  createdAt: string;
  status: 'success' | 'pending' | 'failed';
  balanceAfter: number; // Solde résultant en FCFA
}
