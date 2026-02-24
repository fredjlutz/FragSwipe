import { Metadata } from 'next';
import Link from 'next/link';
import { Camera, Sun, Image as ImageIcon, CheckCircle, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'How to Photograph Corals | FragSwipe Guide',
    description: 'A complete guide to photographing reef tank corals without the blue wash. Learn about orange filters, white balance, and macro lenses.',
    openGraph: {
        title: 'How to Photograph Corals | FragSwipe',
        description: 'Learn how to take professional coral photos under heavy blue LED lighting.',
    }
};

export default function CoralPhotographyGuide() {
    return (
        <div className="bg-white min-h-screen">

            {/* Heavy Header */}
            <div className="bg-gray-900 pt-20 pb-32 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-900/20" />
                <div className="max-w-3xl mx-auto relative z-10 text-center">
                    <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white text-sm font-bold mb-8 transition">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to FragSwipe
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                        How to Photograph Corals Like a Pro
                    </h1>
                    <p className="mt-6 text-xl text-gray-400">
                        Beat the infamous "blue wash" and showcase your frags with honest, vibrant accuracy.
                    </p>
                </div>
            </div>

            {/* Guide Content */}
            <div className="max-w-3xl mx-auto px-4 -mt-16 relative z-20 pb-24">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100 prose prose-lg prose-blue max-w-none">

                    <p className="lead text-xl text-gray-600 mb-10">
                        We've all seen them: listings where the entire tank looks like someone accidentally spilled a bucket of Windex. If your coral photos are completely washed out in blue, buyers scroll right past. Here is exactly how to fix it using just your smartphone.
                    </p>

                    <div className="flex items-center text-blue-600 mb-6">
                        <Sun className="w-8 h-8 mr-4" />
                        <h2 className="text-2xl font-bold m-0">1. Master the Lighting</h2>
                    </div>
                    <p>
                        Corals look best under actinic (blue/UV) lighting because it forces their symbiotic zooxanthellae to fluoresce, but digital camera sensors panic when hit with pure blue light.
                    </p>
                    <ul>
                        <li><strong>Turn down the whites:</strong> If your lights are adjustable, dim the white channels. White light reflects heavily off the glass and sand, washing out the natural fluorescence of the coral.</li>
                        <li><strong>Clean the glass:</strong> Seriously. Grab your magnetic scraper. Even an invisible layer of algae will refract light and cause your camera to lose focus.</li>
                        <li><strong>Turn off the flow:</strong> Turn off your wavemakers for 5 minutes. Trying to snap a sharp photo of a violently swaying torch coral is impossible.</li>
                    </ul>

                    <hr className="my-12 border-gray-100" />

                    <div className="flex items-center text-orange-500 mb-6">
                        <Camera className="w-8 h-8 mr-4" />
                        <h2 className="text-2xl font-bold m-0">2. Get an Orange Filter</h2>
                    </div>
                    <p>
                        This is the silver bullet. You cannot digitally edit away a severe blue wash without destroying the image quality. You need a physical optical filter.
                    </p>
                    <p>
                        Invest in a cheap <strong>Coral Lens Kit</strong> (usually a clip-on for your phone). Most kits come with a 15k or 20k orange filter. The orange physically blocks the excess blue spectrum before it hits your phone's sensor, revealing the neon greens, reds, and yellows underneath.
                    </p>

                    <hr className="my-12 border-gray-100" />

                    <div className="flex items-center text-purple-600 mb-6">
                        <ImageIcon className="w-8 h-8 mr-4" />
                        <h2 className="text-2xl font-bold m-0">3. White Balance & Editing</h2>
                    </div>
                    <p>
                        Once you have the orange filter on, your photo might look a little <i>too</i> orange. This is where basic editing comes in.
                    </p>
                    <p>
                        <strong>Do not over-saturate.</strong> Your goal on FragSwipe is honest representation. If a buyer shows up and the coral is dull brown instead of the radioactive neon you posted, the deal will fall through.
                    </p>
                    <ol>
                        <li>Open the default Photos app on your phone.</li>
                        <li>Adjust the <strong>Temperature (Warmth)</strong> slightly towards the blue side to neutralize any heavy orange tint from the physical filter.</li>
                        <li>Increase <strong>Contrast</strong> slightly to make the darks deeper.</li>
                        <li>Drop the <strong>Blacks</strong> to hide background algae and isolate the frag.</li>
                    </ol>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl mt-10">
                        <h4 className="flex items-center text-blue-900 font-bold m-0 text-lg">
                            <CheckCircle className="w-5 h-5 mr-2" /> Buyers Appreciate Honesty
                        </h4>
                        <p className="text-blue-800 mt-2 mb-0">
                            If it's just a standard green mushroom, don't edit it to look like a jawbreaker. Great composition, sharp focus, and accurate color representation will always sell faster than heavy photoshop. Happy swiping!
                        </p>
                    </div>

                </div>
            </div>

        </div>
    );
}
