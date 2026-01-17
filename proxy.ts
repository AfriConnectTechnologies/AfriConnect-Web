import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/navigation'
import { NextRequest } from 'next/server'

const intlMiddleware = createMiddleware(routing)

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/:locale',
  '/:locale/explore',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
  '/api(.*)',
])

export const proxy = clerkMiddleware(async (auth, request: NextRequest) => {
  // Handle internationalization first
  const response = intlMiddleware(request)
  
  // Protect non-public routes
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
  
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
