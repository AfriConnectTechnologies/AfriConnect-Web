/**
 * Feature Flags Configuration
 * 
 * This file contains feature flags that control various functionality
 * across the application. Feature flags are controlled via environment variables.
 */

/**
 * COMMERCE_ENABLED controls all payment, cart, checkout, and order functionality.
 * When set to false:
 * - Cart, Orders, and Billing pages show "Coming Soon" messaging
 * - Add to Cart buttons are disabled
 * - Checkout functionality is disabled
 * - Payment APIs return 503 Service Unavailable
 * 
 * Set via: NEXT_PUBLIC_ENABLE_COMMERCE=true|false
 */
export const COMMERCE_ENABLED = process.env.NEXT_PUBLIC_ENABLE_COMMERCE === "true";
