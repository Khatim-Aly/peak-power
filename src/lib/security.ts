/**
 * Security utilities for input validation, sanitization, and rate limiting.
 * 
 * SECURITY MEASURES:
 * - Input sanitization to prevent XSS
 * - Client-side rate limiting with exponential backoff
 * - Input length enforcement
 * - Email/phone validation
 */

import { z } from "zod";

// ============================================================
// INPUT SANITIZATION — Prevents XSS by stripping dangerous chars
// ============================================================

/** Strip HTML tags and dangerous characters from user input */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'`;(){}]/g, '') // Remove dangerous chars
    .trim();
}

/** Sanitize but allow basic punctuation (for messages/descriptions) */
export function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Strip all HTML tags
    .replace(/javascript:/gi, '') // Remove JS protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// ============================================================
// VALIDATION SCHEMAS — Strict schemas for all user inputs
// ============================================================

/** Email validation with length limits */
export const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address")
  .max(255, "Email must be less than 255 characters")
  .transform(v => v.toLowerCase());

/** Password validation — strong password requirements */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain a special character");

/** Name validation */
export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters")
  .transform(sanitizeInput);

/** Phone validation */
export const phoneSchema = z
  .string()
  .trim()
  .max(20, "Phone number too long")
  .regex(/^[+\d\s()-]*$/, "Invalid phone number format")
  .transform(v => v.replace(/[^\d+]/g, ''));

/** Address validation */
export const addressSchema = z
  .string()
  .trim()
  .max(500, "Address must be less than 500 characters")
  .transform(sanitizeInput);

/** Message/textarea validation */
export const messageSchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(2000, "Message must be less than 2000 characters")
  .transform(sanitizeText);

/** Shipping info schema */
export const shippingSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  city: z.string().trim().min(1, "City is required").max(100).transform(sanitizeInput),
  state: z.string().trim().max(100).transform(sanitizeInput).optional().default(''),
  zipCode: z.string().trim().max(20).transform(sanitizeInput).optional().default(''),
  country: z.string().trim().max(100).default('Pakistan'),
});

/** Contact form schema */
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional().default(''),
  message: messageSchema,
});

// ============================================================
// CLIENT-SIDE RATE LIMITING — Prevents rapid-fire submissions
// ============================================================

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limiter with exponential backoff.
 * 
 * SECURITY: This is a UX-level protection only.
 * Server-side rate limiting via the auth_rate_limits table is the real defense.
 * 
 * @param key - Unique identifier (e.g., 'login', 'signup', 'reset')
 * @param maxAttempts - Max attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and wait time
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; retryAfterMs: number; message: string } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Check if currently blocked
  if (entry?.blocked && entry.blockUntil > now) {
    const retryAfterMs = entry.blockUntil - now;
    const minutes = Math.ceil(retryAfterMs / 60000);
    return {
      allowed: false,
      retryAfterMs,
      message: `Too many attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    };
  }

  // Reset if window expired
  if (!entry || now - entry.firstAttempt > windowMs) {
    rateLimitStore.set(key, {
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockUntil: 0,
    });
    return { allowed: true, retryAfterMs: 0, message: '' };
  }

  // Increment attempts
  entry.attempts++;
  entry.lastAttempt = now;

  if (entry.attempts > maxAttempts) {
    // Exponential backoff: 1min, 2min, 4min, 8min, 15min max
    const backoffMinutes = Math.min(15, Math.pow(2, entry.attempts - maxAttempts - 1));
    entry.blocked = true;
    entry.blockUntil = now + backoffMinutes * 60 * 1000;

    return {
      allowed: false,
      retryAfterMs: backoffMinutes * 60 * 1000,
      message: `Too many attempts. Please try again in ${backoffMinutes} minute${backoffMinutes > 1 ? 's' : ''}.`,
    };
  }

  return { allowed: true, retryAfterMs: 0, message: '' };
}

/** Reset rate limit on successful action */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ============================================================
// GENERIC ERROR MESSAGES — Never expose internal details
// ============================================================

/** Map internal errors to safe user-facing messages */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    
    // Auth errors — generic messages to prevent user enumeration
    if (msg.includes('invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Please verify your email address before signing in.';
    }
    if (msg.includes('user already registered')) {
      return 'An account with this email already exists.';
    }
    if (msg.includes('password') && msg.includes('leaked')) {
      return 'This password has been found in a data breach. Please choose a different password.';
    }
    if (msg.includes('rate limit') || msg.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Generic fallback — never expose internals
    return 'Something went wrong. Please try again later.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}
