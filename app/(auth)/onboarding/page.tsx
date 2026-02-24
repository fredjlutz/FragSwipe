'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, type ProfileFormValues } from '@/lib/validation/profileSchema';
import { createProfile } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: '',
            whatsapp_number: '',
            raw_address: '',
        },
    });

    const onSubmit = async (data: ProfileFormValues) => {
        setServerError('');

        // We intentionally standardise the E.164 phone requirement UI
        // Call the secured server action
        const result = await createProfile(data);

        if (!result.success) {
            setServerError(result.error || 'Failed to finish onboarding. Please try again.');
        } else {
            router.push('/discover');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 border-t-4 border-blue-500 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        Complete your profile
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        We need your contact and location details to connect you with nearby sellers and buyers.
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800 border border-blue-200">
                        <p className="font-semibold mb-1">Privacy Notice:</p>
                        Your exact address is strictly kept private and used only to calculate distances. Other users will only see your overall neighbourhood (e.g., &quot;Sea Point&quot;) and your distance in km.
                    </div>
                </div>

                {serverError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm ring-1 ring-red-200">
                        {serverError}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                id="full_name"
                                type="text"
                                autoComplete="name"
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="John Doe"
                                {...register('full_name')}
                            />
                            {errors.full_name && (
                                <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="whatsapp_number" className="block text-sm font-medium text-gray-700">
                                WhatsApp Number
                            </label>
                            <input
                                id="whatsapp_number"
                                type="tel"
                                autoComplete="tel"
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="+27821234567"
                                {...register('whatsapp_number')}
                            />
                            <p className="mt-1 text-xs text-gray-500">Must include country code (e.g. +27)</p>
                            {errors.whatsapp_number && (
                                <p className="mt-1 text-xs text-red-600">{errors.whatsapp_number.message}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="raw_address" className="block text-sm font-medium text-gray-700">
                                Home Address (Street level)
                            </label>
                            <textarea
                                id="raw_address"
                                rows={3}
                                autoComplete="street-address"
                                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="123 Ocean View Drive, Cape Town"
                                {...register('raw_address')}
                            />
                            {errors.raw_address && (
                                <p className="mt-1 text-xs text-red-600">{errors.raw_address.message}</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? 'Saving...' : 'Complete Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
