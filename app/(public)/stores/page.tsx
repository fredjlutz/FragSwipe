import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Store, MapPin, ExternalLink } from 'lucide-react';

export default async function StoresDirectoryPage() {
    const supabase = createClient();

    // Fetch all profiles that have the 'store' subscription tier
    const { data: stores, error } = await supabase
        .from('profiles')
        .select('handle, full_name, neighbourhood, store_logo, store_description')
        .eq('subscription_tier', 'store')
        // We strictly only show stores that have set up a handle publicly
        .not('handle', 'is', null)
        .order('created_at', { ascending: false });

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                        Local Frag Stores
                    </h1>
                    <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
                        Discover premium coral vendors, verified local shops, and massive collectors running on FragSwipe.
                    </p>
                </div>

                {error ? (
                    <div className="text-center p-8 bg-red-50 text-red-600 rounded-xl">
                        Failed to load stores directory.
                    </div>
                ) : !stores || stores.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-3xl mx-auto">
                        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Stores Found</h2>
                        <p className="text-gray-500">
                            Be the first to upgrade your account and claim your public storefront URL!
                        </p>
                        <Link href="/subscribe" className="mt-6 inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition">
                            Open a Store
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stores.map((store) => (
                            <Link
                                key={store.handle}
                                href={`/stores/${store.handle}`}
                                className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col"
                            >
                                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                                    {/* If we had banner support in dir, render it here */}
                                </div>

                                <div className="px-6 pb-6 flex-1 flex flex-col items-center -mt-12 text-center">
                                    <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md mb-4 relative z-10 group-hover:scale-105 transition-transform">
                                        {store.store_logo ? (
                                            <img src={store.store_logo} alt={store.full_name} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                                                {store.full_name.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900">{store.full_name}</h3>
                                    <p className="text-blue-600 font-medium text-sm flex items-center justify-center mt-1">
                                        @{store.handle}
                                    </p>

                                    <div className="mt-4 text-sm text-gray-600 line-clamp-2">
                                        {store.store_description || 'Premium local coral vendor.'}
                                    </div>

                                    <div className="mt-auto pt-6 w-full flex justify-between items-center text-sm">
                                        <span className="flex items-center text-gray-500">
                                            <MapPin className="w-4 h-4 mr-1 shrink-0" />
                                            {store.neighbourhood}
                                        </span>
                                        <span className="text-blue-600 font-semibold group-hover:underline flex items-center">
                                            Visit Store <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
