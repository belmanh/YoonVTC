import { FixedPricePackage } from '../types/vtc';
import { SENEGAL_LOCATIONS } from './senegalData';

export const FIXED_PRICE_PACKAGES: FixedPricePackage[] = [
  {
    id: 'pkg_dakar_aibd_standard',
    name: 'Forfait Dakar ↔ AIBD (Aéroport)',
    pickupName: 'Dakar (Tous quartiers)',
    destinationName: 'Aéroport International Blaise Diagne (AIBD)',
    category: 'standard',
    priceFcfa: 15000,
    estimatedDurationMin: 45,
    distanceKm: 52,
    tollIncluded: true,
    badgeText: 'Péage Autoroute Inclus',
    description: 'Prise en charge à domicile, trajet direct par autoroute de l’Avenir avec péage compris.',
  },
  {
    id: 'pkg_dakar_aibd_confort',
    name: 'Forfait VIP Dakar ↔ AIBD',
    pickupName: 'Dakar (Almadies, Plateau, Point E)',
    destinationName: 'Aéroport Blaise Diagne VIP',
    category: 'confort',
    priceFcfa: 20000,
    estimatedDurationMin: 40,
    distanceKm: 52,
    tollIncluded: true,
    badgeText: 'VIP & Climatisation Haute Gamme',
    description: 'Berline premium, rafraîchissements à bord, assistance bagages et péage rapide.',
  },
  {
    id: 'pkg_dakar_saly_standard',
    name: 'Forfait Dakar ↔ Saly Portudal',
    pickupName: 'Dakar Centre',
    destinationName: 'Saly Station Balnéaire / Mbour',
    category: 'standard',
    priceFcfa: 30000,
    estimatedDurationMin: 70,
    distanceKm: 85,
    tollIncluded: true,
    badgeText: 'Idéal Week-End & Vacances',
    description: 'Liaison directe sans arrêt vers la Petite Côte (hôtels, résidences et plages).',
  },
  {
    id: 'pkg_dakar_saly_confort',
    name: 'Forfait VIP Dakar ↔ Saly & Somone',
    pickupName: 'Dakar',
    destinationName: 'Saly / Somone / Ngaparou',
    category: 'confort',
    priceFcfa: 38000,
    estimatedDurationMin: 65,
    distanceKm: 85,
    tollIncluded: true,
    badgeText: 'Confort Premium Élite',
    description: 'Véhicule tout confort climatisé avec chauffeur bilingue et péage autoroute inclus.',
  },
  {
    id: 'pkg_dakar_diamniadio',
    name: 'Forfait Dakar ↔ Diamniadio (CICAD / Ministères)',
    pickupName: 'Dakar',
    destinationName: 'Pôle Urbain Diamniadio (CICAD, Arène Nationale)',
    category: 'standard',
    priceFcfa: 10000,
    estimatedDurationMin: 35,
    distanceKm: 38,
    tollIncluded: true,
    badgeText: 'Navette Business Express',
    description: 'Idéal pour vos rendez-vous aux ministères et conférences au CICAD.',
  },
  {
    id: 'pkg_dakar_thies',
    name: 'Forfait Dakar ↔ Thiès Ville',
    pickupName: 'Dakar',
    destinationName: 'Thiès Centre (Place de France)',
    category: 'standard',
    priceFcfa: 22000,
    estimatedDurationMin: 55,
    distanceKm: 70,
    tollIncluded: true,
    badgeText: 'Interurbain Express',
    description: 'Trajet rapide par autoroute Ila Touba jusqu’à Thiès.',
  },
];

export function findMatchingFixedPackage(
  pickupQuarter: string,
  destQuarter: string,
  category: string
): FixedPricePackage | null {
  const destLower = destQuarter.toLowerCase();
  const pickupLower = pickupQuarter.toLowerCase();

  if (destLower.includes('diass') || destLower.includes('aibd') || destLower.includes('aéroport')) {
    return FIXED_PRICE_PACKAGES.find(
      (p) => p.destinationName.includes('AIBD') && (p.category === category || (category === 'eco' && p.category === 'standard'))
    ) || FIXED_PRICE_PACKAGES[0];
  }

  if (destLower.includes('saly') || destLower.includes('mbour') || destLower.includes('somone')) {
    return FIXED_PRICE_PACKAGES.find(
      (p) => p.destinationName.includes('Saly') && (p.category === category || (category === 'eco' && p.category === 'standard'))
    ) || FIXED_PRICE_PACKAGES[2];
  }

  if (destLower.includes('diamniadio') || destLower.includes('cicad')) {
    return FIXED_PRICE_PACKAGES.find((p) => p.destinationName.includes('Diamniadio')) || null;
  }

  if (destLower.includes('thiès') || destLower.includes('thies')) {
    return FIXED_PRICE_PACKAGES.find((p) => p.destinationName.includes('Thiès')) || null;
  }

  return null;
}
