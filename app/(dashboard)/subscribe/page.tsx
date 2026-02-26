/* eslint-disable @next/next/no-img-element */
'use client';

import { Check } from 'lucide-react';

export default function SubscribePage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                    Upgrade your Selling Power
                </h1>
                <p className="mt-4 text-xl text-gray-500">
                    Increase your active limits, get a public storefront, and reach thousands of local coral buyers.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* FREE */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900">Member</h3>
                    <p className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                        Free
                    </p>
                    <ul className="mt-8 space-y-4 flex-1">
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="ml-3 text-gray-600">Browse the Swipe Feed</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="ml-3 text-gray-600">List up to <strong className="text-gray-900">5 active items</strong></span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                            <span className="ml-3 text-gray-600">Private profile mask</span>
                        </li>
                    </ul>
                    <div className="mt-8 bg-gray-50 p-3 rounded-lg text-center text-gray-500 text-sm font-semibold border border-gray-100">
                        Active Plan
                    </div>
                </div>

                {/* PRO */}
                <div className="bg-white rounded-2xl shadow-xl border-2 border-blue-500 p-8 flex flex-col relative transform scale-105 z-10">
                    <div className="absolute top-0 right-6 transform -translate-y-1/2">
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Popular
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Pro</h3>
                    <p className="mt-4 flex items-baseline text-4xl font-extrabold text-gray-900">
                        R29
                        <span className="ml-1 text-xl font-medium text-gray-500">/mo</span>
                    </p>
                    <ul className="mt-8 space-y-4 flex-1">
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-blue-500 shrink-0" />
                            <span className="ml-3 text-gray-600">Everything in Free</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-blue-500 shrink-0" />
                            <span className="ml-3 text-gray-600">List up to <strong className="text-blue-700">20 active items</strong></span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-blue-500 shrink-0" />
                            <span className="ml-3 text-gray-600">Priority support</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => { }}
                        disabled={true}
                        className="mt-8 w-full bg-gray-200 text-gray-500 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center cursor-not-allowed shadow-none"
                    >
                        Coming Soon
                    </button>
                </div>

                {/* STORE */}
                <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 p-8 flex flex-col">
                    <h3 className="text-xl font-bold text-white">Store</h3>
                    <p className="mt-4 flex items-baseline text-4xl font-extrabold text-white">
                        R99
                        <span className="ml-1 text-xl font-medium text-gray-400">/mo</span>
                    </p>
                    <p className="mt-2 text-sm text-gray-400 border-b border-gray-700 pb-4">
                        For local coral shops and massive collectors.
                    </p>
                    <ul className="mt-6 space-y-4 flex-1">
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                            <span className="ml-3 text-gray-300">List up to <strong className="text-indigo-300">100 active items</strong></span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                            <span className="ml-3 text-gray-300 font-bold">Public Store Directory URL</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                            <span className="ml-3 text-gray-300">Custom Logo & Banner</span>
                        </li>
                        <li className="flex items-start">
                            <Check className="h-5 w-5 text-indigo-400 shrink-0" />
                            <span className="ml-3 text-gray-300"><strong className="text-indigo-300">Bulk Uploads</strong> with a spreadsheet</span>
                        </li>
                    </ul>
                    <button
                        onClick={() => { }}
                        disabled={true}
                        className="mt-8 w-full bg-gray-800 text-gray-500 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center cursor-not-allowed"
                    >
                        Coming Soon
                    </button>
                </div>
            </div>

            <div className="mt-12 text-center">
                <img src="https://www.payfast.co.za/images/logos/payfast-logo.png" alt="Secured by PayFast" className="h-8 mx-auto opacity-70 grayscale" />
                <p className="mt-2 text-xs text-gray-400">Payments are securely processed directly by PayFast.</p>
            </div>
        </div>
    );
}
