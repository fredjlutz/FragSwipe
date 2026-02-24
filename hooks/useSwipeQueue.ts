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
        if (!latitude || !longitude || loading || !hasMore) return;

        setLoading(true);
        setError(null);

        try {
            let url = `/api/discover?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`;
            if (category) url += `&category=${category}`;

            const res = await fetch(url);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to fetch queue');

            if (data.data && data.data.length > 0) {
                setQueue((prev) => [...prev, ...data.data]);
            } else {
                setHasMore(false); // Exhausted matches within this radius/category
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [latitude, longitude, radiusKm, category, loading, hasMore]);

    // Initial load when location is resolved
    useEffect(() => {
        if (latitude && longitude && queue.length === 0 && hasMore && !loading) {
            fetchBatch();
        }
    }, [latitude, longitude, fetchBatch, queue.length, hasMore, loading]);

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
