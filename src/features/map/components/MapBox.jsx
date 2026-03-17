import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE_URL } from '../../../app/config/env.js';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

/**
 * Mapbox Map Component (drop-in replacement for the old GoogleMap)
 * @param {Object} props
 * @param {Object} props.center - Initial center { lat, lng }
 * @param {Function} props.onLocationSelect - Callback when location is selected { lat, lng, address }
 * @param {Object} props.markerPosition - Current marker position { lat, lng }
 * @param {number} props.zoom - Map zoom level (default: 15)
 */
export default function MapBox({
    center = { lat: 10.8231, lng: 106.6297 },
    onLocationSelect,
    markerPosition,
    zoom = 15,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Reverse geocode via Mapbox Geocoding API
    const reverseGeocode = useCallback(
        async (lat, lng) => {
            if (!onLocationSelect) return;
            try {
                const res = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}&language=vi&limit=1`,
                );
                const data = await res.json();
                const address = data.features?.[0]?.place_name ?? null;
                onLocationSelect({ lat, lng, address });
            } catch {
                onLocationSelect({ lat, lng, address: null });
            }
        },
        [onLocationSelect],
    );

    // Initialize map once
    useEffect(() => {
        if (!MAPBOX_ACCESS_TOKEN || !containerRef.current || mapRef.current) return;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: MAPBOX_STYLE_URL,
            center: [center.lng, center.lat],
            zoom,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const marker = new mapboxgl.Marker({ draggable: !!onLocationSelect })
            .setLngLat([center.lng, center.lat])
            .addTo(map);

        if (onLocationSelect) {
            marker.on('dragend', () => {
                const { lng, lat } = marker.getLngLat();
                reverseGeocode(lat, lng);
            });

            map.on('click', (e) => {
                const { lng, lat } = e.lngLat;
                marker.setLngLat([lng, lat]);
                reverseGeocode(lat, lng);
            });
        }

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

    // Sync marker position from props (e.g. GPS)
    useEffect(() => {
        if (!mapRef.current || !markerRef.current || !markerPosition) return;

        const cur = markerRef.current.getLngLat();
        if (
            Math.abs(cur.lat - markerPosition.lat) < 0.0001 &&
            Math.abs(cur.lng - markerPosition.lng) < 0.0001
        )
            return;

        markerRef.current.setLngLat([markerPosition.lng, markerPosition.lat]);
        mapRef.current.flyTo({ center: [markerPosition.lng, markerPosition.lat] });
    }, [markerPosition]);

    if (!MAPBOX_ACCESS_TOKEN) {
        return (
            <div className="relative w-full h-full bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                <div className="text-center p-4">
                    <p className="text-sm font-semibold text-slate-700">Chưa cấu hình bản đồ</p>
                    <p className="mt-1 text-xs text-slate-500">Vui lòng thêm VITE_MAPBOX_ACCESS_TOKEN vào file .env</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-slate-100 rounded-xl">
            <div ref={containerRef} className="w-full h-full rounded-xl" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 rounded-xl backdrop-blur-sm z-10">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-2 text-sm font-medium text-slate-700">Đang tải bản đồ...</p>
                    </div>
                </div>
            )}
        </div>
    );
}