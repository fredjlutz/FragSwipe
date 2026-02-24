'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Trash2, Edit3, Pause, Play, Tag } from 'lucide-react';

type Listing = {
    id: string;
    title: string;
    price: number;
    status: 'active' | 'sold' | 'paused' | 'removed' | 'shadow_banned';
    created_at: string;
    moderation_flag: boolean;
};

export default function MyListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchListings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchListings = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { data } = await supabase
                .from('listings')
                .select('id, title, price, status, created_at, moderation_flag')
                .eq('seller_id', session.user.id)
                .neq('status', 'removed') // Don't show hard removed items
                .order('created_at', { ascending: false });

            if (data) setListings(data);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/listings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchListings();
        } catch (e) {
            console.error(e);
        }
    };

    const StatusBadge = ({ status, flag }: { status: string, flag: boolean }) => {
        let color = 'bg-gray-100 text-gray-800';
        let text = status.toUpperCase();

        // Explicit mappings directly from AGENTS.md rules
        if (status === 'shadow_banned' || flag) {
            color = 'bg-orange-100 text-orange-800 border border-orange-200';
            text = 'UNDER REVIEW'; // Never show 'shadow_banned' to user
        } else if (status === 'active') {
            color = 'bg-green-100 text-green-800 border border-green-200';
        } else if (status === 'sold') {
            color = 'bg-gray-200 text-gray-600';
        } else if (status === 'paused') {
            color = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        } else if (status === 'removed') {
            color = 'bg-red-100 text-red-800';
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                {text}
            </span>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center sm:justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                    <p className="mt-2 text-sm text-gray-700">Manage your active inventory, sales, and drafts.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Link
                        href="/sell/new"
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none"
                    >
                        Create new listing
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600"></div>
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center bg-white rounded-xl border border-gray-200 p-12 shadow-sm">
                    <Tag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No listings</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new listing.</p>
                    <div className="mt-6">
                        <Link href="/sell/new" className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                            New Listing
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                    <ul role="list" className="divide-y divide-gray-200">
                        {listings.map((listing) => (
                            <li key={listing.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 text-lg">{listing.title}</span>
                                    <span className="text-gray-500 text-sm mt-1">ZAR {listing.price.toFixed(2)} — Listed on {new Date(listing.created_at).toLocaleDateString()}</span>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <StatusBadge status={listing.status} flag={listing.moderation_flag} />

                                    <div className="flex items-center space-x-2 text-gray-400">
                                        {listing.status === 'active' && (
                                            <>
                                                <button onClick={() => updateStatus(listing.id, 'paused')} title="Pause Listing" className="p-2 hover:bg-yellow-100 hover:text-yellow-700 rounded transition">
                                                    <Pause className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => updateStatus(listing.id, 'sold')} title="Mark as Sold" className="p-2 hover:bg-gray-200 hover:text-gray-800 rounded transition text-xs font-bold leading-none">
                                                    SOLD
                                                </button>
                                            </>
                                        )}
                                        {listing.status === 'paused' && (
                                            <button onClick={() => updateStatus(listing.id, 'active')} title="Reactivate" className="p-2 hover:bg-green-100 hover:text-green-700 rounded transition">
                                                <Play className="w-4 h-4" />
                                            </button>
                                        )}

                                        <button className="p-2 hover:bg-blue-100 hover:text-blue-700 rounded transition">
                                            <Edit3 className="w-4 h-4" />
                                        </button>

                                        <button onClick={() => { if (confirm('Are you sure you want to permanently delete this listing?')) updateStatus(listing.id, 'removed') }} className="p-2 hover:bg-red-100 hover:text-red-700 rounded transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
