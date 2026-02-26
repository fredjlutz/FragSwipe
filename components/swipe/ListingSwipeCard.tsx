/* eslint-disable @next/next/no-img-element */
'use client';

import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { useState } from 'react';
import type { SwipeListing } from '@/hooks/useSwipeQueue';
import { Heart, X, MessageCircle, MapPin } from 'lucide-react';

interface ListingSwipeCardProps {
    listing: SwipeListing;
    active: boolean;
    onSwipe: (id: string, dir: 'left' | 'right', isFavourite?: boolean) => void;
    whatsappNumber: string; // The user's number format injected by page context, or we can fetch the seller's number inside the UI if required (Actually, AGENTS.md specifies we need seller's Whatsapp to generate the link. We should probably fetch the seller's whatsapp alongside the queue or in a rapid sub-request, but for deep integration we'll assume we received it or route to a secure generic chat if implemented. Let's assume standard interaction). Wait, AGENTS.md: `https://wa.me/{whatsapp_number}?text=Hi`. The API currently doesn't leak seller phone number. We MUST fix this or have the user click passing ID. Let's just generate a generic link, or if we need to we can update the API route. For this component, we accept `sellerWhatsApp` as a prop.
    sellerWhatsApp?: string;
}

export default function ListingSwipeCard({ listing, active, onSwipe, sellerWhatsApp }: ListingSwipeCardProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Framer Motion physics values
    const x = useMotionValue(0);

    // Rotating the card slightly as it is dragged
    const rotate = useTransform(x, [-200, 200], [-18, 18]);

    // Fade out opacity as it goes far off screen
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Color overlays for visual feedback ("NOPE" / "LIKE")
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

    const animControls = useAnimation();

    const handleDragEnd = async (e: unknown, info: { offset: { x: number } }) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            // Swiped Right
            await animControls.start({ x: 500, transition: { duration: 0.3 } });
            onSwipe(listing.id, 'right', true);
        } else if (info.offset.x < -threshold) {
            // Swiped Left
            await animControls.start({ x: -500, transition: { duration: 0.3 } });
            onSwipe(listing.id, 'left', false);
        } else {
            // Snap back to center
            animControls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
    };

    const handleManualSwipe = async (dir: 'left' | 'right') => {
        await animControls.start({ x: dir === 'left' ? -500 : 500, transition: { duration: 0.3 } });
        onSwipe(listing.id, dir, dir === 'right');
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.images.length > 1) {
            setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
        }
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (listing.images.length > 1) {
            setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
        }
    };

    const generateWhatsAppLink = () => {
        const message = encodeURIComponent(`Hi, I'm interested in your ${listing.title} on FragSwipe.`);
        return `https://wa.me/${sellerWhatsApp || ''}?text=${message}`;
    };

    const currentImage = listing.images.length > 0
        ? listing.images[currentImageIndex]
        : null;

    return (
        <motion.div
            className="absolute w-full h-[540px] max-h-[82dvh] max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden cursor-grab active:cursor-grabbing border border-gray-100"
            style={{ x, rotate, opacity }}
            drag={active ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            animate={animControls}
            whileTap={{ scale: 0.98 }}
        >
            {/* Image Carousel Area */}
            <div className="relative h-[50%] bg-gray-100" onClick={nextImage}>
                {currentImage ? (
                    <img
                        src={currentImage}
                        alt={listing.title}
                        className="w-full h-full object-cover pointer-events-none"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 text-gray-300">
                        <MapPin className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-40">No Image Available</span>
                    </div>
                )}

                {/* Visual Swipe Indicators overlays */}
                <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-6 border-4 border-green-500 rounded-lg px-4 py-2 text-green-500 font-black text-3xl rotate-[-15deg] pointer-events-none z-10">
                    LIKE
                </motion.div>
                <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 right-6 border-4 border-red-500 rounded-lg px-4 py-2 text-red-500 font-black text-3xl rotate-[15deg] pointer-events-none z-10">
                    NOPE
                </motion.div>

                {/* Carousel Indicators */}
                {listing.images.length > 1 && (
                    <div className="absolute top-4 left-0 right-0 flex justify-center space-x-1.5 px-4 z-10 pointer-events-none">
                        {listing.images.map((_: string, i: number) => (
                            <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full ${i === currentImageIndex ? 'bg-white shadow-sm' : 'bg-black/30'}`}
                            />
                        ))}
                    </div>
                )}

                {/* Navigation tap zones */}
                {listing.images.length > 1 && (
                    <div
                        className="absolute top-0 bottom-0 left-0 w-1/3 z-0"
                        onClick={prevImage}
                    />
                )}
            </div>

            {/* Info Stack */}
            <div className="p-4 h-[50%] flex flex-col">
                <div>
                    <div className="flex justify-between items-start">
                        <h2 className="text-xl font-bold text-gray-900 leading-tight">
                            {listing.title}
                        </h2>
                        <span className="text-lg font-bold text-blue-600 ml-2 whitespace-nowrap">
                            R {listing.price.toFixed(0)}
                        </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {listing.neighbourhood} ({listing.distance_km} km away)
                    </div>

                    <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {listing.description}
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 capitalize">
                            {listing.category.replace('_', ' ')}
                        </span>
                        {(listing.tags || []).slice(0, 2).map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full border border-gray-100">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-evenly items-center mt-auto pb-4 z-20">
                    <button
                        type="button"
                        onPointerDown={(e) => { e.stopPropagation(); handleManualSwipe('left'); }}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-red-100 text-red-500 hover:bg-red-50 hover:scale-110 transition-transform"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {sellerWhatsApp && (
                        <a
                            href={generateWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            onPointerDown={(e) => e.stopPropagation()}
                            className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md text-white hover:bg-green-600 hover:scale-110 transition-transform"
                        >
                            <MessageCircle className="w-5 h-5" />
                        </a>
                    )}

                    <button
                        type="button"
                        onPointerDown={(e) => { e.stopPropagation(); handleManualSwipe('right'); }}
                        className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border border-green-100 text-green-500 hover:bg-green-50 hover:scale-110 transition-transform"
                    >
                        <Heart className="w-6 h-6 fill-current" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
