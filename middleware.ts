import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// We use a more aggressive regex to ensure any variation of the reporting path is public
const isPublicRoute = createRouteMatcher([
  '/', 
  '/report-found(.*)',      // Matches /report-found, /report-found/success, etc.
  '/reportfound(.*)',       // Catch-all for missing dashes
  '/scan/(.*)', 
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/forgot-password(.*)',
  '/api/uploadthing(.*)'    // Allow image uploads if you use UploadThing
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // 1. Logic for Authenticated users on Auth pages
  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up');
  
  if (userId && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Protect everything EXCEPT the public routes
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // This regex tells Next.js to run the middleware on all routes 
    // EXCEPT static files (images, css, etc.)
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};