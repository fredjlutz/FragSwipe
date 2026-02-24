import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListingSwipeCard from '@/components/swipe/ListingSwipeCard';

// Mock framer-motion to avoid complex animation testing in JSDOM
vi.mock('framer-motion', () => {
    return {
        motion: {
            // Simply render a standard div instead of a motion.div
            div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        },
        useMotionValue: vi.fn(() => 0),
        useTransform: vi.fn(() => 0),
        useAnimation: vi.fn(() => ({
            start: vi.fn().mockResolvedValue(undefined),
        })),
    };
});

describe('ListingSwipeCard', () => {
    const mockListing = {
        id: '123',
        title: 'Test Coral',
        description: 'A beautiful test coral',
        price: 500,
        category: 'coral_lps',
        tags: ['lps', 'torch'],
        images: ['img1.jpg', 'img2.jpg'],
        seller_id: 'seller1',
        seller: {
            full_name: 'John Doe',
            profile_image: '',
        },
        neighbourhood: 'Gardens',
        location: null,
        created_at: new Date().toISOString(),
        distance_km: 5,
    };

    it('renders listing details correctly', () => {
        render(
            <ListingSwipeCard
                listing={mockListing as any}
                active={true}
                onSwipe={vi.fn()}
                sellerWhatsApp="27821234567"
                whatsappNumber="123"
            />
        );

        expect(screen.getByText('Test Coral')).toBeDefined();
        // Since React might split standard text vs span formatting, we use getByText with exact=false or a custom matcher
        expect(screen.getByText(/500/i)).toBeDefined();
        expect(screen.getByText(/Gardens/i)).toBeDefined();
        expect(screen.getByText(/5 km away/i)).toBeDefined();

        // Image rendering
        const img = screen.getByAltText('Test Coral') as HTMLImageElement;
        expect(img.src).toContain('img1.jpg');
    });

    it('navigates through images on click', () => {
        render(
            <ListingSwipeCard
                listing={mockListing as any}
                active={true}
                onSwipe={vi.fn()}
                sellerWhatsApp="27821234567"
                whatsappNumber="123"
            />
        );

        const img = screen.getByAltText('Test Coral') as HTMLImageElement;
        expect(img.src).toContain('img1.jpg');

        // The top 2/3 of the card is the image area that triggers nextImage
        const imageArea = img.parentElement;
        if (imageArea) {
            fireEvent.click(imageArea);
            expect(img.src).toContain('img2.jpg');

            // Should wrap around
            fireEvent.click(imageArea);
            expect(img.src).toContain('img1.jpg');
        }
    });

    it('triggers onSwipe right when the Heart button is clicked', async () => {
        const mockSwipe = vi.fn();
        render(
            <ListingSwipeCard
                listing={mockListing as any}
                active={true}
                onSwipe={mockSwipe}
                sellerWhatsApp="27821234567"
                whatsappNumber="123"
            />
        );

        // Find the heart icon button (it has a green background class)
        // Let's grab by aria-label if we add it, or we can grab the button containing the Heart SVG.
        // The buttons don't have aria-labels currently, so we'll grab by class or structure.
        // It's the right-most button in the flex container.
        const buttons = screen.getAllByRole('button');
        // The WhatsApp link is an anchor tag, not a button.
        // Index 1 is the heart button (0=X, 1=Heart).
        fireEvent.pointerDown(buttons[1]);

        await waitFor(() => {
            expect(mockSwipe).toHaveBeenCalledWith('123', 'right', true);
        });
    });

    it('triggers onSwipe left when the X button is clicked', async () => {
        const mockSwipe = vi.fn();
        render(
            <ListingSwipeCard
                listing={mockListing as any}
                active={true}
                onSwipe={mockSwipe}
                sellerWhatsApp="27821234567"
                whatsappNumber="123"
            />
        );

        const buttons = screen.getAllByRole('button');
        // Index 0 is the X button
        fireEvent.pointerDown(buttons[0]);

        await waitFor(() => {
            expect(mockSwipe).toHaveBeenCalledWith('123', 'left', false);
        });
    });

    it('generates the correct WhatsApp link', () => {
        render(
            <ListingSwipeCard
                listing={mockListing as any}
                active={true}
                onSwipe={vi.fn()}
                sellerWhatsApp="27821234567"
                whatsappNumber="123"
            />
        );

        // Find the generic anchor tag that links to Whatsapp
        const link = screen.getByRole('link') as HTMLAnchorElement;
        expect(link.href).toContain('https://wa.me/27821234567');
        expect(link.href).toContain(encodeURIComponent('Test Coral'));
    });
});
