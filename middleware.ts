import { clerkMiddleware } from '@clerk/nextjs/server';

// Makes Clerk session available on every route.
// No routes are hard-blocked — access control is handled per-route.
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jld+json|webp|png|jpg|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
