/**
 * Enhanced Authentication Services
 * 
 * This module implements phone OTP and magic link authentication
 * using Appwrite's verification features, with support for Côte d'Ivoire
 * phone number formats.
 */

import { ID } from 'appwrite'
import { account } from '@/lib/appwrite'
import { isValidIvorianPhone, toInternationalFormat, type IvorianPhoneNumber } from '@/lib/utils/phone'

// Types for authentication services
export interface PhoneAuthData {
  phone: IvorianPhoneNumber
  type: 'login' | 'registration' | 'password_reset'
}

export interface OTPVerificationData {
  userId: string
  otp: string
  phone?: IvorianPhoneNumber
  type?: 'login' | 'registration' | 'password_reset'
}

export interface MagicLinkData {
  email: string
  url?: string
}

export interface MagicLinkVerificationData {
  userId: string
  secret: string
}

// Error messages in French
export const AUTH_ERRORS = {
  INVALID_PHONE: 'Numéro de téléphone invalide. Utilisez le format +225XXXXXXXX',
  INVALID_OTP: 'Code OTP invalide ou expiré',
  OTP_EXPIRED: 'Le code OTP a expiré. Veuillez en demander un nouveau',
  PHONE_NOT_FOUND: 'Aucun compte associé à ce numéro de téléphone',
  PHONE_ALREADY_EXISTS: 'Un compte existe déjà avec ce numéro de téléphone',
  EMAIL_INVALID: 'Adresse e-mail invalide',
  EMAIL_NOT_FOUND: 'Aucun compte associé à cette adresse e-mail',
  MAGIC_LINK_INVALID: 'Lien magique invalide ou expiré',
  RATE_LIMIT_EXCEEDED: 'Trop de tentatives. Veuillez attendre avant de réessayer',
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion internet',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
} as const

/**
 * Phone Number Authentication Services
 */

/**
 * Send OTP to phone number
 * @param phone - Phone number in Côte d'Ivoire format
 * @param type - Type of OTP verification
 * @returns Promise with OTP session data
 */
export async function sendPhoneOTP(phone: string, type: PhoneAuthData['type']) {
  try {
    // Validate phone number format
    if (!isValidIvorianPhone(phone)) {
      throw new Error(AUTH_ERRORS.INVALID_PHONE)
    }

    // Format phone number to international format
    const formattedPhone = toInternationalFormat(phone) as IvorianPhoneNumber

    // For Appwrite phone verification, we need to create a phone token
    const result = await account.createPhoneToken(
      ID.unique(),
      formattedPhone
    )

    return {
      success: true,
      userId: result.userId,
      expire: result.expire,
      phone: formattedPhone,
      type,
    }
  } catch (error: any) {
    console.error('Send OTP error:', error)
    
    if (error.code === 400) {
      throw new Error(AUTH_ERRORS.INVALID_PHONE)
    }
    
    if (error.code === 429) {
      throw new Error(AUTH_ERRORS.RATE_LIMIT_EXCEEDED)
    }

    if (error.message?.includes('network') || error.code === 500) {
      throw new Error(AUTH_ERRORS.NETWORK_ERROR)
    }

    throw new Error(error.message || AUTH_ERRORS.UNKNOWN_ERROR)
  }
}

/**
 * Verify OTP code and create session
 * @param data - OTP verification data
 * @returns Promise with session information
 */
export async function verifyPhoneOTP(data: OTPVerificationData) {
  try {
    // Validate required parameters
    if (!data.userId || !data.otp) {
      throw new Error('userId et code OTP sont requis')
    }

    // Create session with phone verification
    const session = await account.createSession(
      data.userId, // User ID from sendPhoneOTP
      data.otp     // OTP code entered by user
    )

    return {
      success: true,
      session,
      phone: data.phone,
    }
  } catch (error: any) {
    console.error('Verify OTP error:', error)
    
    if (error.code === 401 || error.message?.includes('invalid')) {
      throw new Error(AUTH_ERRORS.INVALID_OTP)
    }
    
    if (error.code === 404) {
      throw new Error(AUTH_ERRORS.PHONE_NOT_FOUND)
    }

    if (error.message?.includes('expired')) {
      throw new Error(AUTH_ERRORS.OTP_EXPIRED)
    }

    throw new Error(error.message || AUTH_ERRORS.UNKNOWN_ERROR)
  }
}

/**
 * Login with phone and OTP (two-step process)
 * @param phone - Phone number
 * @returns Promise with OTP session info
 */
export async function loginWithPhone(phone: string) {
  return await sendPhoneOTP(phone, 'login')
}

/**
 * Complete phone login with OTP
 * @param userId - User ID from OTP generation
 * @param otp - OTP code
 * @returns Promise with session
 */
export async function completePhoneLogin(userId: string, otp: string) {
  try {
    const session = await account.createSession(userId, otp)
    return {
      success: true,
      session,
    }
  } catch (error: any) {
    console.error('Complete phone login error:', error)
    
    if (error.code === 401) {
      throw new Error(AUTH_ERRORS.INVALID_OTP)
    }
    
    throw new Error(error.message || AUTH_ERRORS.UNKNOWN_ERROR)
  }
}

/**
 * Magic Link Authentication Services
 */

/**
 * Generate magic link for email authentication
 * @param email - User's email address
 * @param url - Redirect URL after verification (optional)
 * @returns Promise with magic link generation result
 */
export async function generateMagicLink(email: string, url?: string) {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error(AUTH_ERRORS.EMAIL_INVALID)
    }

    // Get redirect URL from environment variables or parameter
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const magicLinkRedirect = process.env.MAGIC_LINK_REDIRECT_URL || '/auth/magic-link/verify'
    const redirectUrl = url || `${baseUrl}${magicLinkRedirect}`

    // Create magic URL token
    const result = await account.createMagicURLToken(
      ID.unique(),
      email,
      redirectUrl
    )

    return {
      success: true,
      userId: result.userId,
      expire: result.expire,
      email,
    }
  } catch (error: any) {
    console.error('Generate magic link error:', error)
    
    if (error.code === 400) {
      throw new Error(AUTH_ERRORS.EMAIL_INVALID)
    }
    
    if (error.code === 404) {
      throw new Error(AUTH_ERRORS.EMAIL_NOT_FOUND)
    }
    
    if (error.code === 429) {
      throw new Error(AUTH_ERRORS.RATE_LIMIT_EXCEEDED)
    }

    throw new Error(error.message || AUTH_ERRORS.UNKNOWN_ERROR)
  }
}

/**
 * Verify magic link and create session
 * @param data - Magic link verification data
 * @returns Promise with session information
 */
export async function verifyMagicLink(data: MagicLinkVerificationData) {
  try {
    const session = await account.createSession(data.userId, data.secret)
    
    return {
      success: true,
      session,
    }
  } catch (error: any) {
    console.error('Verify magic link error:', error)
    
    if (error.code === 401 || error.message?.includes('invalid')) {
      throw new Error(AUTH_ERRORS.MAGIC_LINK_INVALID)
    }

    throw new Error(error.message || AUTH_ERRORS.UNKNOWN_ERROR)
  }
}

/**
 * Utility Functions
 */

/**
 * Format phone number for display
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneForAuth(phone: string): string {
  if (!phone) return ''
  
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('225')) {
    // International format: +225 XX XX XX XX XX
    const number = cleaned.slice(3)
    return `+225 ${number.slice(0, 2)} ${number.slice(2, 4)} ${number.slice(4, 6)} ${number.slice(6, 8)}`
  } else if (cleaned.startsWith('0')) {
    // National format: 0X XX XX XX XX
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`
  }
  
  return phone
}

/**
 * Validate and normalize phone number for auth
 * @param phone - Raw phone number input
 * @returns Normalized phone number or throws error
 */
export function validatePhoneForAuth(phone: string): IvorianPhoneNumber {
  if (!phone || typeof phone !== 'string') {
    throw new Error(AUTH_ERRORS.INVALID_PHONE)
  }

  const normalizedPhone = toInternationalFormat(phone)
  
  if (!isValidIvorianPhone(normalizedPhone)) {
    throw new Error(AUTH_ERRORS.INVALID_PHONE)
  }

  return normalizedPhone as IvorianPhoneNumber
}

/**
 * Check if error is related to rate limiting
 * @param error - Error object
 * @returns Boolean indicating if it's a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return error.code === 429 || error.message?.includes('rate limit') || error.message?.includes('too many')
}

/**
 * Get user-friendly error message
 * @param error - Error object
 * @returns User-friendly error message in French
 */
export function getAuthErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error
  }

  if (error.message && Object.values(AUTH_ERRORS).includes(error.message)) {
    return error.message
  }

  // Map common Appwrite error codes
  switch (error.code) {
    case 400:
      return AUTH_ERRORS.INVALID_PHONE
    case 401:
      return AUTH_ERRORS.INVALID_OTP
    case 404:
      return AUTH_ERRORS.PHONE_NOT_FOUND
    case 409:
      return AUTH_ERRORS.PHONE_ALREADY_EXISTS
    case 429:
      return AUTH_ERRORS.RATE_LIMIT_EXCEEDED
    case 500:
      return AUTH_ERRORS.NETWORK_ERROR
    default:
      return AUTH_ERRORS.UNKNOWN_ERROR
  }
}

/**
 * Registration helper with phone validation
 * @param phone - Phone number for registration
 * @returns Promise with registration OTP session
 */
export async function registerWithPhone(phone: string) {
  return await sendPhoneOTP(phone, 'registration')
}

/**
 * Password reset with phone OTP
 * @param phone - Phone number for password reset
 * @returns Promise with reset OTP session
 */
export async function resetPasswordWithPhone(phone: string) {
  return await sendPhoneOTP(phone, 'password_reset')
}

/**
 * Constants for rate limiting and validation
 */
export const AUTH_CONSTANTS = {
  OTP_EXPIRY_MINUTES: 5,
  MAGIC_LINK_EXPIRY_MINUTES: 30,
  MAX_OTP_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW_MINUTES: 15,
  MAX_REQUESTS_PER_WINDOW: 5,
} as const