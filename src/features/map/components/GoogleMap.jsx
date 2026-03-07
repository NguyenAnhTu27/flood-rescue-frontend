import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_ACCESS_TOKEN } from '../../../app/config/env.js';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function GoogleMap({
    center = { lat: 10.8231, lng: 106.6297 },
    onLocationSelect,
    markerPosition,
    zoom = 15,
}) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!mapRef.current) return;
        if (!MAPBOX_ACCESS_TOKEN) {
            console.warn('Missing VITE_MAPBOX_ACCESS_TOKEN in .env');
            return;
        }

        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

        const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [center.lng, center.lat],
            zoom,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        const marker = new mapboxgl.Marker({ draggable: true })
            .setLngLat([center.lng, center.lat])
            .addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;

        const reverseGeocode = async ({ lat, lng }) => {
            try {
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=vi&country=vn&access_token=${MAPBOX_ACCESS_TOKEN}`;
                const res = await fetch(url);
                const data = await res.json();
                const address = data?.features?.[0]?.place_name || null;

                onLocationSelect?.({ lat, lng, address });
            } catch {
                onLocationSelect?.({ lat, lng, address: null });
            }
        };

        marker.on('dragend', () => {
            const { lat, lng } = marker.getLngLat();
            reverseGeocode({ lat, lng });
        });

        map.on('click', (e) => {
            const { lat, lng } = e.lngLat;
            marker.setLngLat([lng, lat]);
            reverseGeocode({ lat, lng });
        });

        map.on('load', () => setIsLoaded(true));

        return () => {
            marker.remove();
            map.remove();
        };
    }, []);

    useEffect(() => {
        const map = mapInstanceRef.current;
        const marker = markerRef.current;
        if (!map || !marker || !markerPosition) return;

        const current = marker.getLngLat();
        if (
            Math.abs(current.lat - markerPosition.lat) < 0.0001 &&
            Math.abs(current.lng - markerPosition.lng) < 0.0001
        ) {
            return;
        }

        marker.setLngLat([markerPosition.lng, markerPosition.lat]);
        map.easeTo({ center: [markerPosition.lng, markerPosition.lat], duration: 500 });
    }, [markerPosition]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full rounded-xl" />
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 rounded-xl">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
                        <p className="mt-2 text-sm text-slate-600">Đang tải bản đồ...</p>
                    </div>
                </div>
            )}
        </div>
    );
}