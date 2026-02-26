'use client';

import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Save, Loader2, CheckCircle2, AlertCircle, KeyRound, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [profile, setProfile] = useState({
        full_name: '',
        whatsapp_number: '',
        neighbourhood: '',
        raw_address: ''
    });

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setProfile({
                    full_name: data.full_name || '',
                    whatsapp_number: data.whatsapp_number || '',
                    neighbourhood: data.neighbourhood || '',
                    raw_address: data.raw_address || ''
                });
            }
        } catch {
            console.error('Failed to fetch profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profile)
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                setProfile(prev => ({
                    ...prev,
                    neighbourhood: data.neighbourhood
                }));
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
            }
        } catch {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (password !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        if (password.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        setUpdatingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' });
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100dvh-64px)] bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Your Profile</h1>
                    <p className="mt-2 text-gray-600">Manage your personal details and location preferences.</p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            id="full_name"
                                            value={profile.full_name}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-700 mb-2">
                                        WhatsApp Number
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="tel"
                                            id="whatsapp"
                                            value={profile.whatsapp_number}
                                            onChange={(e) => setProfile({ ...profile, whatsapp_number: e.target.value })}
                                            className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="+27 82 123 4567"
                                            required
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500">Include country code (e.g., +27)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 sm:p-8 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">Your Location</h2>
                            </div>

                            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 mb-6">
                                <p className="text-sm text-blue-900">
                                    <span className="font-semibold">Current Neighbourhood:</span> {profile.neighbourhood || 'Not set'}
                                </p>
                                <p className="text-xs text-blue-700 mt-1">
                                    This determines the listings you see in your &quot;Nearby&quot; discovery feed.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                                    Update Neighbourhood Manually
                                </label>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="address"
                                            value={profile.raw_address}
                                            onChange={(e) => setProfile({ ...profile, raw_address: e.target.value })}
                                            className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="Enter your street or neighbourhood (e.g. Sandton)"
                                        />
                                    </div>
                                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <p>Manual location is only used if browser GPS is unavailable or blocked.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Password Update section */}
                <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <KeyRound className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">Security</h2>
                        </div>

                        {passwordMessage && (
                            <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                }`}>
                                {passwordMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                <p className="text-sm font-medium">{passwordMessage.text}</p>
                            </div>
                        )}

                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={updatingPassword || !password || !confirmPassword}
                                    className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                >
                                    {updatingPassword ? 'Updating...' : 'Change Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Logout Action */}
                <div className="mt-8 flex justify-center pb-12">
                    <a
                        href="/api/auth/signout"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out of FragSwipe
                    </a>
                </div>

            </div>
        </div>
    );
}
