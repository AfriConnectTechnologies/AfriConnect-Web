/**
 * In-memory rate limiter for API endpoints
 * Can be upgraded to Redis for distributed rate limiting in production
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const CLEANUP_INTERVAL = 60 * 1000; // 1 minute
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., userId, IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimiterConfig
): RateLimitResult {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
  
  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const RateLimits = {
  // Payment initialization: 5 requests per minute per user
  PAYMENT_INIT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Payment verification: 10 requests per minute per user
  PAYMENT_VERIFY: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },
  // Subscription checkout: 3 requests per minute per user
  SUBSCRIPTION_CHECKOUT: {
    windowMs: 60 * 1000,
    maxRequests: 3,
  },
  // Webhook: 100 requests per minute (from Chapa's side)
  WEBHOOK: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  // General API: 60 requests per minute
  GENERAL: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
} as const;

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.remaining + (result.success ? 0 : 1)),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfter && { "Retry-After": String(result.retryAfter) }),
  };
}

/**
 * Helper to create a rate-limited response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...createRateLimitHeaders(result),
      },
    }
  );
}
