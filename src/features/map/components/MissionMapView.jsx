import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../../../app/config/env.js';

const FALLBACK_STYLE = {
    version: 8,
    sources: {
        osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
        },
    },
    layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

function getMapStyle() {
    if (MAPBOX_ACCESS_TOKEN) return 'mapbox://styles/mapbox/streets-v12';
    return FALLBACK_STYLE;
}

export default function MissionMapView({
    center = { lat: 10.8231, lng: 106.6297 },
    markerPosition,
    zoom = 15,
}) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const fallbackLat = 10.8231;
    const fallbackLng = 106.6297;
    const targetLat = Number(markerPosition?.lat ?? center?.lat ?? fallbackLat);
    const targetLng = Number(markerPosition?.lng ?? center?.lng ?? fallbackLng);
    const safeLat = Number.isFinite(targetLat) ? targetLat : fallbackLat;
    const safeLng = Number.isFinite(targetLng) ? targetLng : fallbackLng;

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN || '';

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: getMapStyle(),
            center: [safeLng, safeLat],
            zoom: Number(zoom) || 15,
            interactive: false,
        });

        map.on('load', () => setIsLoaded(true));

        const marker = new mapboxgl.Marker({ draggable: false, color: '#ef4444' })
            .setLngLat([safeLng, safeLat])
            .addTo(map);

        mapRef.current = map;
        markerRef.current = marker;

        return () => {
            marker.remove();
            map.remove();
            markerRef.current = null;
            mapRef.current = null;
            setIsLoaded(false);
        };
    }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;
        marker.setLngLat([safeLng, safeLat]);
        map.jumpTo({ center: [safeLng, safeLat], zoom: Number(zoom) || 15 });
    }, [safeLat, safeLng, zoom]);

    return (
        <div className="relative h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-1 text-[10px] text-slate-600">Đang tải...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
