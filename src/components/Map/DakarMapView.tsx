import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Driver, GeoLocation, Ride } from '../../types/vtc';
import { calculateRouteAndEta, RouteEtaResult } from '../../services/gpsService';
import { GoogleMapsDakarLayer } from './GoogleMapsDakarLayer';
import {
  MapPin,
  Navigation,
  Layers,
  Clock,
  Gauge,
  Radio,
  Compass,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import L from 'leaflet';

interface DakarMapViewProps {
  drivers: Driver[];
  selectedPickup: GeoLocation | null;
  selectedDestination: GeoLocation | null;
  activeRide: Ride | null;
  assignedDriverLocation?: { lat: number; lng: number; heading: number } | null;
  center?: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  interactive?: boolean;
  compact?: boolean;
  onGpsLocatePassenger?: () => void;
}

export const DakarMapView: React.FC<DakarMapViewProps> = ({
  drivers,
  selectedPickup,
  selectedDestination,
  activeRide,
  assignedDriverLocation,
  center = [14.7167, -17.4677], // Dakar center
  zoom = 13,
  onMapClick,
  compact = false,
  onGpsLocatePassenger,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Vérification de la clé Google Maps
  const googleMapsKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const hasValidGoogleKey = Boolean(googleMapsKey) && googleMapsKey !== 'YOUR_API_KEY';

  // Mode de rendu cartographique : 'leaflet' (CartoDB / OpenStreetMap) ou 'google' (Google Maps Platform)
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>(hasValidGoogleKey ? 'google' : 'leaflet');
  const [tileStyle, setTileStyle] = useState<'voyager' | 'dark' | 'satellite'>('voyager');

  // Calcul en direct de la distance et de l'ETA (temps d'arrivée)
  const routeEtaInfo: RouteEtaResult | null = useMemo(() => {
    if (assignedDriverLocation && selectedPickup) {
      return calculateRouteAndEta(assignedDriverLocation, selectedPickup);
    }
    if (selectedPickup && selectedDestination) {
      return calculateRouteAndEta(selectedPickup, selectedDestination);
    }
    return null;
  }, [assignedDriverLocation, selectedPickup, selectedDestination]);

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]] as L.LatLngTuple,
      zoom: zoom,
      zoomControl: !compact,
      attributionControl: false,
    });

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (tileStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (tileStyle === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapEngine, tileStyle]);

  // Mise à jour des marqueurs et du tracé routier Leaflet
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Marqueurs des Chauffeurs disponibles
    drivers.forEach((drv) => {
      if (activeRide?.driver?.id === drv.id && assignedDriverLocation) return;
      if (drv.status !== 'online') return;

      const carIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 transition-transform duration-300">
            <div class="absolute w-7 h-7 bg-slate-950 border-2 border-emerald-400 rounded-full shadow-lg flex items-center justify-center text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 transform rotate-[${drv.currentLocation.heading}deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <span class="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([drv.currentLocation.lat, drv.currentLocation.lng], { icon: carIcon });
      marker.bindPopup(`
        <div class="p-1 text-slate-900 font-sans text-xs">
          <p class="font-bold text-sm">${drv.fullName}</p>
          <p class="text-slate-600">${drv.vehicle.brand} ${drv.vehicle.model} (${drv.vehicle.plateNumber})</p>
          <p class="text-emerald-700 font-semibold mt-1">★ ${drv.rating.toFixed(1)} • GPS Actif</p>
        </div>
      `);
      markersGroup.addLayer(marker);
    });

    // 2. Marqueur du Chauffeur Assigné en Direct (Animé 5s GPS)
    if (assignedDriverLocation) {
      const liveDriverIcon = L.divIcon({
        className: 'assigned-driver-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10">
            <div class="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping"></div>
            <div class="w-9 h-9 bg-emerald-600 border-2 border-white rounded-full shadow-2xl flex items-center justify-center text-white z-10 font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transform rotate-[${assignedDriverLocation.heading}deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            <div class="absolute -top-6 bg-slate-900/90 text-[10px] text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/50 shadow">
              GPS 5s
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const liveMarker = L.marker([assignedDriverLocation.lat, assignedDriverLocation.lng], { icon: liveDriverIcon });
      markersGroup.addLayer(liveMarker);
    }

    // 3. Marqueur Point de Départ (Passager GPS)
    if (selectedPickup) {
      const pickupIcon = L.divIcon({
        className: 'pickup-pin',
        html: `
          <div class="flex flex-col items-center">
            <div class="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow-md whitespace-nowrap mb-1 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              PASSAGER GPS
            </div>
            <div class="relative w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [80, 50],
        iconAnchor: [40, 42],
      });
      const pickupMarker = L.marker([selectedPickup.lat, selectedPickup.lng], { icon: pickupIcon });
      markersGroup.addLayer(pickupMarker);
    }

    // 4. Marqueur Destination (Dropoff)
    if (selectedDestination) {
      const destIcon = L.divIcon({
        className: 'destination-pin',
        html: `
          <div class="flex flex-col items-center">
            <div class="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-md whitespace-nowrap mb-1">
              ARRIVÉE
            </div>
            <div class="w-6 h-6 bg-rose-600 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [60, 45],
        iconAnchor: [30, 40],
      });
      const destMarker = L.marker([selectedDestination.lat, selectedDestination.lng], { icon: destIcon });
      markersGroup.addLayer(destMarker);
    }

    // 5. Tracé Routier (Polyline)
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    const routeCoords = activeRide?.routeCoordinates || routeEtaInfo?.routePoints;
    if (routeCoords && routeCoords.length > 0) {
      const polyline = L.polyline(routeCoords, {
        color: '#10b981',
        weight: 5,
        opacity: 0.9,
        dashArray: activeRide?.status === 'searching_driver' ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routePolylineRef.current = polyline;

      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (selectedPickup && selectedDestination) {
      const bounds = L.latLngBounds([
        [selectedPickup.lat, selectedPickup.lng],
        [selectedDestination.lat, selectedDestination.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (selectedPickup) {
      map.setView([selectedPickup.lat, selectedPickup.lng], 14);
    }
  }, [mapEngine, drivers, selectedPickup, selectedDestination, activeRide, assignedDriverLocation, routeEtaInfo]);

  return (
    <div className="relative w-full h-full min-h-[320px] overflow-hidden rounded-xl bg-slate-950 border border-slate-800 flex flex-col">
      {/* Barre d'état GPS supérieure & Télémétrie en direct */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Badge Télémétrie GPS */}
        <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl flex items-center space-x-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-semibold text-slate-100 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            GPS Live Sénégal
          </span>
          <span className="text-slate-400 font-mono text-[11px] border-l border-slate-700 pl-2">
            Balise 5s Firestore
          </span>
        </div>

        {/* Badge ETA & Distance Temps Réel */}
        {routeEtaInfo && (
          <div className="pointer-events-auto bg-emerald-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-600/50 shadow-xl flex items-center space-x-3 text-xs text-emerald-100">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-emerald-300">ETA : {routeEtaInfo.etaText}</span>
            </div>
            <div className="flex items-center gap-1 border-l border-emerald-700/60 pl-2">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>{routeEtaInfo.distanceKm} km</span>
            </div>
            <span className="px-1.5 py-0.5 bg-emerald-800/80 rounded text-[10px] font-semibold uppercase">
              Trafic {routeEtaInfo.trafficStatus}
            </span>
          </div>
        )}

        {/* Contrôles du moteur de carte */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800 shadow-xl text-xs">
          <button
            onClick={() => setMapEngine('leaflet')}
            className={`px-2 py-1 rounded transition-colors ${
              mapEngine === 'leaflet'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Carte VTC Optimisée"
          >
            Plan Dakar
          </button>
          <button
            onClick={() => {
              if (hasValidGoogleKey) {
                setMapEngine('google');
              } else {
                setMapEngine('google');
              }
            }}
            className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
              mapEngine === 'google'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Google Maps Platform"
          >
            Google Maps
            {!hasValidGoogleKey && <KeyRound className="w-3 h-3 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Rendu Carte : Google Maps ou Leaflet */}
      <div className="w-full h-full flex-1 relative z-0">
        {mapEngine === 'google' ? (
          hasValidGoogleKey ? (
            <GoogleMapsDakarLayer
              apiKey={googleMapsKey}
              drivers={drivers}
              selectedPickup={selectedPickup}
              selectedDestination={selectedDestination}
              activeRide={activeRide}
              assignedDriverLocation={assignedDriverLocation}
              onMapClick={onMapClick}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 bg-slate-950 text-slate-200">
              <div className="max-w-md text-center bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-2xl">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400 mx-auto mb-3">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-100 mb-1">Clé Google Maps Platform</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Pour afficher le rendu vectoriel 3D Google Maps avec Routes API, renseignez votre clé secrète.
                </p>
                <div className="text-left bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] space-y-1.5 mb-4 text-slate-300 font-mono">
                  <p>1. Menu ⚙️ <strong>Settings</strong> (en haut à droite) → <strong>Secrets</strong></p>
                  <p>2. Nom : <code className="text-emerald-400">GOOGLE_MAPS_PLATFORM_KEY</code></p>
                  <p>3. Collez votre clé API puis validez</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setMapEngine('leaflet')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow"
                  >
                    Utiliser le Plan Dakar Interactif (Prêt à l'emploi)
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        )}
      </div>

      {/* Bouton Flottant Inférieur : Détection GPS Passager */}
      {onGpsLocatePassenger && (
        <button
          onClick={onGpsLocatePassenger}
          className="absolute bottom-4 right-4 z-[400] bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-full shadow-2xl border-2 border-slate-950 transition-all transform active:scale-95 flex items-center justify-center"
          title="Détecter ma position GPS exacte (Dakar)"
        >
          <Compass className="w-5 h-5 animate-spin-slow" />
        </button>
      )}
    </div>
  );
};
