'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isMagicLink, setIsMagicLink] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const supabase = createClient();

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            },
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg('Check your email for the magic link!');
        }
        setLoading(false);
    };

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
            return;
        }

        // Check if they have a profile
        if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', data.user.id)
                .single();

            if (!profile) {
                router.push('/onboarding');
            } else {
                router.push('/discover');
            }
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/api/auth/callback`,
            }
        });

        if (error) {
            setErrorMsg(error.message);
        } else {
            setSuccessMsg('Check your email to confirm your new account!');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 border-t-4 border-blue-500">
            <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-lg border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">FragSwipe</h1>
                    <p className="text-gray-500 mt-2 text-sm">Buy and sell corals near you</p>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm ring-1 ring-red-200">
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm ring-1 ring-green-200">
                        {successMsg}
                    </div>
                )}

                {/* Custom Segmented Control */}
                <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                    <button
                        onClick={() => { setIsMagicLink(true); setErrorMsg(''); setSuccessMsg(''); }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${isMagicLink ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Magic Link
                    </button>
                    <button
                        onClick={() => { setIsMagicLink(false); setErrorMsg(''); setSuccessMsg(''); }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${!isMagicLink ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Password
                    </button>
                </div>

                <form onSubmit={isMagicLink ? handleMagicLink : handlePasswordLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="you@example.com"
                        />
                    </div>

                    {!isMagicLink && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required={!isMagicLink}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Sending...' : (isMagicLink ? 'Send Magic Link' : 'Sign In')}
                    </button>

                    {!isMagicLink && (
                        <button
                            type="button"
                            onClick={handleSignup}
                            disabled={loading}
                            className="w-full flex justify-center py-2.5 px-4 mt-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            Create Account
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
}
