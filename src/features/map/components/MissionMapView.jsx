import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../../../app/config/env.js';

const HAS_MAPBOX_TOKEN = Boolean(String(MAPBOX_ACCESS_TOKEN || '').trim());

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
    if (HAS_MAPBOX_TOKEN) return 'mapbox://styles/mapbox/streets-v12';
    return FALLBACK_STYLE;
}

function buildStaticMapUrl({ lat, lng }) {
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    const delta = 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${safeLng - delta}%2C${safeLat - delta}%2C${safeLng + delta}%2C${safeLat + delta}&layer=mapnik&marker=${safeLat}%2C${safeLng}`;
}

function StaticMapFallback({ target }) {
    return (
        <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <iframe
                title="static-map"
                src={buildStaticMapUrl(target)}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="absolute left-3 top-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow-sm">
                Chua cau hinh Mapbox token. Dang hien thi ban do xem tam thoi.
            </div>
        </div>
    );
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
    const target = useMemo(() => markerPosition || center, [center, markerPosition]);

    useEffect(() => {
        if (!HAS_MAPBOX_TOKEN) return;
        if (!containerRef.current || mapRef.current) return;
        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        const map = new mapboxgl.Map({
            container: containerRef.current,
            style: getMapStyle(),
            center: [Number(target.lng), Number(target.lat)],
            zoom: Number(zoom) || 15,
            interactive: false,
        });

        map.on('load', () => setIsLoaded(true));

        const marker = new mapboxgl.Marker({ draggable: false, color: '#ef4444' })
            .setLngLat([Number(target.lng), Number(target.lat)])
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
    }, [target, zoom]);

    useEffect(() => {
        const map = mapRef.current;
        const marker = markerRef.current;
        if (!map || !marker) return;
        if (!Number.isFinite(Number(target.lat)) || !Number.isFinite(Number(target.lng))) return;
        const lng = Number(target.lng);
        const lat = Number(target.lat);
        marker.setLngLat([lng, lat]);
        map.jumpTo({ center: [lng, lat] });
    }, [target]);

    return (
        <div className="relative h-full w-full">
            {!HAS_MAPBOX_TOKEN ? (
                <StaticMapFallback target={target} />
            ) : (
                <div ref={containerRef} className="h-full w-full" />
            )}
            {HAS_MAPBOX_TOKEN && !isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                    <div className="text-center">
                        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-1 text-[10px] text-slate-600">Dang tai...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
