'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    Menu,
    X,
    Compass,
    PlusSquare,
    List,
    Heart,
    CreditCard,
    LogOut,
    UserCircle,
    ShieldCheck
} from 'lucide-react';

const navItems = [
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Sell New', href: '/sell/new', icon: PlusSquare },
    { name: 'My Listings', href: '/my-listings', icon: List },
    { name: 'Favourites', href: '/favourites', icon: Heart },
    { name: 'Profile', href: '/profile', icon: UserCircle },
];

export default function DashboardNavbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                setIsAdmin(data?.role === 'admin');
            }
        };
        checkAdmin();
    }, [supabase]);

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/discover" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-green-400 rounded-lg flex items-center justify-center transform rotate-12">
                                <span className="text-white font-black text-xl italic drop-shadow-sm -rotate-12">F</span>
                            </div>
                            <span className="text-xl font-black tracking-tight hidden sm:block">
                                Frag<span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Swipe</span>
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.name}
                                </Link>
                            );
                        })}
                        <Link
                            href="/subscribe"
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/subscribe' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <CreditCard className="w-4 h-4" />
                            Subscribe
                        </Link>
                        {isAdmin && (
                            <Link
                                href="/admin"
                                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold text-purple-600 hover:bg-purple-50 transition-colors border border-purple-100"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Admin
                            </Link>
                        )}
                        <a
                            href="/api/auth/signout"
                            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </a>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center md:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {
                isOpen && (
                    <div className="md:hidden bg-white border-b border-gray-200 shadow-lg animate-in slide-in-from-top duration-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold transition-colors ${isActive
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                            <Link
                                href="/subscribe"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold transition-colors ${pathname === '/subscribe' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                            >
                                <CreditCard className="w-5 h-5" />
                                Subscribe
                            </Link>
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                    Admin Panel
                                </Link>
                            )}
                        </div>
                        <div className="pt-4 pb-3 border-t border-gray-100">
                            <a
                                href="/api/auth/signout"
                                className="flex items-center gap-3 px-5 py-3 text-base font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign out
                            </a>
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
