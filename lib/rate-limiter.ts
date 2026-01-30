/**
 * Rate limiter with Upstash Redis for production (distributed)
 * Falls back to in-memory for local development
 * 
 * Required env vars for production:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Check if Upstash Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_TOKEN
);

// Lazy-init Redis client
let redis: Redis | null = null;
function getRedis(): Redis {
  if (!redis && isRedisConfigured) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis!;
}

// Cache of Ratelimit instances by config key
const rateLimiters = new Map<string, Ratelimit>();

function getRateLimiter(config: RateLimiterConfig): Ratelimit {
  const key = `${config.windowMs}:${config.maxRequests}`;
  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
      analytics: true,
      prefix: "ratelimit",
    }));
  }
  return rateLimiters.get(key)!;
}

// In-memory fallback for development
const rateLimitStore = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60 * 1000;
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

function checkRateLimitInMemory(
  identifier: string,
  config: RateLimiterConfig
): RateLimitResult {
  cleanupExpiredEntries();
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      limit: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      limit: config.maxRequests,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    limit: config.maxRequests,
    resetAt: entry.resetAt,
  };
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 * Uses Upstash Redis in production, in-memory in development
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimiterConfig
): Promise<RateLimitResult> {
  // Use in-memory for development or if Redis not configured
  if (!isRedisConfigured) {
    return checkRateLimitInMemory(identifier, config);
  }

  try {
    const limiter = getRateLimiter(config);
    const result = await limiter.limit(identifier);
    const now = Date.now();
    
    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      resetAt: result.reset,
      retryAfter: result.success ? undefined : Math.ceil((result.reset - now) / 1000),
    };
  } catch (error) {
    // Fallback to in-memory if Redis fails
    console.warn("[RateLimiter] Redis error, falling back to in-memory:", error);
    return checkRateLimitInMemory(identifier, config);
  }
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
    "X-RateLimit-Limit": String(result.limit),
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
