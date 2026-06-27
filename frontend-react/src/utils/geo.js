export async function getCurrentCoords(opts = {}) {
    if (!navigator.geolocation) {
        console.warn('Geolocation tidak didukung di browser ini');
        return null;
    }

    const options = {
        timeout: 5000,
        enableHighAccuracy: true,
        ...opts
    };

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                console.warn('Geolocation error:', error);
                resolve(null);
            },
            options
        );
    });
}
