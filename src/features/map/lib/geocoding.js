import { MAPBOX_ACCESS_TOKEN } from '../../../app/config/env.js';

async function reverseGeocodeByMapbox(lat, lng) {
    if (!MAPBOX_ACCESS_TOKEN) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(String(lng))},${encodeURIComponent(String(lat))}.json?language=vi&country=vn&limit=1&access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.features?.[0]?.place_name || null;
}

async function forwardGeocodeByMapbox(query) {
    if (!MAPBOX_ACCESS_TOKEN) return null;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(String(query))}.json?language=vi&country=vn&limit=1&access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const feature = json?.features?.[0];
    const center = Array.isArray(feature?.center) ? feature.center : null;
    if (!center || center.length < 2) return null;
    return {
        lat: Number(center[1]),
        lng: Number(center[0]),
        address: feature?.place_name || null,
    };
}

async function searchAddressSuggestionsByMapbox(query, limit = 5) {
    if (!MAPBOX_ACCESS_TOKEN) return [];
    const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(String(query))}.json?language=vi&country=vn&autocomplete=true&limit=${safeLimit}&access_token=${encodeURIComponent(MAPBOX_ACCESS_TOKEN)}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const features = Array.isArray(json?.features) ? json.features : [];
    return features
        .map((feature) => {
            const center = Array.isArray(feature?.center) ? feature.center : null;
            if (!center || center.length < 2) return null;
            const lat = Number(center[1]);
            const lng = Number(center[0]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
                lat,
                lng,
                address: feature?.place_name || null,
            };
        })
        .filter(Boolean);
}

async function reverseGeocodeByOsm(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lng))}&accept-language=vi`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json?.display_name || null;
}

async function forwardGeocodeByOsm(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(String(query))}&accept-language=vi&limit=1`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    const item = Array.isArray(json) ? json[0] : null;
    if (!item) return null;
    const lat = Number(item?.lat);
    const lng = Number(item?.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
        lat,
        lng,
        address: item?.display_name || null,
    };
}

async function searchAddressSuggestionsByOsm(query, limit = 5) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(String(query))}&accept-language=vi&limit=${safeLimit}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const json = await response.json();
    const rows = Array.isArray(json) ? json : [];
    return rows
        .map((item) => {
            const lat = Number(item?.lat);
            const lng = Number(item?.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return {
                lat,
                lng,
                address: item?.display_name || null,
            };
        })
        .filter(Boolean);
}

export async function reverseGeocodeAddress(lat, lng) {
    const nLat = Number(lat);
    const nLng = Number(lng);
    if (!Number.isFinite(nLat) || !Number.isFinite(nLng)) return null;

    try {
        const mapboxAddress = await reverseGeocodeByMapbox(nLat, nLng);
        if (mapboxAddress) return mapboxAddress;
    } catch {
        // Ignore and continue to fallback.
    }

    try {
        return await reverseGeocodeByOsm(nLat, nLng);
    } catch {
        return null;
    }
}

export async function forwardGeocodeAddress(query) {
    const input = String(query || '').trim();
    if (!input) return null;

    try {
        const result = await forwardGeocodeByMapbox(input);
        if (result) return result;
    } catch {
        // Ignore and continue to fallback.
    }

    try {
        return await forwardGeocodeByOsm(input);
    } catch {
        return null;
    }
}

export async function searchAddressSuggestions(query, limit = 5) {
    const input = String(query || '').trim();
    if (!input) return [];

    try {
        const results = await searchAddressSuggestionsByMapbox(input, limit);
        if (Array.isArray(results) && results.length > 0) return results;
    } catch {
        // Ignore and continue to fallback.
    }

    try {
        return await searchAddressSuggestionsByOsm(input, limit);
    } catch {
        return [];
    }
}
