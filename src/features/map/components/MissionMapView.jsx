import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL } from '../../../app/config/env.js';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

/**
 * Mission Map View - Read-only Mapbox map for displaying mission location
 * @param {Object} props
 * @param {Object} props.center - Center position { lat, lng }
 * @param {Object} props.markerPosition - Marker position { lat, lng }
 * @param {number} props.zoom - Map zoom level (default: 15)
 */
export default function MissionMapView({
    center = { lat: 10.8231, lng: 106.6297 },
    markerPosition,
    zoom = 15,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initialize read-only map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const pos = markerPosition || center;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: MAPBOX_STYLE_URL,
            center: [pos.lng, pos.lat],
            zoom,
            interactive: false, // read-only
        });

        const marker = new mapboxgl.Marker()
            .setLngLat([pos.lng, pos.lat])
            .addTo(map);

        map.on('load', () => setIsLoaded(true));

        mapRef.current = map;
        markerRef.current = marker;

        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update marker position when prop changes
    useEffect(() => {
        if (!mapRef.current || !markerRef.current || !markerPosition) return;

        markerRef.current.setLngLat([markerPosition.lng, markerPosition.lat]);
        mapRef.current.flyTo({ center: [markerPosition.lng, markerPosition.lat] });
    }, [markerPosition]);

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="w-full h-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-1 text-[10px] text-slate-600">Đang tải...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
