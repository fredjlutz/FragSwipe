'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlError = searchParams.get('error');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(urlError ? urlError.replace(/\+/g, ' ') : '');
    const [successMsg, setSuccessMsg] = useState('');

    const supabase = createClient();

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            console.log('Attempting login for:', email);
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('Login response received:', { user: !!data.user, error: error?.message });

            if (error) {
                setErrorMsg(error.message);
                setLoading(false);
                return;
            }

            // Check if they have a profile
            if (data.user) {
                console.log('Checking profile for user:', data.user.id);
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', data.user.id)
                    .single();

                console.log('Profile check result:', { hasProfile: !!profile, error: profileError?.message });

                if (profileError && profileError.code !== 'PGRST116') {
                    console.error('Profile check error:', profileError);
                }

                if (!profile) {
                    console.log('Redirecting to onboarding (full reload)');
                    window.location.href = '/onboarding';
                } else {
                    console.log('Redirecting to discover (full reload)');
                    window.location.href = '/discover';
                }
            }
        } catch (err: unknown) {
            console.error('Unexpected login error:', err);
            setErrorMsg('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/api/auth/callback`,
                }
            });

            if (error) {
                console.error('Signup error:', error);
                setErrorMsg(error.message);
            } else if (data.session) {
                setSuccessMsg('Account created successfully!');
                router.push('/onboarding');
            } else {
                setSuccessMsg('Check your email to confirm your new account!');
            }
        } catch (err: unknown) {
            console.error('Unexpected signup error:', err);
            setErrorMsg('An unexpected error occurred during signup.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setErrorMsg('Please enter your email address first.');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
            });

            if (error) {
                console.error('Detailed Reset password error:', {
                    message: error.message,
                    status: error.status,
                    name: error.name,
                    error: error
                });
                setErrorMsg(`Error: ${error.message} (Check console for details)`);
            } else {
                setSuccessMsg('A reset link has been triggered! Please check your email (including spam). If it doesn\'t arrive, please ensure "Redirect URLs" in Supabase include ' + window.location.origin + ' and your "From Email" matches your Resend verified domain.');
            }
        } catch (err: unknown) {
            console.error('Unexpected forgot password error:', err);
            setErrorMsg('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
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

                {/* Form area starts directly, segmented control removed */}

                <form onSubmit={handlePasswordLogin} className="space-y-4">
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

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                                Password
                            </label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-xs text-blue-600 hover:text-blue-500 font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSignup}
                        disabled={loading}
                        className="w-full flex justify-center py-2.5 px-4 mt-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        Create Account
                    </button>
                </form>
            </div >
        </div >
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginContent />
        </Suspense>
    );
}
