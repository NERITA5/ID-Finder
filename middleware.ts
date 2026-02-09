import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. ADD YOUR REPORTING ROUTES HERE
const isPublicRoute = createRouteMatcher([
  '/', 
  '/report-found(.*)',      // Allows anyone to access the report page
  '/scan/(.*)',             // If you use a URL like /scan/[slug]
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/forgot-password(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const isAuthPage = request.nextUrl.pathname.startsWith('/sign-in') || 
                     request.nextUrl.pathname.startsWith('/sign-up');

  // 1. If logged in and trying to access sign-in/up, go to dashboard
  if (userId && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Protect private routes
  if (!isPublicRoute(request)) {
    // If not logged in, this will automatically redirect to sign-in
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Standard Next.js/Clerk matcher
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};