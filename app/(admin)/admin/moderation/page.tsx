'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlertCircle, CheckCircle, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type FlaggedListing = {
    id: string;
    title: string;
    description: string;
    status: string;
    moderation_flag: boolean;
    created_at: string;
    profiles: {
        handle: string | null;
        full_name: string;
    };
};

export default function ModerationQueuePage() {
    const [flaggedQueue, setFlaggedQueue] = useState<FlaggedListing[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('listings')
            .select('id, title, description, status, moderation_flag, created_at, profiles(handle, full_name)')
            .or('moderation_flag.eq.true,status.eq.shadow_banned')
            .order('created_at', { ascending: false });

        setFlaggedQueue(data as unknown as FlaggedListing[] || []);
        setLoading(false);
    };

    const enforceAction = async (id: string, action: 'approve' | 'remove') => {
        try {
            const updates = action === 'approve'
                ? { status: 'active', moderation_flag: false }
                : { status: 'removed', moderation_flag: false };

            await supabase.from('listings').update(updates).eq('id', id);

            // Log the action for audit trails
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('moderation_log').insert({
                    listing_id: id,
                    flagged_reason: 'Admin reviewed from queue',
                    reviewed_by: user.id,
                    reviewed_at: new Date().toISOString(),
                    action_taken: action
                });
            }

            // Optimistically remove from queue UI
            setFlaggedQueue((prev) => prev.filter(item => item.id !== id));
        } catch (err) {
            console.error('Failed to enforce moderation:', err);
            alert('Action failed. Check console.');
        }
    };

    if (loading) {
        return <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-red-500 m-8"></div>;
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Moderation Queue</h1>
                    <p className="text-gray-500 mt-1">Review flagged content and shadow-banned listings caught by webhooks.</p>
                </div>
                <span className="bg-red-100 text-red-700 font-bold px-4 py-2 rounded-full text-sm flex items-center shadow-sm">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {flaggedQueue.length} Pending
                </span>
            </div>

            {flaggedQueue.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900">Queue Clear</h3>
                    <p className="text-gray-500 mt-1">There are no flagged items requiring admin review.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {flaggedQueue.map((item) => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                            <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${item.status === 'shadow_banned' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                                        {item.status === 'shadow_banned' ? 'Shadow Banned' : 'User Flagged'}
                                    </span>
                                    <span className="ml-3 text-sm text-gray-500 font-medium whitespace-nowrap">
                                        ID: {item.id.split('-')[0]}...
                                    </span>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                    {new Date(item.created_at).toLocaleString()}
                                </span>
                            </div>

                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h2>
                                <p className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                                    {item.description}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-medium text-gray-500 flex items-center">
                                        Seller: <span className="text-blue-600 ml-1">@{item.profiles?.handle || item.profiles?.full_name}</span>
                                    </div>

                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => enforceAction(item.id, 'approve')}
                                            className="px-4 py-2 bg-white border border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-lg shadow-sm flex items-center transition"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" /> Approve
                                        </button>
                                        <button
                                            onClick={() => enforceAction(item.id, 'remove')}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-sm flex items-center transition"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete Entry
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
