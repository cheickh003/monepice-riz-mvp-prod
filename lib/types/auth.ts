/**
 * Authentication Type Definitions for MonEpice&Riz
 * 
 * This file contains TypeScript type definitions for authentication-related
 * data structures used throughout the application. These types provide a
 * clean abstraction over Appwrite's user model while ensuring type safety.
 * 
 * Phone Number Format:
 * All phone numbers in this application follow Côte d'Ivoire standards:
 * - International: +225XXXXXXXX (country code + 8 digits)
 * - National: 0XXXXXXXXX (0 + 9 digits)  
 * - Local: XXXXXXXXXX (10 digits)
 * - Legacy: XXXXXXXX (8 digits - old format)
 * 
 * @fileoverview Authentication types and interfaces
 */

import type { IvorianPhoneNumber } from '@/lib/utils/phone'

/**
 * User role enumeration
 * Defines the different types of users in the system
 */
export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  STAFF = 'staff',
}

/**
 * Store code enumeration
 * Represents the available store locations
 */
export enum StoreCode {
  COCODY = 'COCODY',
  KOUMASSI = 'KOUMASSI',
}

/**
 * Base user interface
 * Core user properties from Appwrite
 */
export interface User {
  /** Unique user identifier from Appwrite */
  $id: string;
  
  /** User's email address (optional for phone-only registration) */
  email?: string;
  
  /** Verified email address */
  emailVerification: boolean;
  
  /** User's full name */
  name: string;
  
  /** 
   * User's phone number in Côte d'Ivoire format
   * @format +225XXXXXXXX | 0XXXXXXXXX | XXXXXXXXXX
   * @example "+2250143215478" | "0143215478" | "1234567890"
   */
  phone: IvorianPhoneNumber;
  
  /** Verified phone number */
  phoneVerification: boolean;
  
  /** User role in the system */
  role: UserRole;
  
  /** User labels for categorization */
  labels: string[];
  
  /** User preferences and settings */
  prefs: UserPreferences;
  
  /** Account creation timestamp */
  $createdAt: string;
  
  /** Last update timestamp */
  $updatedAt: string;
}

/**
 * User preferences interface
 * Stored in Appwrite user.prefs field
 */
export interface UserPreferences {
  /** Preferred store location */
  preferredStore?: StoreCode;
  
  /** Notification preferences */
  notifications: {
    sms: boolean;
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  
  /** Language preference */
  language: 'fr' | 'en';
  
  /** Theme preference */
  theme: 'light' | 'dark' | 'system';
  
  /** Marketing consent */
  marketingConsent: boolean;
  
  /** Terms acceptance timestamp */
  termsAcceptedAt?: string;
  
  /** Privacy policy acceptance timestamp */
  privacyAcceptedAt?: string;
}

/**
 * Customer profile interface
 * Extended customer information stored in database
 */
export interface CustomerProfile {
  /** Customer ID (same as user ID) */
  $id: string;
  
  /** Reference to user account */
  userId: string;
  
  /** Loyalty points balance */
  loyaltyPoints: number;
  
  /** Total number of orders */
  totalOrders: number;
  
  /** Total amount spent */
  totalSpent: number;
  
  /** Customer tier (new, regular, vip) */
  tier: 'new' | 'regular' | 'vip';
  
  /** Last order date */
  lastOrderAt?: string;
  
  /** Customer addresses */
  addresses: Address[];
  
  /** Customer creation timestamp */
  $createdAt: string;
  
  /** Last update timestamp */
  $updatedAt: string;
}

/**
 * Customer address interface
 */
export interface Address {
  /** Address ID */
  $id: string;
  
  /** Address label (Home, Work, etc.) */
  label: string;
  
  /** Street address */
  street: string;
  
  /** Zone/district */
  zone: string;
  
  /** Building name/number */
  building?: string;
  
  /** Apartment/unit number */
  apartment?: string;
  
  /** City (always Abidjan for now) */
  city: string;
  
  /** GPS coordinates */
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  /** Delivery instructions */
  instructions?: string;
  
  /** Is this the default address */
  isDefault: boolean;
  
  /** Address creation timestamp */
  $createdAt: string;
}

/**
 * Authentication state interface
 * Represents the current authentication status
 */
export interface AuthState {
  /** Currently authenticated user */
  user: User | null;
  
  /** Customer profile (if user is a customer) */
  customer: CustomerProfile | null;
  
  /** Loading state */
  loading: boolean;
  
  /** Initialization state */
  initialized: boolean;
  
  /** Current session ID */
  sessionId: string | null;
  
  /** Last authentication error */
  error: string | null;
}

/**
 * Login credentials interface
 * For email/password authentication
 */
export interface LoginCredentials {
  /** Email address */
  email: string;
  
  /** Password */
  password: string;
  
  /** Remember me option */
  remember?: boolean;
}

/**
 * Phone login credentials interface
 * For phone/OTP authentication (primary method in Côte d'Ivoire)
 */
export interface PhoneLoginCredentials {
  /** 
   * Phone number in Côte d'Ivoire format
   * @format +225XXXXXXXX | 0XXXXXXXXX | XXXXXXXXXX
   * @example "+2250143215478" | "0143215478" | "1234567890"
   */
  phone: IvorianPhoneNumber;
  
  /** OTP code */
  otp?: string;
  
  /** User ID from OTP generation step */
  userId?: string;
  
  /** Remember device option */
  remember?: boolean;
}

/**
 * Magic link credentials interface
 * For passwordless email authentication
 */
export interface MagicLinkCredentials {
  /** Email address */
  email: string;
  
  /** Optional redirect URL after verification */
  redirectUrl?: string;
}

/**
 * Magic link data interface
 * For magic link generation response
 */
export interface MagicLinkData {
  /** Email address */
  email: string;
  
  /** Magic link URL */
  url: string;
  
  /** Expiration time */
  expire: string;
}

/**
 * Registration data interface
 * For new user registration
 */
export interface RegistrationData {
  /** Full name */
  name: string;
  
  /** Email address (optional) */
  email?: string;
  
  /** Phone number (required) */
  phone: string;
  
  /** Password */
  password: string;
  
  /** Password confirmation */
  confirmPassword: string;
  
  /** Preferred store */
  preferredStore: StoreCode;
  
  /** Marketing consent */
  marketingConsent: boolean;
  
  /** Terms acceptance */
  acceptTerms: boolean;
  
  /** Privacy policy acceptance */
  acceptPrivacy: boolean;
}

/**
 * Password reset data interface
 */
export interface PasswordResetData {
  /** Email address */
  email: string;
  
  /** Reset token */
  token?: string;
  
  /** New password */
  newPassword?: string;
  
  /** Confirm new password */
  confirmPassword?: string;
}

/**
 * OTP verification data interface
 */
export interface OTPVerificationData {
  /** Phone number */
  phone: string;
  
  /** OTP code */
  otp: string;
  
  /** Verification type */
  type: 'login' | 'registration' | 'password_reset';
}

/**
 * User update data interface
 * For updating user profile information
 */
export interface UserUpdateData {
  /** Updated name */
  name?: string;
  
  /** Updated email */
  email?: string;
  
  /** Updated phone */
  phone?: string;
  
  /** Updated preferences */
  preferences?: Partial<UserPreferences>;
}

/**
 * Authentication context interface
 * Used by the AuthProvider component
 */
export interface AuthContextType extends AuthState {
  /** Current authentication state inherited from AuthState */
  
  /** Login with email and password */
  login: (credentials: LoginCredentials) => Promise<void>;
  
  /** Login with phone and OTP */
  loginWithPhone: (credentials: PhoneLoginCredentials) => Promise<any>;
  
  /** Login with magic link */
  loginWithMagicLink: (credentials: MagicLinkCredentials) => Promise<any>;
  
  /** Register new user */
  register: (data: RegistrationData) => Promise<void>;
  
  /** Logout current user */
  logout: () => Promise<void>;
  
  /** Send password reset email */
  resetPassword: (email: string) => Promise<void>;
  
  /** Confirm password reset */
  confirmPasswordReset: (data: PasswordResetData) => Promise<void>;
  
  /** Send OTP to phone */
  sendOTP: (phone: string, type: OTPVerificationData['type']) => Promise<any>;
  
  /** Verify OTP code */
  verifyOTP: (data: OTPVerificationData & { userId: string }) => Promise<any>;
  
  /** Update user profile */
  updateProfile: (data: UserUpdateData) => Promise<void>;
  
  /** Refresh current session */
  refreshSession: () => Promise<void>;
  
  /** Clear authentication error */
  clearError: () => void;
}

/**
 * Authentication error types
 */
export enum AuthError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  PHONE_ALREADY_EXISTS = 'PHONE_ALREADY_EXISTS',
  INVALID_OTP = 'INVALID_OTP',
  OTP_EXPIRED = 'OTP_EXPIRED',
  MAGIC_LINK_INVALID = 'MAGIC_LINK_INVALID',
  MAGIC_LINK_EXPIRED = 'MAGIC_LINK_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Authentication error interface
 */
export interface AuthErrorDetails {
  /** Error type */
  type: AuthError;
  
  /** Human-readable error message */
  message: string;
  
  /** Technical error details */
  details?: string;
  
  /** Error code from Appwrite */
  code?: number;
}

/**
 * Session information interface
 */
export interface SessionInfo {
  /** Session ID */
  $id: string;
  
  /** User ID */
  userId: string;
  
  /** Session creation timestamp */
  $createdAt: string;
  
  /** Session expiration timestamp */
  expire: string;
  
  /** Device information */
  provider: string;
  
  /** IP address */
  ip: string;
  
  /** User agent */
  userAgent: string;
  
  /** Current session flag */
  current: boolean;
}

/**
 * Type guards for authentication types
 */
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj.$id === 'string' && typeof obj.name === 'string';
};

export const isCustomer = (obj: any): obj is CustomerProfile => {
  return obj && typeof obj.$id === 'string' && typeof obj.userId === 'string';
};

export const isAuthError = (obj: any): obj is AuthErrorDetails => {
  return obj && Object.values(AuthError).includes(obj.type);
};

/**
 * Default values for authentication state
 */
export const defaultAuthState: AuthState = {
  user: null,
  customer: null,
  loading: false,
  initialized: false,
  sessionId: null,
  error: null,
};

export const defaultUserPreferences: UserPreferences = {
  notifications: {
    sms: true,
    email: true,
    push: true,
    marketing: false,
  },
  language: 'fr',
  theme: 'system',
  marketingConsent: false,
};