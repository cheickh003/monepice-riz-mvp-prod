/**
 * Phone Number Utilities for Côte d'Ivoire
 * 
 * This module provides utilities for validating, formatting, and handling
 * Côte d'Ivoire phone numbers in the MonEpice&Riz application.
 * 
 * Supported formats:
 * - International: +225XXXXXXXX (country code + 8 digits)
 * - National: 0XXXXXXXXX (0 + 9 digits)
 * - Local: XXXXXXXXXX (10 digits)
 * - Legacy: XXXXXXXX (8 digits - old format)
 * 
 * @fileoverview Phone number validation and formatting utilities
 */

/**
 * Type definition for a valid Ivorian phone number
 * 
 * @example
 * ```typescript
 * const phone1: IvorianPhoneNumber = "+2250143215478"; // Valid
 * const phone2: IvorianPhoneNumber = "0143215478";     // Valid
 * const phone3: IvorianPhoneNumber = "1234567890";     // Valid
 * ```
 */
export type IvorianPhoneNumber = string & { readonly __brand: unique symbol }

/**
 * Côte d'Ivoire country code
 */
export const CI_COUNTRY_CODE = '225' as const

/**
 * Phone number validation patterns for Côte d'Ivoire
 */
export const CI_PHONE_PATTERNS = {
  /** International format: +225XXXXXXXX */
  INTERNATIONAL: /^\+225[0-9]{8}$/,
  
  /** National format with leading zero: 0XXXXXXXXX */
  NATIONAL: /^0[0-9]{9}$/,
  
  /** Local format (10 digits): XXXXXXXXXX */
  LOCAL_10: /^[0-9]{10}$/,
  
  /** Legacy format (8 digits): XXXXXXXX */
  LEGACY_8: /^[0-9]{8}$/,
  
  /** Combined pattern for all valid formats */
  ANY_VALID: /^(\+225[0-9]{8}|0[0-9]{9}|[0-9]{10}|[0-9]{8})$/,
} as const

/**
 * Mobile network prefixes in Côte d'Ivoire
 * Used for identifying the mobile operator
 */
export const CI_MOBILE_PREFIXES = {
  ORANGE: ['07', '08', '09'],
  MTN: ['05', '06'],
  MOOV: ['01', '02', '03'],
} as const

/**
 * Phone number format types
 */
export enum PhoneFormat {
  /** +225XXXXXXXX */
  INTERNATIONAL = 'international',
  /** 0XXXXXXXXX */
  NATIONAL = 'national',
  /** XXXXXXXXXX */
  LOCAL = 'local',
  /** XXXXXXXX (legacy) */
  LEGACY = 'legacy',
}

/**
 * Mobile operator identification
 */
export enum MobileOperator {
  ORANGE = 'ORANGE',
  MTN = 'MTN',
  MOOV = 'MOOV',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Phone number validation result interface
 */
export interface PhoneValidationResult {
  /** Whether the phone number is valid */
  isValid: boolean;
  
  /** The detected format */
  format?: PhoneFormat;
  
  /** The identified mobile operator */
  operator?: MobileOperator;
  
  /** Cleaned phone number (digits only) */
  cleaned?: string;
  
  /** Formatted versions of the phone number */
  formatted?: {
    international: string;
    national: string;
    local: string;
    display: string;
  };
  
  /** Error message if validation failed */
  error?: string;
}

/**
 * Validates if a phone number is a valid Côte d'Ivoire phone number
 * 
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid for Côte d'Ivoire
 * 
 * @example
 * ```typescript
 * isValidIvorianPhone("+2250143215478") // true
 * isValidIvorianPhone("0143215478")     // true
 * isValidIvorianPhone("1234567890")     // true
 * isValidIvorianPhone("12345678")       // true (legacy)
 * isValidIvorianPhone("123")            // false
 * ```
 */
export function isValidIvorianPhone(phone: string): phone is IvorianPhoneNumber {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/\D/g, '')
  
  // Check for valid Ivorian phone number patterns
  if (cleaned.startsWith('225')) {
    // International format: 225 + 8 digits = 11 total
    return cleaned.length === 11
  } else if (cleaned.startsWith('0')) {
    // National format: 0 + 9 digits = 10 total
    return cleaned.length === 10
  } else {
    // Local format: 10 digits or legacy 8 digits
    return cleaned.length === 10 || cleaned.length === 8
  }
}

/**
 * Comprehensive phone number validation with detailed results
 * 
 * @param phone - The phone number to validate
 * @returns Detailed validation results including format and operator info
 * 
 * @example
 * ```typescript
 * const result = validateIvorianPhone("+2250143215478")
 * if (result.isValid) {
 *   console.log(`Operator: ${result.operator}`)
 *   console.log(`Format: ${result.format}`)
 *   console.log(`Display: ${result.formatted?.display}`)
 * }
 * ```
 */
export function validateIvorianPhone(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Le numéro de téléphone est requis',
    }
  }
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 0) {
    return {
      isValid: false,
      error: 'Le numéro de téléphone ne contient aucun chiffre',
    }
  }
  
  let format: PhoneFormat
  let nationalNumber: string
  
  // Determine format and extract national number
  if (cleaned.startsWith('225')) {
    if (cleaned.length !== 11) {
      return {
        isValid: false,
        error: 'Le format international doit contenir 11 chiffres (+225XXXXXXXX)',
      }
    }
    format = PhoneFormat.INTERNATIONAL
    nationalNumber = cleaned.slice(3) // Remove country code
  } else if (cleaned.startsWith('0')) {
    if (cleaned.length !== 10) {
      return {
        isValid: false,
        error: 'Le format national doit contenir 10 chiffres (0XXXXXXXXX)',
      }
    }
    format = PhoneFormat.NATIONAL
    nationalNumber = cleaned.slice(1) // Remove leading 0
  } else if (cleaned.length === 10) {
    format = PhoneFormat.LOCAL
    nationalNumber = cleaned
  } else if (cleaned.length === 8) {
    format = PhoneFormat.LEGACY
    nationalNumber = cleaned
  } else {
    return {
      isValid: false,
      error: 'Format de numéro non valide. Utilisez +225XXXXXXXX, 0XXXXXXXXX, ou XXXXXXXXXX',
    }
  }
  
  // For legacy 8-digit numbers, we need to handle them differently
  let fullNationalNumber: string
  if (format === PhoneFormat.LEGACY) {
    // Legacy 8-digit numbers are still valid but we display them as-is
    fullNationalNumber = nationalNumber
  } else {
    fullNationalNumber = nationalNumber.length === 8 ? nationalNumber : nationalNumber.slice(-8)
  }
  
  // Identify mobile operator based on prefix
  const operator = identifyMobileOperator(fullNationalNumber)
  
  // Generate formatted versions
  const formatted = {
    international: `+225${fullNationalNumber}`,
    national: `0${fullNationalNumber}`,
    local: fullNationalNumber,
    display: format === PhoneFormat.INTERNATIONAL 
      ? `+225 ${fullNationalNumber.slice(0, 2)} ${fullNationalNumber.slice(2, 4)} ${fullNationalNumber.slice(4, 6)} ${fullNationalNumber.slice(6)}`
      : format === PhoneFormat.NATIONAL
      ? `0${fullNationalNumber.slice(0, 2)} ${fullNationalNumber.slice(2, 4)} ${fullNationalNumber.slice(4, 6)} ${fullNationalNumber.slice(6)}`
      : `${fullNationalNumber.slice(0, 2)} ${fullNationalNumber.slice(2, 4)} ${fullNationalNumber.slice(4, 6)} ${fullNationalNumber.slice(6)}`
  }
  
  return {
    isValid: true,
    format,
    operator,
    cleaned,
    formatted,
  }
}

/**
 * Convert phone number to international format
 * 
 * @param phone - The phone number to convert
 * @returns Phone number in international format (+225XXXXXXXX)
 * 
 * @example
 * ```typescript
 * toInternationalFormat("0143215478")  // "+2250143215478"
 * toInternationalFormat("1234567890")  // "+2251234567890"
 * toInternationalFormat("+2250143215478") // "+2250143215478" (already international)
 * ```
 */
export function toInternationalFormat(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone
  }
  
  const cleaned = phone.replace(/\D/g, '')
  
  // Already in international format
  if (cleaned.startsWith('225') && cleaned.length === 11) {
    return `+${cleaned}`
  }
  
  // National format (0XXXXXXXXX)
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+225${cleaned.slice(1)}`
  }
  
  // Local format (XXXXXXXXXX) - assume it's a full 10-digit number
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return `+225${cleaned}`
  }
  
  // Legacy format (XXXXXXXX) - assume it's an 8-digit number
  if (cleaned.length === 8) {
    return `+225${cleaned}`
  }
  
  // If we can't determine format, return original
  return phone
}

/**
 * Convert phone number to national format
 * 
 * @param phone - The phone number to convert
 * @returns Phone number in national format (0XXXXXXXXX)
 * 
 * @example
 * ```typescript
 * toNationalFormat("+2250143215478") // "0143215478"
 * toNationalFormat("1234567890")     // "01234567890"
 * toNationalFormat("0143215478")     // "0143215478" (already national)
 * ```
 */
export function toNationalFormat(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone
  }
  
  const cleaned = phone.replace(/\D/g, '')
  
  // International format (+225XXXXXXXX)
  if (cleaned.startsWith('225') && cleaned.length === 11) {
    return `0${cleaned.slice(3)}`
  }
  
  // Already in national format
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return cleaned
  }
  
  // Local format (XXXXXXXXXX)
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return `0${cleaned.slice(-9)}`
  }
  
  // Legacy format (XXXXXXXX)
  if (cleaned.length === 8) {
    return `0${cleaned}`
  }
  
  // If we can't determine format, return original
  return phone
}

/**
 * Format phone number for display with spacing
 * 
 * @param phone - The phone number to format
 * @returns Formatted phone number with proper spacing
 * 
 * @example
 * ```typescript
 * formatPhoneForDisplay("+2250143215478") // "+225 01 43 21 54 78"
 * formatPhoneForDisplay("0143215478")     // "01 43 21 54 78"
 * ```
 */
export function formatPhoneForDisplay(phone: string): string {
  const validation = validateIvorianPhone(phone)
  return validation.isValid && validation.formatted 
    ? validation.formatted.display 
    : phone
}

/**
 * Identify the mobile operator based on phone number prefix
 * 
 * @param phone - The phone number to analyze
 * @returns The identified mobile operator
 * 
 * @example
 * ```typescript
 * identifyMobileOperator("01432154")  // MobileOperator.MOOV
 * identifyMobileOperator("07432154")  // MobileOperator.ORANGE
 * identifyMobileOperator("05432154")  // MobileOperator.MTN
 * ```
 */
export function identifyMobileOperator(phone: string): MobileOperator {
  const cleaned = phone.replace(/\D/g, '')
  
  // Extract the first two digits (prefix)
  let prefix: string
  if (cleaned.startsWith('225')) {
    prefix = cleaned.slice(3, 5) // Skip country code
  } else if (cleaned.startsWith('0')) {
    prefix = cleaned.slice(1, 3) // Skip leading 0
  } else {
    prefix = cleaned.slice(0, 2) // First two digits
  }
  
  // Check against known prefixes
  if (CI_MOBILE_PREFIXES.ORANGE.includes(prefix)) {
    return MobileOperator.ORANGE
  } else if (CI_MOBILE_PREFIXES.MTN.includes(prefix)) {
    return MobileOperator.MTN
  } else if (CI_MOBILE_PREFIXES.MOOV.includes(prefix)) {
    return MobileOperator.MOOV
  }
  
  return MobileOperator.UNKNOWN
}

/**
 * Get mobile operator display information
 * 
 * @param operator - The mobile operator
 * @returns Display information for the operator
 */
export function getOperatorInfo(operator: MobileOperator) {
  const operatorInfo = {
    [MobileOperator.ORANGE]: {
      name: 'Orange Money',
      color: '#FF7900',
      logo: '/images/operators/orange.png',
      shortCode: 'OM',
    },
    [MobileOperator.MTN]: {
      name: 'MTN Mobile Money',
      color: '#FFD700',
      logo: '/images/operators/mtn.png',
      shortCode: 'MOMO',
    },
    [MobileOperator.MOOV]: {
      name: 'Moov Money',
      color: '#00A651',
      logo: '/images/operators/moov.png',
      shortCode: 'MOOV',
    },
    [MobileOperator.UNKNOWN]: {
      name: 'Opérateur Inconnu',
      color: '#6B7280',
      logo: '/images/operators/default.png',
      shortCode: 'TEL',
    },
  }
  
  return operatorInfo[operator]
}

/**
 * Clean phone number by removing all non-digit characters
 * 
 * @param phone - The phone number to clean
 * @returns Phone number with only digits
 * 
 * @example
 * ```typescript
 * cleanPhoneNumber("+225 01 43 21 54 78") // "2250143215478"
 * cleanPhoneNumber("01-43-21-54-78")      // "0143215478"
 * ```
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '')
}

/**
 * Check if two phone numbers are equivalent
 * 
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns True if phone numbers are equivalent
 * 
 * @example
 * ```typescript
 * arePhoneNumbersEqual("+2250143215478", "0143215478") // true
 * arePhoneNumbersEqual("01 43 21 54 78", "0143215478") // true
 * ```
 */
export function arePhoneNumbersEqual(phone1: string, phone2: string): boolean {
  const cleaned1 = cleanPhoneNumber(phone1)
  const cleaned2 = cleanPhoneNumber(phone2)
  
  // Normalize both numbers to the same format for comparison
  const normalize = (cleaned: string): string => {
    if (cleaned.startsWith('225')) {
      return cleaned.slice(3) // Remove country code
    } else if (cleaned.startsWith('0')) {
      return cleaned.slice(1) // Remove leading 0
    }
    return cleaned
  }
  
  return normalize(cleaned1) === normalize(cleaned2)
}

/**
 * Generate a random valid test phone number for development
 * 
 * @param operator - Preferred operator (optional)
 * @returns A valid test phone number
 * 
 * @example
 * ```typescript
 * generateTestPhoneNumber() // "0143215478"
 * generateTestPhoneNumber(MobileOperator.ORANGE) // "0743215478"
 * ```
 */
export function generateTestPhoneNumber(operator?: MobileOperator): IvorianPhoneNumber {
  const prefixes = {
    [MobileOperator.ORANGE]: CI_MOBILE_PREFIXES.ORANGE,
    [MobileOperator.MTN]: CI_MOBILE_PREFIXES.MTN,
    [MobileOperator.MOOV]: CI_MOBILE_PREFIXES.MOOV,
  }
  
  let prefix: string
  if (operator && operator !== MobileOperator.UNKNOWN && prefixes[operator]) {
    const operatorPrefixes = prefixes[operator]
    prefix = operatorPrefixes[Math.floor(Math.random() * operatorPrefixes.length)]
  } else {
    // Random operator
    const allPrefixes = [...CI_MOBILE_PREFIXES.ORANGE, ...CI_MOBILE_PREFIXES.MTN, ...CI_MOBILE_PREFIXES.MOOV]
    prefix = allPrefixes[Math.floor(Math.random() * allPrefixes.length)]
  }
  
  // Generate 6 random digits to complete the 8-digit number
  const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  
  return `0${prefix}${suffix}` as IvorianPhoneNumber
}

/**
 * Type guard to check if a string is a valid Ivorian phone number
 * Useful for TypeScript type narrowing
 */
export const assertIvorianPhone = (phone: string): asserts phone is IvorianPhoneNumber => {
  if (!isValidIvorianPhone(phone)) {
    throw new Error(`Invalid Ivorian phone number: ${phone}`)
  }
}

/**
 * Phone number validation error messages in French
 */
export const PHONE_ERROR_MESSAGES = {
  REQUIRED: 'Le numéro de téléphone est requis',
  INVALID_FORMAT: 'Format de numéro invalide. Utilisez +225XXXXXXXX, 0XXXXXXXXX, ou XXXXXXXXXX',
  INVALID_LENGTH: 'Le numéro doit contenir 8, 10, ou 11 chiffres',
  INVALID_PREFIX: 'Préfixe d\'opérateur non reconnu',
  NO_DIGITS: 'Le numéro ne contient aucun chiffre valide',
} as const

/**
 * Constants for validation and formatting
 */
export const PHONE_CONSTANTS = {
  COUNTRY_CODE: CI_COUNTRY_CODE,
  MIN_LENGTH: 8,  // Legacy format
  MAX_LENGTH: 11, // International format with +
  DISPLAY_SEPARATORS: [' ', '-', '.'],
} as const