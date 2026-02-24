import { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Map, MessageCircle, Star, ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'FragSwipe | Buy & Sell Local Coral Frags',
    description: 'The smartest way to trade corals locally. Find premium SPS, LPS, and Softies near you. Snap it, swipe it, frag it.',
    openGraph: {
        title: 'FragSwipe | Buy & Sell Local Coral Frags',
        description: 'The smartest way to trade corals locally.',
        url: 'https://fragswipe.co.za',
        siteName: 'FragSwipe',
        type: 'website',
    },
};

export default function LandingPage() {
    return (
        <div className="bg-white min-h-screen font-sans">

            {/* Navigation Stub (Simplified for Landing) */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-green-400 rounded-lg flex items-center justify-center transform rotate-12">
                            <span className="text-white font-black text-xl italic drop-shadow-sm -rotate-12">F</span>
                        </div>
                        <span className="text-xl font-black tracking-tight">
                            Frag<span className="bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">Swipe</span>
                        </span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href="/stores" className="text-gray-500 hover:text-gray-900 font-medium text-sm hidden sm:block">Stores</Link>
                        <Link href="/login" className="text-gray-900 hover:text-blue-600 font-bold text-sm">Log in</Link>
                        <Link href="/login" className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition shadow-sm">
                            Start Swiping
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative overflow-hidden pt-20 pb-32">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-green-50/50 -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight">
                        The smartest way to <br className="hidden md:block" />
                        <span className="bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">trade corals locally.</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Discover premium SPS, LPS, and Softies hidden in tanks near you. No middleman, no shipping stress. Just reefers connecting with reefers.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login" className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl transition-transform hover:scale-105">
                            Browse Local Frags
                        </Link>
                        <Link href="/how-to-photograph-corals" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 font-bold rounded-2xl shadow-sm transition">
                            Photography Guide
                        </Link>
                    </div>

                    <div className="mt-16 flex items-center justify-center space-x-8 opacity-60 grayscale text-sm font-bold text-gray-600 uppercase tracking-widest">
                        <span>SPS</span>
                        <span>•</span>
                        <span>LPS</span>
                        <span>•</span>
                        <span>Softies</span>
                        <span>•</span>
                        <span>Hardware</span>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900">How FragSwipe Works</h2>
                        <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">We&apos;ve stripped away the noise so you can focus on building your reef.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <Camera className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">1. Snap & List</h3>
                            <p className="text-gray-500">Take a photo under your blues, set an honest price, and drop a pin on your rough neighbourhood.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                                <Map className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">2. Discover Nearby</h3>
                            <p className="text-gray-500">Our engine finds matches within a 20km radius. Swipe right on what you love to save it to your favourites.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                                <MessageCircle className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">3. Connect Instantly</h3>
                            <p className="text-gray-500">Hit the WhatsApp button to chat directly with the seller. Go pick up your new coral today.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Banners */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-64 rounded-3xl bg-gray-900 p-8 flex flex-col justify-end relative overflow-hidden group">
                            {/* Placeholder for SPS background */}
                            <div className="absolute inset-0 bg-blue-900/50 group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-white">SPS Dominant</h3>
                                <p className="text-blue-200 mt-2">Acropora, Montipora, Stylophora</p>
                            </div>
                        </div>
                        <div className="h-64 rounded-3xl bg-gray-900 p-8 flex flex-col justify-end relative overflow-hidden group">
                            <div className="absolute inset-0 bg-green-900/50 group-hover:scale-105 transition-transform duration-500"></div>
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-white">Fleshy LPS</h3>
                                <p className="text-green-200 mt-2">Torches, Hammers, Chalices</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparent Pricing */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-gray-900">Simple, fair pricing.</h2>
                        <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">No hidden transaction fees. Buyers always browse for free.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900">Buyer</h3>
                            <p className="text-4xl font-extrabold text-gray-900 mt-4">Free</p>
                            <ul className="mt-8 space-y-4 text-gray-600">
                                <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-500 mr-2" /> Unlimited browsing</li>
                                <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-500 mr-2" /> WhatsApp connections</li>
                                <li className="flex items-center"><ShieldCheck className="w-5 h-5 text-green-500 mr-2" /> 10 Active listings</li>
                            </ul>
                        </div>

                        <div className="bg-gray-900 rounded-3xl p-8 shadow-xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 right-8 transform -translate-y-1/2">
                                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Most Popular</span>
                            </div>
                            <h3 className="text-lg font-bold text-white">Pro Seller</h3>
                            <p className="text-4xl font-extrabold text-white mt-4">R29<span className="text-xl text-gray-400 font-medium">/mo</span></p>
                            <ul className="mt-8 space-y-4 text-gray-300">
                                <li className="flex items-center"><Zap className="w-5 h-5 text-blue-400 mr-2" /> 50 Active listings</li>
                                <li className="flex items-center"><Zap className="w-5 h-5 text-blue-400 mr-2" /> Priority ranking</li>
                                <li className="flex items-center"><Zap className="w-5 h-5 text-blue-400 mr-2" /> Pro Badge</li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900">Store / LFS</h3>
                            <p className="text-4xl font-extrabold text-gray-900 mt-4">R99<span className="text-xl text-gray-500 font-medium">/mo</span></p>
                            <ul className="mt-8 space-y-4 text-gray-600">
                                <li className="flex items-center"><Star className="w-5 h-5 text-indigo-500 mr-2" /> 100 Active listings</li>
                                <li className="flex items-center"><Star className="w-5 h-5 text-indigo-500 mr-2" /> Dedicated Storefront URL</li>
                                <li className="flex items-center"><Star className="w-5 h-5 text-indigo-500 mr-2" /> Banner & Branding</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center gap-2 mb-4 md:mb-0 grayscale opacity-60">
                        <span className="font-black text-xl">FragSwipe</span>
                    </div>
                    <div className="flex space-x-6 text-sm text-gray-500 font-medium">
                        <Link href="/how-to-photograph-corals" className="hover:text-gray-900">Photography Guide</Link>
                        <Link href="/stores" className="hover:text-gray-900">Store Directory</Link>
                        <a href="#" className="hover:text-gray-900">Terms</a>
                        <a href="#" className="hover:text-gray-900">Privacy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
