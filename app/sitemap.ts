import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createAdminClient()

    // Fetch items for the sitemap
    const { data: listings } = await supabase
        .from('listings')
        .select('id, updated_at')
        .eq('status', 'active')
        .limit(1000)

    const { data: stores } = await supabase
        .from('profiles')
        .select('handle, updated_at')
        .not('handle', 'is', null)

    const listingUrls = (listings || []).map((listing) => ({
        url: `https://fragswipe.co.za/listings/${listing.id}`,
        lastModified: listing.updated_at,
    }))

    const storeUrls = (stores || []).map((store) => ({
        url: `https://fragswipe.co.za/stores/${store.handle}`,
        lastModified: store.updated_at,
    }))

    return [
        {
            url: 'https://fragswipe.co.za',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: 'https://fragswipe.co.za/discover',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.8,
        },
        {
            url: 'https://fragswipe.co.za/stores',
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        ...listingUrls,
        ...storeUrls,
    ]
}
