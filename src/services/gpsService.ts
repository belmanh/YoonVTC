import { GeoLocation, Driver, Ride } from '../types/vtc';
import { SENEGAL_LOCATIONS } from '../data/senegalData';
import { updateDriverLocation } from './dbService';

export interface GpsCoordinates {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  timestamp: number;
}

export interface RouteEtaResult {
  distanceKm: number;
  distanceMeters: number;
  durationMinutes: number;
  durationSeconds: number;
  etaText: string;
  trafficStatus: 'fluide' | 'modere' | 'dense';
  routePoints: [number, number][];
  directionsSteps: string[];
}

/**
 * Calculateur de distance Haversine précis
 */
export function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Rayon de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Trouve le quartier / repère de Dakar le plus proche de coordonnées GPS
 */
export function findNearestDakarLandmark(lat: number, lng: number): GeoLocation {
  let closestLoc = SENEGAL_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of SENEGAL_LOCATIONS) {
    const dist = haversineDistanceMeters(lat, lng, loc.lat, loc.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestLoc = loc;
    }
  }

  // Si l'utilisateur est à moins de 350m d'un repère connu, on utilise le nom exact du repère
  if (minDistance < 350) {
    return {
      ...closestLoc,
      lat,
      lng,
      name: `${closestLoc.name} (Précision GPS: ~${Math.round(minDistance)}m)`,
    };
  }

  // Sinon, on génère un libellé géolocalisé avec le quartier le plus proche
  return {
    name: `Position GPS exacte (${closestLoc.quarter})`,
    quarter: closestLoc.quarter,
    city: closestLoc.city,
    lat,
    lng,
    popular: false,
  };
}

/**
 * Détecte la position GPS exacte du passager à Dakar / Sénégal
 * Utilise l'API Geolocation HTML5 avec haute précision
 */
export async function detectPassengerGpsLocation(): Promise<{
  location: GeoLocation;
  coords: GpsCoordinates;
  isFallback: boolean;
  message: string;
}> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Fallback Dakar Almadies
      const fallback = SENEGAL_LOCATIONS[1];
      resolve({
        location: fallback,
        coords: {
          lat: fallback.lat,
          lng: fallback.lng,
          accuracy: 50,
          heading: 0,
          timestamp: Date.now(),
        },
        isFallback: true,
        message: 'Géolocalisation non supportée par le navigateur. Position Dakar par défaut.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy, heading, speed } = position.coords;
        const coords: GpsCoordinates = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 10,
          heading: heading || 0,
          speed: speed || 0,
          timestamp: position.timestamp || Date.now(),
        };

        const resolvedLocation = findNearestDakarLandmark(latitude, longitude);

        resolve({
          location: resolvedLocation,
          coords,
          isFallback: false,
          message: `Position GPS détectée avec succès (Précision : ±${Math.round(accuracy || 10)}m)`,
        });
      },
      (error) => {
        console.warn('[GPS Passager] Erreur détection :', error.message);
        // Fallback intelligent sur un quartier animé de Dakar (Almadies)
        const fallback = SENEGAL_LOCATIONS[1];
        resolve({
          location: fallback,
          coords: {
            lat: fallback.lat,
            lng: fallback.lng,
            accuracy: 30,
            heading: 0,
            timestamp: Date.now(),
          },
          isFallback: true,
          message: 'Autorisation GPS requise ou simulation. Position fixée à Dakar Almadies.',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calcul du tracé routier, de la distance et de l'ETA entre le chauffeur et le passager (ou départ/arrivée)
 */
export function calculateRouteAndEta(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  options: {
    isRushHour?: boolean;
    roadType?: 'urban' | 'expressway' | 'mixed';
  } = {}
): RouteEtaResult {
  const straightMeters = haversineDistanceMeters(origin.lat, origin.lng, destination.lat, destination.lng);
  
  // Facteur de sinuosité du réseau routier sénégalais
  // Corniche Ouest, VDN, Voie de Dégagement, voies secondaires
  const sinuosity = straightMeters < 3000 ? 1.35 : straightMeters < 15000 ? 1.28 : 1.18;
  const realDistanceMeters = Math.round(straightMeters * sinuosity);
  const distanceKm = Math.round((realDistanceMeters / 1000) * 10) / 10;

  // Calcul de la vitesse moyenne selon la zone de Dakar et l'heure de pointe
  let averageSpeedKmh = 32;
  let trafficStatus: 'fluide' | 'modere' | 'dense' = 'fluide';

  if (distanceKm > 25) {
    // Axe Autoroute à péage (AIBD / Diamniadio / Rufisque)
    averageSpeedKmh = 80;
    trafficStatus = 'fluide';
  } else if (options.isRushHour) {
    // Heure de pointe VDN / Rond-point Liberté 6 / Pont de l'Émergence
    averageSpeedKmh = 16;
    trafficStatus = 'dense';
  } else if (distanceKm < 5) {
    // Centre-ville / Plateau / Almadies
    averageSpeedKmh = 24;
    trafficStatus = 'modere';
  }

  const durationHours = distanceKm / averageSpeedKmh;
  const durationSeconds = Math.max(90, Math.round(durationHours * 3600));
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

  // Génération de points réalistes le long des axes routiers
  const routePoints = generateRealisticRoadPath(origin, destination);

  // Étapes de guidage vocal/textuel
  const directionsSteps = generateGuidanceSteps(origin, destination, distanceKm, durationMinutes);

  let etaText = `${durationMinutes} min`;
  if (durationMinutes >= 60) {
    const h = Math.floor(durationMinutes / 60);
    const m = durationMinutes % 60;
    etaText = `${h}h ${m}m`;
  }

  return {
    distanceKm,
    distanceMeters: realDistanceMeters,
    durationMinutes,
    durationSeconds,
    etaText,
    trafficStatus,
    routePoints,
    directionsSteps,
  };
}

/**
 * Génère des coordonnées de tracé routier naturel épousant les courbes de Dakar
 */
function generateRealisticRoadPath(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  steps: number = 24
): [number, number][] {
  const points: [number, number][] = [];
  
  // Point de contrôle intermédiaire courbé
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const normalX = -dy * 0.25;
  const normalY = dx * 0.25;

  const ctrlLat = (from.lat + to.lat) / 2 + normalY;
  const ctrlLng = (from.lng + to.lng) / 2 + normalX;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Bézier quadratique pour simuler les grands boulevards (Corniche, VDN, Autoroute)
    const lat = (1 - t) * (1 - t) * from.lat + 2 * (1 - t) * t * ctrlLat + t * t * to.lat;
    const lng = (1 - t) * (1 - t) * from.lng + 2 * (1 - t) * t * ctrlLng + t * t * to.lng;
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Génère des indications de navigation en français
 */
function generateGuidanceSteps(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  distanceKm: number,
  durationMin: number
): string[] {
  const steps: string[] = [];
  steps.push(`Départ vers l'itinéraire le plus rapide (${distanceKm} km)`);
  
  if (distanceKm > 10) {
    steps.push("Rejoindre la Voie de Dégagement Nord (VDN) ou l'Autoroute de l'Avenir");
    steps.push('Continuer tout droit sur 6 km');
  } else {
    steps.push('Suivre la route principale en direction de la destination');
  }

  steps.push(`Arrivée estimée dans environ ${durationMin} minutes`);
  return steps;
}

/**
 * Gestionnaire du flux GPS Chauffeur en temps réel (Émission toutes les 5 secondes vers Firestore)
 */
export class DriverGpsTelemetryEmitter {
  private driverId: string;
  private intervalId: any = null;
  private watchId: number | null = null;
  private isEmitting: boolean = false;
  private currentCoords: { lat: number; lng: number; heading: number };
  private onLocationUpdateCallback?: (loc: { lat: number; lng: number; heading: number }) => void;

  constructor(
    driverId: string,
    initialLocation: { lat: number; lng: number; heading: number },
    onLocationUpdate?: (loc: { lat: number; lng: number; heading: number }) => void
  ) {
    this.driverId = driverId;
    this.currentCoords = { ...initialLocation };
    this.onLocationUpdateCallback = onLocationUpdate;
  }

  /**
   * Démarre l'envoi périodique des coordonnées GPS toutes les 5 secondes
   */
  public start(intervalMs: number = 5000): void {
    if (this.isEmitting) return;
    this.isEmitting = true;

    console.log(`[GPS Emitter] Démarrage du tracking GPS pour le chauffeur ${this.driverId} (intervalle : ${intervalMs}ms)`);

    // 1. Écoute du capteur GPS physique si disponible
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.currentCoords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || this.currentCoords.heading || 0,
          };
          if (this.onLocationUpdateCallback) {
            this.onLocationUpdateCallback(this.currentCoords);
          }
        },
        (err) => {
          console.warn('[GPS Emitter] WatchPosition info :', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 10000,
        }
      );
    }

    // 2. Emission vers Firestore toutes les 5 secondes (5000ms)
    this.intervalId = setInterval(async () => {
      if (!this.isEmitting) return;

      try {
        // Envoi des coordonnées GPS à Firestore
        await updateDriverLocation(
          this.driverId,
          this.currentCoords.lat,
          this.currentCoords.lng,
          this.currentCoords.heading
        );
        console.log(`[GPS Emitter] Coordonnées transmises à Firestore à ${new Date().toLocaleTimeString()} :`, {
          lat: this.currentCoords.lat.toFixed(5),
          lng: this.currentCoords.lng.toFixed(5),
        });
      } catch (err) {
        console.warn('[GPS Emitter] Échec envoi Firestore :', err);
      }
    }, intervalMs);
  }

  /**
   * Met à jour manuellement la position (par exemple lors de la simulation de conduite)
   */
  public updateCoordinates(lat: number, lng: number, heading: number = 0): void {
    this.currentCoords = { lat, lng, heading };
    if (this.onLocationUpdateCallback) {
      this.onLocationUpdateCallback(this.currentCoords);
    }
  }

  /**
   * Arrête la balise GPS
   */
  public stop(): void {
    this.isEmitting = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    console.log(`[GPS Emitter] Arrêt de la balise GPS pour le chauffeur ${this.driverId}`);
  }

  public getCurrentCoords() {
    return this.currentCoords;
  }
}
