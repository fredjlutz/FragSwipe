import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from './lib/env';

// Basic in-memory rate limiting map (IP -> { count, windowStart })
// In production across edge nodes, use Redis (e.g., Upstash)
const rateLimitMap = new Map<string, { count: number, start: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const url = request.nextUrl;
    const path = url.pathname;
    const ip = request.headers.get('x-forwarded-for') || request.ip || 'unknown';

    console.log(`Middleware running for: ${path}`);

    const { data: { user } } = await supabase.auth.getUser();

    console.log(`User status for ${path}:`, !!user);

    // 1. Rate Limiting for Listing Creation API
    if (path === '/api/listings/create' && request.method === 'POST') {
        const now = Date.now();
        const windowData = rateLimitMap.get(ip);

        if (windowData) {
            if (now - windowData.start > RATE_LIMIT_WINDOW_MS) {
                rateLimitMap.set(ip, { count: 1, start: now });
            } else {
                if (windowData.count >= MAX_REQUESTS_PER_WINDOW) {
                    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
                }
                windowData.count++;
            }
        } else {
            rateLimitMap.set(ip, { count: 1, start: now });
        }
    }

    // If user is authenticated, we need to fetch their profile to check roles & ban status
    if (user) {
        console.log(`User ${user.id} authenticated, checking profile...`);
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, is_banned')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error(`Profile fetch error in middleware for ${user.id}:`, error.message);
        }

        // 2. Ban Enforcement
        if (profile?.is_banned) {
            console.log(`User ${user.id} is banned, redirecting to login...`);
            // Force logout and redirect
            await supabase.auth.signOut();
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            redirectUrl.searchParams.set('banned', 'true');
            // Create redirect response but ATTACH cookies from the 'response' object
            const redirectResponse = NextResponse.redirect(redirectUrl);
            response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c));
            return redirectResponse;
        }

        // 3. Admin Route Guards
        if (path.startsWith('/admin')) {
            if (profile?.role !== 'admin') {
                console.log(`User ${user.id} not admin, redirecting to discover...`);
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.pathname = '/discover';
                const redirectResponse = NextResponse.redirect(redirectUrl);
                response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c));
                return redirectResponse;
            }
        }

        // Auth redirect if trying to access auth pages when logged in
        if (path === '/login' || path === '/') {
            console.log(`User ${user.id} at auth page, redirecting to discover...`);
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/discover';
            const redirectResponse = NextResponse.redirect(redirectUrl);
            response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c));
            return redirectResponse;
        }

    } else {
        // 4. Protect private routes for unauthenticated users
        const privateRoutes = ['/discover', '/sell', '/my-listings', '/favourites', '/subscribe', '/admin'];
        const isPrivate = privateRoutes.some(route => path.startsWith(route));
        if (isPrivate) {
            console.log(`Unauthenticated access to ${path}, redirecting to login...`);
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = '/login';
            const redirectResponse = NextResponse.redirect(redirectUrl);
            response.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c));
            return redirectResponse;
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - stores (public URLs)
         * - api/payfast/itn (webhook bypass)
         */
        '/((?!_next/static|_next/image|favicon.ico|api/payfast/itn|stores|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
