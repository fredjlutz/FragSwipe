import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodeAddress } from '../../lib/geocoding';

// Mock the env vars
vi.mock('../../lib/env', () => ({
    env: {
        GOOGLE_MAPS_API_KEY: 'test-api-key',
    },
}));

describe('geocodeAddress', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should throw an error if called in a browser environment', async () => {
        // Temporarily mock window
        const originalWindow = global.window;
        global.window = {} as any;

        await expect(geocodeAddress('123 Test St')).rejects.toThrow(
            'Geocoding must only be called on the server.'
        );

        global.window = originalWindow;
    });

    it('should successfully parse a valid address with a neighborhood', async () => {
        const mockResponse = {
            status: 'OK',
            results: [
                {
                    geometry: {
                        location: { lat: -33.918861, lng: 18.423300 },
                    },
                    address_components: [
                        { long_name: 'Sea Point', types: ['neighborhood', 'political'] },
                        { long_name: 'Cape Town', types: ['locality', 'political'] },
                    ],
                },
            ],
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await geocodeAddress('Sea Point, Cape Town');

        expect(result.latitude).toBe(-33.918861);
        expect(result.longitude).toBe(18.423300);
        expect(result.neighbourhood).toBe('Sea Point');
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('address=Sea%20Point%2C%20Cape%20Town')
        );
    });

    it('should fallback to locality if neighborhood is missing', async () => {
        const mockResponse = {
            status: 'OK',
            results: [
                {
                    geometry: {
                        location: { lat: -33.924868, lng: 18.424055 },
                    },
                    address_components: [
                        { long_name: 'Cape Town', types: ['locality', 'political'] },
                    ],
                },
            ],
        };

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockResponse,
        });

        const result = await geocodeAddress('Cape Town');

        expect(result.neighbourhood).toBe('Cape Town');
    });

    it('should throw an error if the API returns a non-OK status', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ status: 'ZERO_RESULTS', results: [] }),
        });

        await expect(geocodeAddress('Invalid Address 12345')).rejects.toThrow(
            'Geocoding failed: ZERO_RESULTS'
        );
    });

    it('should throw an error if the HTTP request fails', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        await expect(geocodeAddress('Cape Town')).rejects.toThrow(
            'Geocoding HTTP error: 500'
        );
    });
});
