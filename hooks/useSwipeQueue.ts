'use client';

import { useState, useCallback, useEffect } from 'react';

export type SwipeListing = {
    id: string;
    seller_id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    tags: string[];
    neighbourhood: string;
    distance_km: number;
    images: string[];
    seller_whatsapp: string;
    seller_name: string;
    created_at: string;
};

interface UseSwipeQueueOptions {
    latitude: number | null;
    longitude: number | null;
    radiusKm?: number;
    category?: string;
}

export function useSwipeQueue({ latitude, longitude, radiusKm = 10, category }: UseSwipeQueueOptions) {
    const [queue, setQueue] = useState<SwipeListing[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);

    // Fetch batch of new cards securely from the Next.js API route
    const fetchBatch = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (latitude !== null) params.append('lat', latitude.toString());
            if (longitude !== null) params.append('lng', longitude.toString());
            params.append('radius', radiusKm.toString());
            if (category) params.append('category', category);

            const res = await fetch(`/api/discover?${params.toString()}`);
            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401) {
                    setHasMore(false);
                }
                throw new Error(data.error || 'Failed to fetch queue');
            }

            if (data.data && data.data.length > 0) {
                setQueue((prev) => [...prev, ...data.data]);
            } else {
                setHasMore(false); // Exhausted matches within this radius/category
            }
        } catch (err: any) {
            setError(err.message);
            if (err.message === 'Unauthorized') {
                setHasMore(false);
            }
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, radiusKm, category, loading, hasMore]);

    // Initial load when component mounts or location/filters change
    useEffect(() => {
        if (queue.length === 0 && hasMore && !loading) {
            fetchBatch();
        }
    }, [latitude, longitude, radiusKm, category, fetchBatch, queue.length, hasMore, loading]);

    // Auto-refetch when queue runs low to prevent loading screens mid-swipe
    useEffect(() => {
        if (queue.length > 0 && queue.length < 3 && hasMore && !loading) {
            fetchBatch();
        }
    }, [queue.length, hasMore, loading, fetchBatch]);

    // Execute a swipe, logging it to the server and removing from local deck
    const swipe = async (id: string, direction: 'left' | 'right', isFavourite = false) => {
        // Optimistic UI update - remove from stack immediately
        setQueue((prev) => prev.filter((item) => item.id !== id));

        try {
            const payload = {
                listing_id: id,
                direction,
                is_favourite: isFavourite || direction === 'right'
            };

            await fetch('/api/swipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
        } catch (err) {
            console.error('Failed to log swipe:', err);
        }
    };

    return { queue, loading, error, hasMore, swipe };
}
