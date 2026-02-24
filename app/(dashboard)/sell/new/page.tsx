/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { listingSchema, type ListingFormValues, listingCategories } from '@/lib/validation/listingSchema';
import imageCompression from 'browser-image-compression';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, CheckCircle2, ChevronRight, ChevronLeft, AlertCircle } from 'lucide-react';

export default function NewListingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [images, setImages] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [errorStatus, setErrorStatus] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
        trigger,
    } = useForm<ListingFormValues>({
        resolver: zodResolver(listingSchema),
        defaultValues: { tags: [], price: 0 },
    });

    const supabase = createClient();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);

        // UI limits to 5 maximum files
        const validCount = Math.min(5 - images.length, filesArray.length);
        if (validCount <= 0) return;

        const compressedImages = await Promise.all(
            filesArray.slice(0, validCount).map(async (file) => {
                return imageCompression(file, {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1024,
                    useWebWorker: true,
                });
            })
        );
        setImages((prev) => [...prev, ...compressedImages]);
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const executeSubmit = async (data: ListingFormValues) => {
        setIsUploading(true);
        setErrorStatus('');

        try {
            // 1. Hit API Route to check tier limits and create listing
            const res = await fetch('/api/listings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || 'Failed to create listing');
            }

            const listingId = result.data.id;

            // 2. Upload images to Supabase Storage if present
            if (images.length > 0) {
                let order = 0;
                for (const file of images) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${listingId}/${crypto.randomUUID()}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('listing_images')
                        .upload(fileName, file);

                    if (!uploadError) {
                        await supabase.from('listing_images').insert({
                            listing_id: listingId,
                            storage_path: fileName,
                            display_order: order++,
                        });
                    }
                }
            }

            router.push('/my-listings?success=1');
        } catch (err: unknown) {
            console.error(err);
            setErrorStatus(err instanceof Error ? err.message : String(err));
        } finally {
            setIsUploading(false);
        }
    };

    const nextStep = async () => {
        if (step === 1) {
            const isParamOk = await trigger('category');
            if (isParamOk) setStep(2);
        } else if (step === 2) {
            setStep(3); // Images are optional for now, bypassing validation
        } else if (step === 3) {
            const isValid = await trigger(['title', 'description', 'price', 'tags']);
            if (isValid) setStep(4);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
                <div className="flex items-center mt-4 space-x-2 text-sm text-gray-500">
                    <span className={step >= 1 ? 'text-blue-600 font-semibold' : ''}>Category</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step >= 2 ? 'text-blue-600 font-semibold' : ''}>Photos</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step >= 3 ? 'text-blue-600 font-semibold' : ''}>Details</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className={step >= 4 ? 'text-blue-600 font-semibold' : ''}>Review</span>
                </div>
            </div>

            {errorStatus && (
                <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-start text-red-700">
                    <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    <p>{errorStatus}</p>
                </div>
            )}

            <form className="bg-white p-6 rounded-xl shadow border border-gray-100" onSubmit={handleSubmit(executeSubmit)}>
                {/* Step 1: Category */}
                {step === 1 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">What are you selling?</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {listingCategories.map((cat: string) => (
                                <label key={cat} className="cursor-pointer">
                                    <input type="radio" value={cat} className="hidden peer" {...register('category')} />
                                    <div className="p-4 border border-gray-200 rounded-lg text-center peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 hover:bg-gray-50 transition-colors">
                                        <span className="capitalize">{cat.replace('_', ' ')}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.category && <p className="text-red-500 text-sm mt-2">{errors.category.message}</p>}
                    </div>
                )}

                {/* Step 2: Images */}
                {step === 2 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold mb-4">Add Photos (Max 5)</h2>
                        <div className="flex justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 hover:bg-gray-50 transition cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                disabled={images.length >= 5}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="text-center">
                                <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-sm text-gray-600">Click or drag images to upload</p>
                                <p className="text-xs text-gray-500 mt-1">{images.length} / 5 uploaded</p>
                            </div>
                        </div>

                        {images.length > 0 && (
                            <div className="grid grid-cols-5 gap-4 mt-6">
                                {images.map((img, i) => (
                                    <div key={i} className="relative group">
                                        <img src={URL.createObjectURL(img)} alt="Preview" className="h-24 w-full object-cover rounded-lg border border-gray-200" />
                                        <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Details */}
                {step === 3 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold mb-4">Listing Details</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input type="text" {...register('title')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Rare Holy Grail Torch Coral" />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price (ZAR)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">R</span>
                                </div>
                                <input type="number" {...register('price', { valueAsNumber: true })} className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
                            </div>
                            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea {...register('description')} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" placeholder="Describe the item, parameters, health..." />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-md text-sm text-yellow-800 border border-yellow-200">
                            <p className="font-semibold">Important Rule:</p>
                            Please do not include HTTP links or URLs in the title or description. Listings containing URLs will be sent for manual review (Shadow Banned).
                        </div>
                    </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold mb-4 border-b pb-4">Review Listing</h2>

                        <dl className="divide-y divide-gray-200">
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Category</dt>
                                <dd className="text-sm text-gray-900 capitalize">{watch('category')?.replace('_', ' ')}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Title</dt>
                                <dd className="text-sm text-gray-900">{watch('title')}</dd>
                            </div>
                            <div className="py-3 flex justify-between">
                                <dt className="text-sm font-medium text-gray-500">Price</dt>
                                <dd className="text-sm text-gray-900 font-semibold">R {watch('price')}</dd>
                            </div>
                            <div className="py-3">
                                <dt className="text-sm font-medium text-gray-500 mb-1">Description</dt>
                                <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{watch('description')}</dd>
                            </div>
                            <div className="py-3">
                                <dt className="text-sm font-medium text-gray-500 mb-2">Attached Images ({images.length})</dt>
                                <div className="flex space-x-2">
                                    {images.map((img, i) => (
                                        <img key={i} src={URL.createObjectURL(img)} className="w-12 h-12 object-cover rounded shadow" alt="attachment" />
                                    ))}
                                </div>
                            </div>
                        </dl>
                    </div>
                )}

                <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between">
                    {step > 1 ? (
                        <button type="button" onClick={() => setStep(step - 1)} className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back
                        </button>
                    ) : <div></div>}

                    {step < 4 ? (
                        <button type="button" onClick={nextStep} className="flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm">
                            Next <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                    ) : (
                        <button type="submit" disabled={isUploading} className="flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50">
                            {isUploading ? 'Publishing...' : 'Publish Listing'} <CheckCircle2 className="w-4 h-4 ml-2" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
