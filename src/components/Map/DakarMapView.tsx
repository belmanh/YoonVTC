import React, { useEffect, useRef } from 'react';
import { Driver, GeoLocation, Ride } from '../../types/vtc';
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
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [center[0], center[1]] as L.LatLngTuple,
      zoom: zoom,
      zoomControl: !compact,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
  }, []);

  // Mise à jour des marqueurs et du tracé routier
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Marqueurs des Chauffeurs disponibles
    drivers.forEach((drv) => {
      // Si une course est en cours avec ce chauffeur, il a son propre marqueur live
      if (activeRide?.driver?.id === drv.id && assignedDriverLocation) return;
      if (drv.status !== 'online') return;

      const carIcon = L.divIcon({
        className: 'custom-driver-pin',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 transition-transform duration-300">
            <div class="absolute w-7 h-7 bg-slate-900 border-2 border-emerald-400 rounded-full shadow-lg flex items-center justify-center text-emerald-400">
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
          <p class="text-emerald-700 font-semibold mt-1">★ ${drv.rating.toFixed(1)} • En ligne</p>
        </div>
      `);
      markersGroup.addLayer(marker);
    });

    // 2. Marqueur du Chauffeur Assigné en Direct (Animé)
    if (assignedDriverLocation) {
      const liveDriverIcon = L.divIcon({
        className: 'assigned-driver-pin',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 animate-bounce-subtle">
            <div class="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div class="w-9 h-9 bg-emerald-600 border-2 border-white rounded-full shadow-2xl flex items-center justify-center text-white z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 transform rotate-[${assignedDriverLocation.heading}deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      const liveMarker = L.marker([assignedDriverLocation.lat, assignedDriverLocation.lng], { icon: liveDriverIcon });
      markersGroup.addLayer(liveMarker);
    }

    // 3. Marqueur Point de Départ (Pickup)
    if (selectedPickup) {
      const pickupIcon = L.divIcon({
        className: 'pickup-pin',
        html: `
          <div class="flex flex-col items-center">
            <div class="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow-md whitespace-nowrap mb-1">
              DÉPART
            </div>
            <div class="w-6 h-6 bg-emerald-500 border-2 border-white rounded-full shadow-lg flex items-center justify-center text-white">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        `,
        iconSize: [60, 45],
        iconAnchor: [30, 40],
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

    if (activeRide && activeRide.routeCoordinates && activeRide.routeCoordinates.length > 0) {
      const polyline = L.polyline(activeRide.routeCoordinates, {
        color: '#10b981', // Emerald green
        weight: 5,
        opacity: 0.85,
        dashArray: activeRide.status === 'searching_driver' ? '8, 8' : undefined,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
      routePolylineRef.current = polyline;

      // Fit bounds
      const bounds = L.latLngBounds(activeRide.routeCoordinates);
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
  }, [drivers, selectedPickup, selectedDestination, activeRide, assignedDriverLocation]);

  return (
    <div className="relative w-full h-full min-h-[300px] overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Badge Région & Info Carte */}
      <div className="absolute top-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/70 shadow-lg flex items-center space-x-2 text-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-semibold text-slate-200">Sénégal • GPS Temps Réel</span>
        <span className="text-slate-400 font-mono">Dakar & Régions</span>
      </div>
    </div>
  );
};
