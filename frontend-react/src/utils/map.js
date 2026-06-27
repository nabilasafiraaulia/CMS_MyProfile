import * as leaflet from 'leaflet';

const L =
  window.L ??
  leaflet?.default ??
  leaflet?.L ??
  leaflet;

export async function createMap(el, opts = {}) {
    if (!L?.map) {
        console.error('[Leaflet] L.map missing. leaflet =', leaflet);
        throw new Error('Leaflet L.map missing');
    }

    const { center = [-7.447, 109.236], zoom = 6 } = opts;

    const map = L.map(el).setView(center, zoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    return map;
}

export function photoIcon() {
    return L.divIcon({
        html: `<div class="custom-map-marker">📍</div>`,
        className: 'custom-map-marker-wrapper',
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -36]
    });
}
