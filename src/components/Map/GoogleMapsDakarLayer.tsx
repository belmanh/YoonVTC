import React, { useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Driver, GeoLocation, Ride } from '../../types/vtc';

interface GoogleMapsDakarLayerProps {
  apiKey: string;
  drivers: Driver[];
  selectedPickup: GeoLocation | null;
  selectedDestination: GeoLocation | null;
  activeRide: Ride | null;
  assignedDriverLocation?: { lat: number; lng: number; heading: number } | null;
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
}

function RoutePolyline({
  origin,
  destination,
  routeCoordinates,
}: {
  origin: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
  routeCoordinates?: [number, number][];
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    // Nettoyage de l'ancienne polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      const path = routeCoordinates.map(([lat, lng]) => ({ lat, lng }));
      const poly = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#10b981',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map,
      });
      polylineRef.current = poly;

      const bounds = new google.maps.LatLngBounds();
      path.forEach((p) => bounds.extend(p));
      map.fitBounds(bounds, 50);
    } else if (origin && destination && routesLib) {
      routesLib.Route.computeRoutes({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: 'DRIVING',
        fields: ['path', 'viewport'],
      })
        .then(({ routes }) => {
          if (routes?.[0]) {
            const polys = routes[0].createPolylines();
            if (polys && polys.length > 0) {
              polys.forEach((p) => p.setMap(map));
              polylineRef.current = polys[0];
            }
            if (routes[0].viewport) {
              map.fitBounds(routes[0].viewport);
            }
          }
        })
        .catch((err) => {
          console.warn('[Google Routes] Erreur calcul :', err);
          // Fallback polyline directe
          const poly = new google.maps.Polyline({
            path: [origin, destination],
            geodesic: true,
            strokeColor: '#10b981',
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
          });
          polylineRef.current = poly;
        });
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, routesLib, origin, destination, routeCoordinates]);

  return null;
}

export const GoogleMapsDakarLayer: React.FC<GoogleMapsDakarLayerProps> = ({
  apiKey,
  drivers,
  selectedPickup,
  selectedDestination,
  activeRide,
  assignedDriverLocation,
  center = { lat: 14.7167, lng: -17.4677 },
  zoom = 13,
  onMapClick,
}) => {
  return (
    <APIProvider apiKey={apiKey} version="weekly">
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="YOON_VTC_DAKAR_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        onClick={(e) => {
          if (e.detail.latLng && onMapClick) {
            onMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
          }
        }}
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {/* Tracé routier */}
        <RoutePolyline
          origin={selectedPickup ? { lat: selectedPickup.lat, lng: selectedPickup.lng } : null}
          destination={selectedDestination ? { lat: selectedDestination.lat, lng: selectedDestination.lng } : null}
          routeCoordinates={activeRide?.routeCoordinates}
        />

        {/* Marqueur Passager (Départ) */}
        {selectedPickup && (
          <AdvancedMarker
            position={{ lat: selectedPickup.lat, lng: selectedPickup.lng }}
            title={`Départ : ${selectedPickup.name}`}
          >
            <div className="flex flex-col items-center">
              <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap mb-1">
                📍 DÉPART
              </span>
              <Pin background="#047857" glyphColor="#ffffff" borderColor="#ffffff" />
            </div>
          </AdvancedMarker>
        )}

        {/* Marqueur Destination (Arrivée) */}
        {selectedDestination && (
          <AdvancedMarker
            position={{ lat: selectedDestination.lat, lng: selectedDestination.lng }}
            title={`Destination : ${selectedDestination.name}`}
          >
            <div className="flex flex-col items-center">
              <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-bold rounded shadow-lg whitespace-nowrap mb-1">
                🏁 ARRIVÉE
              </span>
              <Pin background="#e11d48" glyphColor="#ffffff" borderColor="#ffffff" />
            </div>
          </AdvancedMarker>
        )}

        {/* Chauffeurs en ligne */}
        {drivers
          .filter((d) => d.status === 'online')
          .map((d) => (
            <AdvancedMarker
              key={d.id}
              position={{ lat: d.currentLocation.lat, lng: d.currentLocation.lng }}
              title={`${d.fullName} (${d.vehicle.brand} ${d.vehicle.model})`}
            >
              <div className="relative flex items-center justify-center w-8 h-8 bg-slate-900 border-2 border-emerald-400 rounded-full shadow-lg text-emerald-400">
                <span className="text-xs">🚗</span>
                <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
            </AdvancedMarker>
          ))}

        {/* Chauffeur assigné en direct */}
        {assignedDriverLocation && (
          <AdvancedMarker
            position={{ lat: assignedDriverLocation.lat, lng: assignedDriverLocation.lng }}
            title="Chauffeur en approche (GPS Live)"
          >
            <div className="relative flex items-center justify-center w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"></div>
              <div className="w-9 h-9 bg-emerald-600 border-2 border-white rounded-full shadow-2xl flex items-center justify-center text-white z-10 text-sm">
                🚖
              </div>
            </div>
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
};
