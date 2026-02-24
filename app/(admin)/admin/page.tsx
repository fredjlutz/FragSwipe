'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Users, LayoutList, AlertTriangle, TrendingUp } from 'lucide-react';

type Stats = {
    totalUsers: number;
    activeListings: number;
    shadowBanned: number;
    soldItems: number;
};

type CategoryStat = {
    category: string;
    count: number;
};

export default function AdminOverviewPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [chartData, setChartData] = useState<CategoryStat[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchStats() {
            // Fetch aggregate counts in parallel
            const [
                { count: totalUsers },
                { count: activeListings },
                { count: shadowBanned },
                { count: soldItems },
                { data: categoryData }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }),
                supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'shadow_banned'),
                supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
                supabase.from('listings').select('category').eq('status', 'active') // Fetching all active to group client-side
            ]);

            setStats({
                totalUsers: totalUsers || 0,
                activeListings: activeListings || 0,
                shadowBanned: shadowBanned || 0,
                soldItems: soldItems || 0,
            });

            // Group categories for chart
            if (categoryData) {
                const counts = categoryData.reduce((acc: any, curr: any) => {
                    acc[curr.category] = (acc[curr.category] || 0) + 1;
                    return acc;
                }, {});

                const formattedChart = Object.keys(counts).map(key => ({
                    category: key.replace('_', ' ').toUpperCase(),
                    count: counts[key]
                })).sort((a, b) => b.count - a.count);

                setChartData(formattedChart);
            }

            setLoading(false);
        }
        fetchStats();
    }, []);

    if (loading || !stats) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Members', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Active Listings', value: stats.activeListings, icon: LayoutList, color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Platform Sales', value: stats.soldItems, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Shadow Banned', value: stats.shadowBanned, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    ];

    return (
        <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Platform Overview</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <Icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-gray-500 font-medium text-sm">{stat.label}</h3>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value.toLocaleString()}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recharts Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Active Inventory by Category</h2>
                <div className="h-80 w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis
                                    dataKey="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#6B7280' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F3F4F6' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                            <BarChart2 className="w-10 h-10 mb-2 opacity-50" />
                            <p>No active inventory data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
