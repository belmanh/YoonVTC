import { GeoLocation, Driver, PricingRule, ZoneConfig, Passenger } from '../types/vtc';

// Points d'intérêt et quartiers majeurs du Sénégal (Dakar & Régions)
export const SENEGAL_LOCATIONS: GeoLocation[] = [
  {
    name: 'Plateau - Place de l’Indépendance',
    quarter: 'Dakar Plateau',
    city: 'Dakar',
    lat: 14.6698,
    lng: -17.4332,
    popular: true,
  },
  {
    name: 'Les Almadies - Route des Almadies',
    quarter: 'Almadies',
    city: 'Dakar',
    lat: 14.7454,
    lng: -17.5186,
    popular: true,
  },
  {
    name: 'Mermoz - VDN Carrefour',
    quarter: 'Mermoz - Sacré-Cœur',
    city: 'Dakar',
    lat: 14.7128,
    lng: -17.4721,
    popular: true,
  },
  {
    name: 'Aéroport International Blaise Diagne (AIBD)',
    quarter: 'Diass',
    city: 'Région Thiès',
    lat: 14.6710,
    lng: -17.0732,
    popular: true,
  },
  {
    name: 'Yoff - Plage BCEAO',
    quarter: 'Yoff',
    city: 'Dakar',
    lat: 14.7610,
    lng: -17.4722,
    popular: true,
  },
  {
    name: 'Mamelles - Phare des Mamelles',
    quarter: 'Mamelles / Ouakam',
    city: 'Dakar',
    lat: 14.7238,
    lng: -17.4989,
    popular: true,
  },
  {
    name: 'Fann Résidence - Corniche Ouest',
    quarter: 'Fann Résidence',
    city: 'Dakar',
    lat: 14.6912,
    lng: -17.4705,
    popular: true,
  },
  {
    name: 'Point E - Boulevard de l’Est',
    quarter: 'Point E',
    city: 'Dakar',
    lat: 14.6975,
    lng: -17.4583,
    popular: true,
  },
  {
    name: 'Parcelles Assainies - Unité 15',
    quarter: 'Parcelles Assainies',
    city: 'Dakar',
    lat: 14.7652,
    lng: -17.4385,
    popular: true,
  },
  {
    name: 'Pikine - Rond-Point Icotaf',
    quarter: 'Pikine',
    city: 'Dakar Banlieue',
    lat: 14.7540,
    lng: -17.3980,
    popular: false,
  },
  {
    name: 'Rufisque - Centre Ville',
    quarter: 'Rufisque',
    city: 'Dakar',
    lat: 14.7167,
    lng: -17.2667,
    popular: false,
  },
  {
    name: 'Diamniadio - Centre International CICAD',
    quarter: 'Pôle Urbain Diamniadio',
    city: 'Dakar',
    lat: 14.7292,
    lng: -17.1820,
    popular: true,
  },
  {
    name: 'Saly Portudal - Centre Commercial',
    quarter: 'Saly Station Balnéaire',
    city: 'Mbour',
    lat: 14.4428,
    lng: -17.0264,
    popular: true,
  },
  {
    name: 'Thiès - Place de France',
    quarter: 'Centre',
    city: 'Thiès',
    lat: 14.7910,
    lng: -16.9260,
    popular: true,
  },
  {
    name: 'Saint-Louis - Pont Faidherbe',
    quarter: 'Île de Saint-Louis',
    city: 'Saint-Louis',
    lat: 16.0245,
    lng: -16.4983,
    popular: true,
  },
];

export const INITIAL_PASSENGER: Passenger = {
  id: 'pass_sn_01',
  fullName: 'Fatou Bintou Sall',
  phone: '+221 77 412 88 90',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  rating: 4.95,
  savedPlaces: {
    home: SENEGAL_LOCATIONS[1], // Almadies
    work: SENEGAL_LOCATIONS[0], // Plateau
  }
};

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv_sn_101',
    fullName: 'Babacar Fall',
    phone: '+221 77 521 34 89',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.88,
    totalRides: 1420,
    status: 'online',
    currentLocation: {
      lat: 14.7380,
      lng: -17.5020,
      heading: 45,
    },
    vehicle: {
      id: 'veh_01',
      brand: 'Peugeot',
      model: '301 Allure',
      year: 2022,
      plateNumber: 'DK-7482-BC',
      color: 'Gris Métallisé',
      category: 'standard',
      seats: 4,
    },
    kyc: {
      cniNumber: '1759198500214',
      cniFrontUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      cniBackUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      licenseNumber: 'SN-PERMIS-2018-941',
      licenseUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
      carteGriseUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
      assuranceUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      assuranceExpiry: '2027-02-28',
      controleTechniqueUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      status: 'approved',
      reviewedAt: '2026-01-10',
    },
    walletBalance: 84500, // FCFA
    dailyEarnings: 28500,
    weeklyEarnings: 164000,
  },
  {
    id: 'drv_sn_102',
    fullName: 'Modou Diop',
    phone: '+221 78 345 67 12',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.92,
    totalRides: 890,
    status: 'online',
    currentLocation: {
      lat: 14.7180,
      lng: -17.4650,
      heading: 120,
    },
    vehicle: {
      id: 'veh_02',
      brand: 'Toyota',
      model: 'Corolla Hybrid',
      year: 2023,
      plateNumber: 'DK-3319-BN',
      color: 'Blanc Nacré (Climatisée)',
      category: 'confort',
      seats: 4,
    },
    kyc: {
      cniNumber: '1759199100412',
      cniFrontUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      cniBackUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      licenseNumber: 'SN-PERMIS-2016-102',
      licenseUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
      carteGriseUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
      assuranceUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      assuranceExpiry: '2026-11-30',
      controleTechniqueUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      status: 'approved',
      reviewedAt: '2026-02-01',
    },
    walletBalance: 124000,
    dailyEarnings: 42000,
    weeklyEarnings: 215000,
  },
  {
    id: 'drv_sn_103',
    fullName: 'Ousmane Sow',
    phone: '+221 76 890 12 43',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    rating: 4.75,
    totalRides: 310,
    status: 'online',
    currentLocation: {
      lat: 14.6750,
      lng: -17.4380,
      heading: 270,
    },
    vehicle: {
      id: 'veh_03',
      brand: 'Renault',
      model: 'Kwid / Clio',
      year: 2020,
      plateNumber: 'DK-9041-AZ',
      color: 'Bleu Roi',
      category: 'eco',
      seats: 4,
    },
    kyc: {
      cniNumber: '1759199500987',
      cniFrontUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      cniBackUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      licenseNumber: 'SN-PERMIS-2020-554',
      licenseUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
      carteGriseUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
      assuranceUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      assuranceExpiry: '2026-10-15',
      controleTechniqueUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      status: 'approved',
      reviewedAt: '2026-03-01',
    },
    walletBalance: 46000,
    dailyEarnings: 18000,
    weeklyEarnings: 98000,
  },
  {
    id: 'drv_sn_104',
    fullName: 'Cheikh Tidiane Diagne',
    phone: '+221 70 812 45 67',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    rating: 4.96,
    totalRides: 2150,
    status: 'online',
    currentLocation: {
      lat: 14.7320,
      lng: -17.2100,
      heading: 90,
    },
    vehicle: {
      id: 'veh_04',
      brand: 'Hyundai',
      model: 'Grand Starex VIP / Navette',
      year: 2023,
      plateNumber: 'TH-4188-B',
      color: 'Noir Ébène (Climatisé)',
      category: 'interurbain',
      seats: 7,
    },
    kyc: {
      cniNumber: '1759198300654',
      cniFrontUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      cniBackUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      licenseNumber: 'SN-PERMIS-2015-881',
      licenseUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
      carteGriseUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
      assuranceUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      assuranceExpiry: '2027-05-31',
      controleTechniqueUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      status: 'approved',
      reviewedAt: '2026-01-15',
    },
    walletBalance: 210000,
    dailyEarnings: 75000,
    weeklyEarnings: 380000,
  },
  {
    id: 'drv_sn_105',
    fullName: 'Moustapha Seck',
    phone: '+221 77 901 23 45',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    rating: 0,
    totalRides: 0,
    status: 'offline',
    currentLocation: {
      lat: 14.7620,
      lng: -17.4410,
      heading: 0,
    },
    vehicle: {
      id: 'veh_05',
      brand: 'Kia',
      model: 'Rio Berline',
      year: 2021,
      plateNumber: 'DK-6091-BD',
      color: 'Gris Argent',
      category: 'standard',
      seats: 4,
    },
    kyc: {
      cniNumber: '1759199600123',
      cniFrontUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      cniBackUrl: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?w=300',
      licenseNumber: 'SN-PERMIS-2022-311',
      licenseUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300',
      carteGriseUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300',
      assuranceUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      assuranceExpiry: '2026-12-31',
      controleTechniqueUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=300',
      status: 'pending', // En attente de validation admin
    },
    walletBalance: 0,
    dailyEarnings: 0,
    weeklyEarnings: 0,
  }
];

export const PRICING_RULES: Record<string, PricingRule> = {
  eco: {
    category: 'eco',
    name: 'Yoon Éco (Citadine)',
    description: 'Le tarif le plus accessible pour vos trajets quotidiens à Dakar.',
    baseFare: 500, // 500 FCFA prise en charge
    pricePerKm: 180, // 180 FCFA / km
    pricePerMinute: 30, // 30 FCFA / min
    minFare: 1000, // Course min 1 000 FCFA
    commissionRate: 0.12, // 12% commission
    icon: 'Car',
    capacity: '4 places',
  },
  standard: {
    category: 'standard',
    name: 'Yoon Standard (Berline)',
    description: 'Berlines confortables et climatisées (Peugeot 301, Toyota Corolla).',
    baseFare: 800, // 800 FCFA
    pricePerKm: 250, // 250 FCFA / km
    pricePerMinute: 40, // 40 FCFA / min
    minFare: 1500, // 1 500 FCFA
    commissionRate: 0.15, // 15% commission
    icon: 'CarFront',
    capacity: '4 places',
  },
  confort: {
    category: 'confort',
    name: 'Yoon Confort & VIP',
    description: 'Véhicules récents haut de gamme, chauffeurs élites les mieux notés.',
    baseFare: 1500, // 1 500 FCFA
    pricePerKm: 400, // 400 FCFA / km
    pricePerMinute: 60, // 60 FCFA / min
    minFare: 2500, // 2 500 FCFA
    commissionRate: 0.15, // 15% commission
    icon: 'Crown',
    capacity: '4 places VIP',
  },
  interurbain: {
    category: 'interurbain',
    name: 'Yoon Navette Régionale',
    description: 'Trajets Inter-régions : Dakar - AIBD, Saly, Mbour, Thiès, Touba, Saint-Louis.',
    baseFare: 3000,
    pricePerKm: 220,
    pricePerMinute: 25,
    minFare: 12000, // 12 000 FCFA minimum interurbain
    commissionRate: 0.10, // 10% commission
    icon: 'MapPin',
    capacity: '4 à 7 places',
  },
};

export const SENEGAL_ZONES: ZoneConfig[] = [
  {
    id: 'zone_dakar_centre',
    name: 'Dakar Centre & Plateau / Corniche',
    surgeFactor: 1.0,
    tollRequired: false,
    tollAmount: 0,
  },
  {
    id: 'zone_almadies_ngor',
    name: 'Almadies, Ngor, Virage & Mamelles',
    surgeFactor: 1.1,
    tollRequired: false,
    tollAmount: 0,
  },
  {
    id: 'zone_aibd_aeroport',
    name: 'Aéroport International Blaise Diagne (AIBD)',
    surgeFactor: 1.0,
    tollRequired: true,
    tollAmount: 3000, // Péage Autoroute de l'Avenir (Aller-retour ou tronçon)
    activePromos: 'Forfait Direct Aéroport 15 000 FCFA Standard / 20 000 FCFA Confort',
  },
  {
    id: 'zone_peage_rufisque',
    name: 'Dakar Banlieue Est / Rufisque / Diamniadio',
    surgeFactor: 1.05,
    tollRequired: true,
    tollAmount: 1400,
  },
  {
    id: 'zone_petite_cote',
    name: 'Petite Côte (Saly, Mbour, Somone)',
    surgeFactor: 1.15,
    tollRequired: true,
    tollAmount: 3500,
  },
];
