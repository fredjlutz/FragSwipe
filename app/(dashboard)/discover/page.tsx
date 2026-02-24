'use client';

import { useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useSwipeQueue } from '@/hooks/useSwipeQueue';
import ListingSwipeCard from '@/components/swipe/ListingSwipeCard';
import { Filter, Settings2, Ghost, Map } from 'lucide-react';
import { listingCategories } from '@/lib/validation/listingSchema';

export default function DiscoverPage() {
    const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();

    const [filterRadius, setFilterRadius] = useState<number>(25);
    const [filterCategory, setFilterCategory] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Pre-fetch queue based on physical location constraints
    const { queue, loading: queueLoading, error: queueError, hasMore, swipe } = useSwipeQueue({
        latitude,
        longitude,
        radiusKm: filterRadius,
        category: filterCategory || undefined,
    });

    if (geoLoading) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center">
                <div className="animate-pulse bg-blue-100 p-4 rounded-full mb-4">
                    <Map className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-500 font-medium">Resolving your location for local corals...</p>
            </div>
        );
    }

    if (geoError) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-red-50 p-6 rounded-2xl max-w-sm">
                    <Settings2 className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-900">Location Required</h2>
                    <p className="mt-2 text-sm text-gray-600">{geoError}</p>
                    <p className="mt-4 text-xs text-gray-500">
                        FragSwipe needs your location to find nearby listings securely without sharing your exact address. Please enable it in your browser.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-[calc(100vh-64px)] overflow-hidden flex flex-col items-center bg-gray-50">
            {/* Top Bar */}
            <div className="w-full max-w-md p-4 flex justify-between items-center z-10">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Discover</h1>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50'}`}
                >
                    <Filter className="w-5 h-5" />
                </button>
            </div>

            {/* Filter Drawer */}
            {showFilters && (
                <div className="w-full max-w-md bg-white border-b border-gray-200 px-6 py-4 z-20 shadow-sm relative">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold flex justify-between">
                                <span>Search Radius</span>
                                <span className="text-blue-600">{filterRadius} km</span>
                            </label>
                            <input
                                type="range"
                                min="5"
                                max="100"
                                step="5"
                                value={filterRadius}
                                onChange={(e) => setFilterRadius(Number(e.target.value))}
                                className="w-full mt-2 accent-blue-600"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold block mb-2">Category Filter</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full border-gray-300 rounded-md text-sm p-2 bg-gray-50 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none capitalize"
                            >
                                <option value="">All Categories</option>
                                {listingCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Swipe Stack Container */}
            <div className="flex-1 w-full flex items-center justify-center relative px-4 pb-20 mt-4 md:mt-10">
                {queueError ? (
                    <div className="text-red-500 text-center bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 max-w-sm">
                        Failed to load queue: {queueError}
                    </div>
                ) : queue.length === 0 && !hasMore ? (
                    <div className="text-center flex flex-col items-center p-8 bg-white shadow-xl border border-gray-100 rounded-3xl max-w-sm w-full">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Ghost className="w-8 h-8 text-gray-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">You're all caught up!</h2>
                        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
                            There are no more active listings within {filterRadius}km.
                            Check back later or expand your search radius.
                        </p>
                        <button
                            onClick={() => setFilterRadius(prev => prev + 25)}
                            className="mt-6 px-6 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-full hover:bg-blue-100 transition-colors text-sm border border-blue-200"
                        >
                            Expand to {filterRadius + 25}km
                        </button>
                    </div>
                ) : (
                    <div className="relative w-full max-w-sm h-[600px]">
                        {queueLoading && queue.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white rounded-3xl shadow-md border border-gray-100 z-0">
                                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                            </div>
                        )}

                        {/* 
                Render from back to front so the first item is on top 
                We reverse the array visually but keep the logic intact 
            */}
                        {[...queue].reverse().map((listing, index) => {
                            const isActive = index === queue.length - 1; // Top card
                            return (
                                <div key={listing.id} className={!isActive ? "pointer-events-none" : ""}>
                                    <ListingSwipeCard
                                        listing={listing}
                                        active={isActive}
                                        onSwipe={swipe}
                                        sellerWhatsApp={listing.seller_whatsapp}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}


