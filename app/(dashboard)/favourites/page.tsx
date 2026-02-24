'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, MessageCircle, AlertCircle, ShoppingBag } from 'lucide-react';

type FavouriteListing = {
    id: string; // Favourites table ID
    listing_id: string;
    created_at: string;
    listings: {
        id: string;
        title: string;
        price: number;
        status: string;
        neighbourhood: string;
        profiles: {
            whatsapp_number: string;
        };
        listing_images: { storage_path: string }[];
    };
};

export default function FavouritesPage() {
    const [favourites, setFavourites] = useState<FavouriteListing[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchFavourites();

        // Setup Realtime listener for the 'listings' table
        const channel = supabase.channel('public:listings')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'listings' },
                (payload) => {
                    // If a listing in our Favourites array gets updated (e.g. marked 'sold' or 'paused')
                    // Optimistically update the UI to reflect it immediately
                    setFavourites((prev) =>
                        prev.map(fav => {
                            if (fav.listings.id === payload.new.id) {
                                return {
                                    ...fav,
                                    listings: {
                                        ...fav.listings,
                                        status: payload.new.status,
                                    }
                                };
                            }
                            return fav;
                        })
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchFavourites = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
            // Query favourites, joining listings, profiles (for seller whatsapp), and one cover image
            const { data } = await supabase
                .from('favourites')
                .select(`
          id,
          listing_id,
          created_at,
          listings (
            id,
            title,
            price,
            status,
            neighbourhood,
            profiles ( whatsapp_number ),
            listing_images ( storage_path )
          )
        `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (data) {
                setFavourites(data as unknown as FavouriteListing[]);
            }
        }
        setLoading(false);
    };

    const removeFavourite = async (id: string) => {
        // Optimistic remove
        setFavourites((prev) => prev.filter(f => f.id !== id));

        await supabase
            .from('favourites')
            .delete()
            .eq('id', id);
    };

    const generateWhatsAppLink = (listing: any) => {
        const number = listing.profiles?.whatsapp_number || '';
        const message = encodeURIComponent(`Hi, I'm interested in your ${listing.title} on FragSwipe.`);
        return `https://wa.me/${number}?text=${message}`;
    };

    // Helper to grab the first image reliably
    const getCoverImageUri = (images: any[]) => {
        if (!images || images.length === 0) return 'https://via.placeholder.com/300?text=No+Image';
        const { data } = supabase.storage.from('listing_images').getPublicUrl(images[0].storage_path);
        return data.publicUrl;
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh]">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">My Favourites</h1>
            <p className="text-gray-500 mb-8">Items you've liked from your discovery feed.</p>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-500"></div>
                </div>
            ) : favourites.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No favourites yet</h3>
                    <p className="mt-1 text-gray-500 text-sm">Right-swipe or hit the heart on listings you like, and they'll show up here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favourites.map((fav) => {
                        const l = fav.listings;
                        const isAvailable = l.status === 'active';

                        return (
                            <div key={fav.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row relative">
                                <div className="sm:w-1/3 h-48 sm:h-auto shrink-0 relative">
                                    <img
                                        src={getCoverImageUri(l.listing_images)}
                                        alt={l.title}
                                        className={`w-full h-full object-cover ${!isAvailable ? 'grayscale opacity-60' : ''}`}
                                    />
                                    {!isAvailable && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <span className="bg-black/80 text-white font-bold px-3 py-1 rounded text-sm uppercase tracking-wide">
                                                {l.status}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className={`font-bold text-lg leading-tight ${!isAvailable ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                {l.title}
                                            </h3>
                                            <button
                                                onClick={() => removeFavourite(fav.id)}
                                                className="text-gray-400 hover:text-red-500 p-1 -mr-1 transition"
                                            >
                                                <Heart className="w-5 h-5 fill-current" />
                                            </button>
                                        </div>
                                        <p className={`text-blue-600 font-bold mt-1 ${!isAvailable && 'text-gray-400'}`}>
                                            R {l.price.toFixed(0)}
                                        </p>
                                        <p className="text-gray-500 text-xs mt-2 flex items-center">
                                            <ShoppingBag className="w-3 h-3 mr-1" />
                                            {l.neighbourhood}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        {isAvailable ? (
                                            <a
                                                href={generateWhatsAppLink(l)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-center py-2 px-4 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                                Chat on WhatsApp
                                            </a>
                                        ) : (
                                            <div className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                                                <AlertCircle className="w-4 h-4 mr-2" />
                                                No longer available
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
