import { GeoLocation, VehicleCategory, PriceBreakdown, PricingRule } from '../types/vtc';
import { PRICING_RULES, SENEGAL_ZONES } from '../data/senegalData';

/**
 * Calculateur de distance Haversine avec ajustement routier urbain pour le Sénégal
 */
export function calculateDistanceKm(from: GeoLocation, to: GeoLocation): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightDistance = R * c;

  // Facteur de sinuosité urbaine (Dakar Corniche / VDN / Voies secondaires)
  const urbanFactor = straightDistance < 15 ? 1.32 : straightDistance < 40 ? 1.25 : 1.18;
  return Math.round(straightDistance * urbanFactor * 10) / 10;
}

/**
 * Estimation de la durée du trajet en minutes en fonction du trafic et de la distance
 */
export function estimateDurationMinutes(
  distanceKm: number,
  from: GeoLocation,
  to: GeoLocation,
  isRushHour: boolean = false
): number {
  const isAirportOrInterurban =
    from.name.includes('AIBD') ||
    to.name.includes('AIBD') ||
    from.city !== to.city;

  let averageSpeedKmh = 28; // Vitesse moyenne à Dakar ville (embouteillages, ralentisseurs)

  if (isAirportOrInterurban) {
    averageSpeedKmh = 75; // Vitesse autoroute à péage
  } else if (isRushHour) {
    averageSpeedKmh = 18; // Heures de pointe VDN / Autoroute / Rond-point Liberté 6
  }

  const durationHours = distanceKm / averageSpeedKmh;
  const minutes = Math.round(durationHours * 60);
  return Math.max(5, minutes);
}

/**
 * Détection des zones à péage (Autoroute de l'Avenir vers Diamniadio / AIBD / Saly)
 */
export function detectTollFee(from: GeoLocation, to: GeoLocation): number {
  const isAIBD = from.name.includes('AIBD') || to.name.includes('AIBD');
  const isSalyOrMbour = from.city === 'Mbour' || to.city === 'Mbour' || from.quarter.includes('Saly') || to.quarter.includes('Saly');
  const isDiamniadio = from.quarter.includes('Diamniadio') || to.quarter.includes('Diamniadio');

  if (isAIBD) return 3000; // Péage Dakar <-> AIBD
  if (isSalyOrMbour) return 3500; // Péage Dakar <-> Saly/Mbour
  if (isDiamniadio) return 1400; // Péage Dakar <-> Diamniadio
  return 0;
}

/**
 * Détecte les tarifs forfaitaires officiels AIBD ou calcule le tarif dynamique en FCFA
 */
export function calculateRidePrice(
  from: GeoLocation,
  to: GeoLocation,
  category: VehicleCategory,
  options: {
    isRushHour?: boolean;
    surgeMultiplier?: number;
    customPricingRules?: Record<string, PricingRule>;
  } = {}
): {
  distanceKm: number;
  durationMinutes: number;
  breakdown: PriceBreakdown;
} {
  const distanceKm = calculateDistanceKm(from, to);
  const durationMinutes = estimateDurationMinutes(distanceKm, from, to, options.isRushHour);
  const tollFee = detectTollFee(from, to);
  const rules = options.customPricingRules || PRICING_RULES;
  const rule = rules[category] || PRICING_RULES.standard;

  const isAIBD = from.name.includes('AIBD') || to.name.includes('AIBD');

  // Tarifs forfaitaires AIBD Aéroport
  if (isAIBD && category !== 'interurbain') {
    let aibdFixedFare = 15000; // Éco / Standard forfait 15 000 FCFA
    if (category === 'confort') aibdFixedFare = 22000; // Confort VIP forfait 22 000 FCFA
    
    const commission = Math.round(aibdFixedFare * rule.commissionRate);
    return {
      distanceKm,
      durationMinutes,
      breakdown: {
        baseFare: rule.baseFare,
        distanceCost: Math.round(aibdFixedFare * 0.7),
        durationCost: Math.round(aibdFixedFare * 0.1),
        tollFee,
        zoneMultiplier: 1.0,
        surgeMultiplier: options.surgeMultiplier || 1.0,
        totalFare: aibdFixedFare,
        platformCommission: commission,
        driverNetEarnings: aibdFixedFare - commission,
      },
    };
  }

  // Calcul dynamique standard
  const baseFare = rule.baseFare;
  const distanceCost = Math.round(distanceKm * rule.pricePerKm);
  const durationCost = Math.round(durationMinutes * rule.pricePerMinute);
  const zoneMultiplier = 1.0;
  const surgeMultiplier = options.surgeMultiplier || (options.isRushHour ? 1.25 : 1.0);

  const rawTotal = (baseFare + distanceCost + durationCost) * zoneMultiplier * surgeMultiplier + tollFee;
  
  // Arrondi au multiple de 100 FCFA le plus proche (pour fluidité monnaie)
  const totalFare = Math.max(rule.minFare, Math.ceil(rawTotal / 100) * 100);
  const platformCommission = Math.round((totalFare - tollFee) * rule.commissionRate);
  const driverNetEarnings = totalFare - platformCommission;

  return {
    distanceKm,
    durationMinutes,
    breakdown: {
      baseFare,
      distanceCost,
      durationCost,
      tollFee,
      zoneMultiplier,
      surgeMultiplier,
      totalFare,
      platformCommission,
      driverNetEarnings,
    },
  };
}

/**
 * Génère des points GPS intermédiaires pour simuler une trajectoire routière fluide
 */
export function generateRoutePoints(from: GeoLocation, to: GeoLocation, steps: number = 18): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (from.lat + to.lat) / 2 + (Math.random() - 0.5) * 0.006;
  const midLng = (from.lng + to.lng) / 2 + (Math.random() - 0.5) * 0.006;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Courbe de Bézier quadratique pour simuler les virages routiers
    const lat = (1 - t) * (1 - t) * from.lat + 2 * (1 - t) * t * midLat + t * t * to.lat;
    const lng = (1 - t) * (1 - t) * from.lng + 2 * (1 - t) * t * midLng + t * t * to.lng;
    points.push([lat, lng]);
  }
  return points;
}
