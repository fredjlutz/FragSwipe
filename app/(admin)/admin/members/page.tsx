'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, ShieldOff, Search } from 'lucide-react';

type Member = {
    id: string;
    full_name: string;
    handle: string | null;
    whatsapp_number: string;
    role: string;
    subscription_tier: string;
    is_banned: boolean;
    created_at: string;
};

export default function MembersManagementPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const supabase = createClient();

    useEffect(() => {
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        setMembers(data as Member[] || []);
        setLoading(false);
    };

    const toggleBan = async (id: string, currentStatus: boolean) => {
        const confirmMessage = currentStatus
            ? "Are you sure you want to unban this user? They will regain access to the platform."
            : "Are you sure you want to ban this user? They will be immediately logged out and blocked by the Middleware.";

        if (!window.confirm(confirmMessage)) return;

        try {
            const newStatus = !currentStatus;
            await supabase.from('profiles').update({ is_banned: newStatus }).eq('id', id);

            // Optimistic UI update
            setMembers(prev => prev.map(m => m.id === id ? { ...m, is_banned: newStatus } : m));
        } catch (err) {
            console.error('Failed to update ban status:', err);
            alert('Failed to update ban status.');
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.id.includes(searchTerm)
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Members</h1>
                    <p className="text-gray-500 mt-1">Manage user access and platform permissions.</p>
                </div>

                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search name, handle, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-80 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 border-b border-gray-200 text-sm">
                                <th className="p-4 font-bold">User</th>
                                <th className="p-4 font-bold">Contact</th>
                                <th className="p-4 font-bold">Role / Tier</th>
                                <th className="p-4 font-bold">Status</th>
                                <th className="p-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">Loading members...</td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">No members found.</td>
                                </tr>
                            ) : (
                                filteredMembers.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50 transition">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{member.full_name}</div>
                                            <div className="text-sm text-gray-500">{member.handle ? `@${member.handle}` : <span className="italic">No handle</span>}</div>
                                            <div className="text-xs text-gray-400 mt-1 font-mono">{member.id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-700">
                                            {member.whatsapp_number}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${member.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                                    {member.role}
                                                </span>
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${member.subscription_tier === 'store' ? 'bg-indigo-100 text-indigo-700' :
                                                    member.subscription_tier === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {member.subscription_tier}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {member.is_banned ? (
                                                <span className="inline-flex items-center text-red-600 bg-red-100 px-3 py-1 rounded-full text-sm font-bold">
                                                    <ShieldOff className="w-4 h-4 mr-1" /> Banned
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm font-bold">
                                                    <Shield className="w-4 h-4 mr-1" /> Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => toggleBan(member.id, member.is_banned)}
                                                className={`text-sm font-bold px-4 py-2 rounded-lg transition ${member.is_banned
                                                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                                                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                                                    }`}
                                            >
                                                {member.is_banned ? 'Unban User' : 'Ban User'}
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
