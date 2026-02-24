'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart2, ShieldAlert, Users, LayoutList, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const supabase = createClient();
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navItems = [
        { label: 'Overview', href: '/admin', icon: BarChart2 },
        { label: 'Moderation Q', href: '/admin/moderation', icon: ShieldAlert },
        { label: 'Members', href: '/admin/members', icon: Users },
        { label: 'All Listings', href: '/admin/listings', icon: LayoutList },
    ];

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-gray-900 text-white min-h-screen hidden md:flex flex-col shadow-xl">
                <div className="p-6">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-green-400 rounded-lg flex items-center justify-center transform rotate-12">
                            <span className="text-white font-black text-xl italic drop-shadow-sm -rotate-12">F</span>
                        </div>
                        <span className="text-xl font-black tracking-tight flex items-baseline">
                            Frag<span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Swipe</span>
                            <span className="ml-2 text-xs font-bold text-red-500 tracking-widest uppercase">Admin</span>
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 mt-6">
                    <ul className="space-y-2 px-4">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`flex items-center px-4 py-3 rounded-xl transition font-medium ${isActive
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5 mr-3 shrink-0" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
                    >
                        <LogOut className="w-5 h-5 mr-3 shrink-0" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden bg-gray-900 text-white p-4 shadow-md flex items-center justify-between">
                    <span className="font-bold">FragSwipe Admin</span>
                </header>
                <div className="p-4 sm:p-8 lg:p-12 overflow-y-auto max-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
