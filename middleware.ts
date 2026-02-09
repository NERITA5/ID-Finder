import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. PUBLIC ROUTES: These routes do NOT require a login
const isPublicRoute = createRouteMatcher([
  '/', 
  '/v/(.*)',                // CRITICAL: This allows the QR scan (/v/vault-slug) to work
  '/report-found(.*)',      // Allows the reporting form to be viewed
  '/scan/(.*)',             // Backup scan route
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/forgot-password(.*)',
  '/api/uploadthing(.*)' 
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // 1. If user is logged in and tries to go to Sign-In/Sign-Up, send them to Dashboard
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  
  if (userId && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Protect everything EXCEPT the public routes defined above
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // This regex ensures middleware runs for all pages except internal Next.js files and static assets
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};