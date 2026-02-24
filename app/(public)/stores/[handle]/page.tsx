/* eslint-disable @next/next/no-img-element */
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { MapPin, MessageCircle, Info } from 'lucide-react';

export default async function SingleStorePage({ params }: { params: { handle: string } }) {
    const supabase = createClient();

    // 1. Resolve Store Profile
    const { data: store, error: storeError } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', params.handle)
        .eq('subscription_tier', 'store')
        .single();

    if (storeError || !store) {
        notFound();
    }

    // 2. Fetch Active Listings belonging to this specific store
    // To avoid geometry bleeding, we specifically select fields
    const { data: rawListings } = await supabase
        .from('listings')
        .select('id, title, price, category, tags, status, created_at')
        .eq('seller_id', store.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    // 3. Fetch Images for those listings
    const listings = rawListings || [];
    const listingIds = listings.map((l: { id: string }) => l.id);

    const imagesMap: Record<string, string> = {};
    if (listingIds.length > 0) {
        const { data: imagesData } = await supabase
            .from('listing_images')
            .select('listing_id, storage_path')
            .in('listing_id', listingIds)
            .order('display_order', { ascending: true }); // Only need the cover image

        if (imagesData) {
            imagesData.forEach((img: { listing_id: string; storage_path: string }) => {
                if (!imagesMap[img.listing_id]) {
                    const { data } = supabase.storage.from('listing_images').getPublicUrl(img.storage_path);
                    imagesMap[img.listing_id] = data.publicUrl;
                }
            });
        }
    }

    const storeWaMessage = encodeURIComponent(`Hi, I'm reaching out from your FragSwipe Store page.`);
    const storeLink = `https://wa.me/${store.whatsapp_number}?text=${storeWaMessage}`;

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Heavy Branding Banner */}
            <div className="w-full h-64 md:h-80 bg-gray-900 relative">
                {store.store_banner ? (
                    <img src={store.store_banner} alt="Store Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-800 to-indigo-900 opacity-90" />
                )}
                <div className="absolute inset-0 bg-black/20" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">

                {/* Store Header Info Plate */}
                <div className="relative -mt-24 sm:-mt-32 max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left">

                    <div className="w-32 h-32 sm:w-40 sm:h-40 shrink-0 bg-white rounded-2xl p-2 shadow-lg z-10 -mt-16 sm:mt-0 mb-4 sm:mb-0 sm:mr-8 ring-4 ring-white">
                        {store.store_logo ? (
                            <img src={store.store_logo} alt={store.full_name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                            <div className="w-full h-full rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-5xl">
                                {store.full_name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <div className="flex-1">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">{store.full_name}</h1>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm">
                            <span className="font-semibold text-blue-600">@{store.handle}</span>
                            <span className="text-gray-400">•</span>
                            <span className="flex items-center text-gray-600">
                                <MapPin className="w-4 h-4 mr-1" />
                                {store.neighbourhood}
                            </span>
                        </div>

                        <p className="mt-4 text-gray-600 leading-relaxed max-w-2xl text-justify">
                            {store.store_description || "Welcome to our store. We specialize in locally grown, healthy coral frags."}
                        </p>

                        <div className="mt-6 flex justify-center sm:justify-start">
                            <a
                                href={storeLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-sm transition-transform hover:scale-105"
                            >
                                <MessageCircle className="w-5 h-5 mr-2" />
                                Contact Store
                            </a>
                        </div>
                    </div>
                </div>

                {/* Listings Grid */}
                <div className="mt-16 sm:mt-24">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 border-b-4 border-blue-600 pb-1">
                            Store Inventory
                        </h2>
                        <span className="bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1 rounded-full">
                            {listings.length} Active Items
                        </span>
                    </div>

                    {listings.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
                            <Info className="w-12 h-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900">No active listings</h3>
                            <p className="text-gray-500 mt-2">Check back later or contact the seller directly.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {listings.map((listing: { id: string; category: string; title: string; price: number }) => (
                                <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition">
                                    <div className="aspect-[4/5] bg-gray-100 relative">
                                        <img
                                            src={imagesMap[listing.id] || 'https://via.placeholder.com/300x400?text=No+Image'}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm uppercase">
                                            {listing.category.replace('_', ' ')}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{listing.title}</h3>
                                        <p className="text-blue-600 font-bold mt-auto pt-2">R {listing.price.toFixed(0)}</p>

                                        <a
                                            href={`https://wa.me/${store.whatsapp_number}?text=${encodeURIComponent(`Hi, I'm interested in your ${listing.title} listed on your store page.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 w-full bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 font-semibold py-2 px-3 rounded-lg flex items-center justify-center text-sm transition"
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2 text-green-500" /> WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
