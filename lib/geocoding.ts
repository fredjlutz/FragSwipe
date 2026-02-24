import { env } from './env';

export interface GeocodeResult {
    latitude: number;
    longitude: number;
    neighbourhood: string;
}

/**
 * Validates an address using the Google Maps Geocoding API.
 * Ensures this is only run server-side to protect the API key.
 * 
 * @param address The raw user-provided address string
 * @returns GeocodeResult containing lat/lng and parsed neighbourhood
 * @throws Error if the API request fails or returns zero results
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
    if (typeof window !== 'undefined') {
        throw new Error('Geocoding must only be called on the server.');
    }

    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${env.GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Geocoding HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;

    // Extract neighbourhood, fallback to locality, then sublocality
    let neighbourhood = '';
    for (const component of result.address_components) {
        if (component.types.includes('neighborhood')) {
            neighbourhood = component.long_name;
            break;
        }
    }

    if (!neighbourhood) {
        for (const component of result.address_components) {
            if (
                component.types.includes('locality') ||
                component.types.includes('sublocality') ||
                component.types.includes('administrative_area_level_2')
            ) {
                neighbourhood = component.long_name;
                break;
            }
        }
    }

    return {
        latitude: location.lat,
        longitude: location.lng,
        neighbourhood: neighbourhood || 'Unknown Area',
    };
}
