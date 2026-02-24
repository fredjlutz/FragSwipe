'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, AlertTriangle, ExternalLink, Search } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

type ListingRaw = {
    id: string;
    title: string;
    price: number;
    status: string;
    category: string;
    created_at: string;
    profiles: {
        handle: string | null;
        full_name: string;
    };
};

export default function GlobalListingsPage() {
    const [listings, setListings] = useState<ListingRaw[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchListings();
    }, [statusFilter]);

    const fetchListings = async () => {
        setLoading(true);
        let query = supabase
            .from('listings')
            .select('id, title, price, status, category, created_at, profiles(handle, full_name)')
            .order('created_at', { ascending: false })
            .limit(100);

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        const { data } = await query;
        setListings(data as unknown as ListingRaw[] || []);
        setLoading(false);
    };

    const performHardDelete = async (id: string, title: string) => {
        const confirmation = window.prompt(`DANGER: This action is irreversible and violates standard soft-delete rules. Type "${title}" to confirm permanent deletion.`);

        if (confirmation !== title) {
            alert('Delete cancelled. Name did not match.');
            return;
        }

        try {
            // NOTE: RLS blocks standard users from Hard Deleting. Admins bypass.
            // But standard supabase client applies RLS based on auth JWT role.
            // Easiest is to send an authenticated request to our own API or trust our Admin RLS policies allow True Deletes.
            // Assuming Admin role policy allows `DELETE` explicitly in Supabase:

            const { error } = await supabase.from('listings').delete().eq('id', id);

            if (error) throw error;

            setListings(prev => prev.filter(l => l.id !== id));
            alert('Listing permanently destroyed.');

        } catch (err: any) {
            console.error(err);
            alert(`Hard delete strictly denied or failed: ${err.message}`);
        }
    };

    const filtered = listings.filter(l =>
        l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.id.includes(searchTerm) ||
        l.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Global Inventory</h1>
                    <p className="text-gray-500 mt-1">Authoritative view of all listings on the platform.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search title, ID, or seller..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-64 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-200 rounded-lg py-2 px-4 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer bg-white"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="sold">Sold</option>
                        <option value="shadow_banned">Shadow Banned</option>
                        <option value="removed">Removed (Soft Delete)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-sm">
                                <th className="p-4 font-bold w-1/3">Listing Details</th>
                                <th className="p-4 font-bold">Seller</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold">Listed On</th>
                                <th className="p-4 font-bold text-right">Danger Zone</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">Loading inventory...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">No listings found matching criteria.</td>
                                </tr>
                            ) : (
                                filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition group">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 line-clamp-1">{item.title}</div>
                                            <div className="text-sm text-blue-600 font-bold mt-1">R {item.price.toFixed(0)}</div>
                                            <div className="text-xs text-gray-400 mt-1 font-mono flex items-center">
                                                {item.id.substring(0, 12)}...
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-gray-700">{item.profiles?.full_name}</span>
                                            <br />
                                            <span className="text-xs text-gray-500">{item.profiles?.handle ? `@${item.profiles?.handle}` : ''}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    item.status === 'sold' ? 'bg-purple-100 text-purple-700' :
                                                        item.status === 'shadow_banned' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => performHardDelete(item.id, item.title)}
                                                className="text-red-400 hover:text-white hover:bg-red-600 p-2 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                title="Irreversible Hard Delete"
                                            >
                                                <Trash2 className="w-5 h-5 mx-auto" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
