import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '../../../app/config/env.js';
import 'mapbox-gl/dist/mapbox-gl.css';

/**
 * Mission Map View - Read-only map for displaying mission location
 * @param {Object} props
 * @param {Object} props.center - Center position { lat, lng }
 * @param {Object} props.markerPosition - Marker position { lat, lng }
 * @param {number} props.zoom - Map zoom level (default: 15)
 */
export default function MissionMapView({
    center = { lat: 10.8231, lng: 106.6297 },
    markerPosition,
    zoom = 15
}) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize Mapbox map (read-only)
    useEffect(() => {
        if (!mapRef.current) return;

        if (!MAPBOX_ACCESS_TOKEN) {
            console.warn('Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in .env');
            return;
        }

        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        const initialPosition = markerPosition || center;

        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [initialPosition.lng, initialPosition.lat],
            zoom,
            interactive: false,
        });

        const marker = new mapboxgl.Marker({ draggable: false })
            .setLngLat([initialPosition.lng, initialPosition.lat])
            .addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;

        map.on('load', () => setIsLoaded(true));

        return () => {
            marker.remove();
            map.remove();
        };
    }, []);

    // Update marker position when prop changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (!map || !marker || !markerPosition) return;

        marker.setLngLat([markerPosition.lng, markerPosition.lat]);
        map.easeTo({ center: [markerPosition.lng, markerPosition.lat], duration: 500 });
    }, [markerPosition]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                        <p className="mt-1 text-[10px] text-slate-600">Đang tải...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
