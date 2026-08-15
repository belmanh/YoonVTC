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
  Palette,
  Check,
  X,
} from 'lucide-react';
import L from 'leaflet';

export type MapTileStyle = 'voyager' | 'positron' | 'dark' | 'satellite';

interface MapTileOption {
  id: MapTileStyle;
  name: string;
  icon: string;
  desc: string;
}

const MAP_TILE_OPTIONS: MapTileOption[] = [
  {
    id: 'voyager',
    name: 'Carte Claire / Lumineuse',
    icon: '☀️',
    desc: 'Belles couleurs vives et contrastées'
  },
  {
    id: 'positron',
    name: 'Carte Douce (Anti-fatigue visuelle)',
    icon: '⚪',
    desc: 'Tons gris doux reposants pour les yeux sensibles'
  },
  {
    id: 'dark',
    name: 'Carte Sombre / Nuit',
    icon: '🌙',
    desc: 'Mode nuit contrasté et sobre'
  },
  {
    id: 'satellite',
    name: 'Vue Satellite HD',
    icon: '🛰️',
    desc: 'Photographie aérienne réelle de Dakar'
  }
];

const getTileUrl = (style: MapTileStyle): string => {
  switch (style) {
    case 'voyager':
      return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    case 'positron':
      return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    case 'satellite':
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    case 'dark':
    default:
      return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }
};

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
  theme?: 'light' | 'dark';
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
  theme = 'light'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Vérification de la clé Google Maps
  const googleMapsKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
    '';

  const hasValidGoogleKey = Boolean(googleMapsKey) && googleMapsKey !== 'YOUR_API_KEY';

  // Mode de rendu cartographique : 'leaflet' (CartoDB / OpenStreetMap) ou 'google' (Google Maps Platform)
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'google'>(hasValidGoogleKey ? 'google' : 'leaflet');
  const [showStyleMenu, setShowStyleMenu] = useState<boolean>(false);

  // Style de tuiles de la carte (mémorisé dans localStorage pour le confort visuel de l'utilisateur)
  const [tileStyle, setTileStyle] = useState<MapTileStyle>(() => {
    const saved = localStorage.getItem('yoon_preferred_map_style');
    if (saved && ['voyager', 'positron', 'dark', 'satellite'].includes(saved)) {
      return saved as MapTileStyle;
    }
    return theme === 'light' ? 'voyager' : 'dark';
  });

  // Si aucune préférence explicite n'a été mémorisée, synchroniser avec le thème général
  useEffect(() => {
    const saved = localStorage.getItem('yoon_preferred_map_style');
    if (!saved) {
      setTileStyle(theme === 'light' ? 'voyager' : 'dark');
    }
  }, [theme]);

  const handleSelectMapStyle = (newStyle: MapTileStyle) => {
    setTileStyle(newStyle);
    localStorage.setItem('yoon_preferred_map_style', newStyle);
    setShowStyleMenu(false);
  };

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

    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]] as L.LatLngTuple,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    const tileLayer = L.tileLayer(getTileUrl(tileStyle), {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      tileLayerRef.current = null;
    };
  }, [mapEngine]);

  // Mise à jour dynamique de la couche de tuiles (thème clair/sombre/satellite/positron)
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.setUrl(getTileUrl(tileStyle));
  }, [tileStyle, mapEngine]);

  // Mise à jour des marqueurs et du tracé routier Leaflet
  useEffect(() => {
    if (mapEngine !== 'leaflet') return;
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Marqueurs des Chauffeurs disponibles (Style Vectoriel 3D avec orientation et phares)
    drivers.forEach((drv) => {
      if (activeRide?.driver?.id === drv.id && assignedDriverLocation) return;
      if (drv.status !== 'online') return;

      const heading = drv.currentLocation.heading || 45;

      const carIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 group cursor-pointer">
            <!-- Faisceau lumineux des phares -->
            <div class="absolute w-6 h-12 bg-gradient-to-t from-blue-400/20 to-transparent pointer-events-none origin-bottom transform -translate-y-4 rotate-[${heading}deg]"></div>
            
            <!-- Corps de la voiture Uber-Style -->
            <div class="w-8 h-8 rounded-xl bg-slate-900 border-2 border-blue-400 shadow-xl flex items-center justify-center text-blue-400 transform transition-transform duration-300 rotate-[${heading}deg]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-blue-400 fill-blue-400/30" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            
            <!-- Signal GPS actif -->
            <span class="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([drv.currentLocation.lat, drv.currentLocation.lng], { icon: carIcon });
      marker.bindPopup(`
        <div class="p-2 text-slate-900 font-sans text-xs bg-white rounded-lg shadow-xl">
          <div class="flex items-center space-x-2">
            <img src="${drv.avatar}" class="w-8 h-8 rounded-full border border-blue-500" />
            <div>
              <p class="font-bold text-sm text-slate-900">${drv.fullName}</p>
              <p class="text-slate-600">${drv.vehicle.brand} ${drv.vehicle.model}</p>
            </div>
          </div>
          <div class="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between">
            <span class="font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[11px]">${drv.vehicle.plateNumber}</span>
            <span class="text-blue-700 font-bold">★ ${drv.rating.toFixed(1)}</span>
          </div>
        </div>
      `);
      markersGroup.addLayer(marker);
    });

    // 2. Marqueur du Chauffeur Assigné en Direct (Animé GPS temps réel)
    if (assignedDriverLocation) {
      const heading = assignedDriverLocation.heading || 0;
      const liveDriverIcon = L.divIcon({
        className: 'assigned-driver-pin',
        html: `
          <div class="relative flex items-center justify-center w-12 h-12">
            <!-- Onde radar autour du chauffeur assigné -->
            <div class="absolute inset-0 rounded-full bg-blue-400/30 animate-ping"></div>
            <div class="absolute inset-1 rounded-full bg-blue-500/20 animate-pulse"></div>
            
            <!-- Véhicule actif -->
            <div class="w-10 h-10 bg-slate-950 border-2 border-blue-400 rounded-2xl shadow-2xl flex items-center justify-center text-blue-400 z-10 transform rotate-[${heading}deg]">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-blue-400 text-blue-300" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
            
            <div class="absolute -top-7 bg-blue-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full shadow-lg border border-white/40 tracking-wider">
              En approche
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      const liveMarker = L.marker([assignedDriverLocation.lat, assignedDriverLocation.lng], { icon: liveDriverIcon });
      markersGroup.addLayer(liveMarker);
    }

    // 3. Marqueur Point de Départ (Pick-up) avec "EFFET ONDE" RADAR PULSANT
    if (selectedPickup) {
      const pickupIcon = L.divIcon({
        className: 'pickup-pin',
        html: `
          <div class="relative flex flex-col items-center justify-center">
            <!-- Ondes concentriques (Effet Onde) -->
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-blue-500/25 animate-ripple-1 pointer-events-none"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-blue-500/15 animate-ripple-2 pointer-events-none"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-blue-500/10 animate-ripple-3 pointer-events-none"></div>
            
            <!-- Badge Départ -->
            <div class="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black tracking-wider uppercase rounded-full shadow-xl mb-1 flex items-center gap-1 border border-blue-400/50 z-20">
              <span class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              Départ
            </div>
            
            <!-- Pin Central Vert Walo -->
            <div class="relative w-7 h-7 bg-slate-950 border-2 border-blue-400 rounded-full shadow-2xl flex items-center justify-center text-blue-400 z-20">
              <div class="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        `,
        iconSize: [120, 90],
        iconAnchor: [60, 65],
      });
      const pickupMarker = L.marker([selectedPickup.lat, selectedPickup.lng], { icon: pickupIcon });
      markersGroup.addLayer(pickupMarker);
    }

    // 4. Marqueur Destination (Dropoff) avec Drapeau / Cible d'Arrivée
    if (selectedDestination) {
      const destIcon = L.divIcon({
        className: 'destination-pin',
        html: `
          <div class="relative flex flex-col items-center justify-center">
            <!-- Badge Arrivée -->
            <div class="px-2.5 py-1 bg-slate-950 text-rose-400 text-[10px] font-black tracking-wider uppercase rounded-full shadow-xl mb-1 flex items-center gap-1 border border-rose-500/60 z-20">
              <span class="text-xs">🏁</span>
              Arrivée
            </div>
            
            <!-- Pin Central Rouge/Anthracite avec Cible -->
            <div class="w-7 h-7 bg-rose-600 border-2 border-white rounded-full shadow-2xl flex items-center justify-center text-white z-20">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [100, 80],
        iconAnchor: [50, 58],
      });
      const destMarker = L.marker([selectedDestination.lat, selectedDestination.lng], { icon: destIcon });
      markersGroup.addLayer(destMarker);
    }

    // 5. Tracé Routier Néon Dégradé (Glow + Bright Core)
    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    const routeCoords = activeRide?.routeCoordinates || routeEtaInfo?.routePoints;
    if (routeCoords && routeCoords.length > 0) {
      // Couche 1 : Halo lumineux Néon externe
      const glowPolyline = L.polyline(routeCoords, {
        color: '#00D084',
        weight: 10,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // Couche 2 : Ligne principale éclatante
      const mainPolyline = L.polyline(routeCoords, {
        color: '#00E599',
        weight: 4,
        opacity: 0.95,
        dashArray: activeRide?.status === 'searching_driver' ? '10, 10' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = mainPolyline;

      const bounds = L.latLngBounds(routeCoords);
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
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

  const containerBg = theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-slate-200 border-slate-300';

  return (
    <div className={`relative w-full h-full min-h-[320px] overflow-hidden rounded-xl border flex flex-col ${containerBg}`}>
      {/* Rendu Carte : Plan Dakar Interactif Exclusif */}
      <div className="w-full h-full flex-1 relative z-0">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Sélecteur de style de carte interactif (Préférence Utilisateur & Confort Visuel) */}
      <div className="absolute top-3 right-3 z-[450] flex flex-col items-end">
        <button
          type="button"
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 rounded-xl shadow-lg backdrop-blur-md text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-95"
          title="Choisir le fond de carte qui vous convient"
        >
          <Palette className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline"></span>
          <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-md border border-blue-500/30 font-semibold">
            {tileStyle === 'voyager' && '☀️ Claire'}
            {tileStyle === 'positron' && '⚪ Douce'}
            {tileStyle === 'dark' && '🌙 Sombre'}
            {tileStyle === 'satellite' && '🛰️ Satellite'}
          </span>
        </button>

        {showStyleMenu && (
          <div className="mt-1.5 w-64 bg-slate-900/95 border border-slate-700 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800 px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fond de Carte Personnalisé</span>
              <button
                type="button"
                onClick={() => setShowStyleMenu(false)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 pt-1">
              {MAP_TILE_OPTIONS.map((opt) => {
                const isSelected = tileStyle === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectMapStyle(opt.id)}
                    className={`w-full text-left p-2 rounded-xl transition-all border flex items-start space-x-2.5 ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-0.5">{opt.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold leading-tight">{opt.name}</p>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('yoon_preferred_map_style');
                setTileStyle(theme === 'light' ? 'voyager' : 'dark');
                setShowStyleMenu(false);
              }}
              className="w-full mt-1 pt-1.5 text-center text-[10px] text-slate-400 hover:text-blue-300 border-t border-slate-800/80 font-medium"
            >
              🔄 Réinitialiser selon l'application ({theme === 'light' ? 'Mode Jour' : 'Mode Nuit'})
            </button>
          </div>
        )}
      </div>

      {/* Bouton Flottant Inférieur : Détection GPS Passager */}
      {onGpsLocatePassenger && (
        <button
          onClick={onGpsLocatePassenger}
          className="absolute bottom-4 right-4 z-[400] bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-2xl border-2 border-slate-950 transition-all transform active:scale-95 flex items-center justify-center"
          title="Détecter ma position GPS exacte (Dakar)"
        >
          <Compass className="w-5 h-5 animate-spin-slow" />
        </button>
      )}
    </div>
  );
};
