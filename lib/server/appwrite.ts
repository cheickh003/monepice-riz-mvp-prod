/**
 * Server-side Appwrite Client Factory
 * 
 * This module provides utilities for creating authenticated Appwrite clients
 * on the server-side, handling session cookies for API routes and server actions.
 */

import { Client, Account, Databases, Storage, Functions } from 'appwrite'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Session cookie name used by Appwrite
const SESSION_COOKIE = 'a_session_' + process.env.NEXT_PUBLIC_APPWRITE_PROJECT

/**
 * Create an authenticated Appwrite client from request cookies
 * @param request - Next.js request object or cookies from headers()
 * @returns Configured Appwrite client with session
 */
export function createServerClient(request?: NextRequest): Client {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)

  // Get session cookie
  let sessionCookie: string | undefined

  if (request) {
    // From API routes
    sessionCookie = request.cookies.get(SESSION_COOKIE)?.value
  } else {
    // From server components/actions
    try {
      const cookieStore = cookies()
      sessionCookie = cookieStore.get(SESSION_COOKIE)?.value
    } catch (error) {
      // cookies() not available in this context
      console.warn('Unable to access cookies in server context')
    }
  }

  if (sessionCookie) {
    client.setSession(sessionCookie)
  }

  return client
}

/**
 * Create an authenticated Account service instance
 * @param request - Optional Next.js request object
 * @returns Account service with session
 */
export function createServerAccount(request?: NextRequest): Account {
  const client = createServerClient(request)
  return new Account(client)
}

/**
 * Create an authenticated Databases service instance
 * @param request - Optional Next.js request object
 * @returns Databases service with session
 */
export function createServerDatabases(request?: NextRequest): Databases {
  const client = createServerClient(request)
  return new Databases(client)
}

/**
 * Create an authenticated Storage service instance
 * @param request - Optional Next.js request object
 * @returns Storage service with session
 */
export function createServerStorage(request?: NextRequest): Storage {
  const client = createServerClient(request)
  return new Storage(client)
}

/**
 * Create an authenticated Functions service instance
 * @param request - Optional Next.js request object
 * @returns Functions service with session
 */
export function createServerFunctions(request?: NextRequest): Functions {
  const client = createServerClient(request)
  return new Functions(client)
}

/**
 * Get current user from server-side session
 * @param request - Optional Next.js request object
 * @returns User account or null if not authenticated
 */
export async function getServerUser(request?: NextRequest) {
  try {
    const account = createServerAccount(request)
    return await account.get()
  } catch (error) {
    // User is not authenticated or session is invalid
    return null
  }
}

/**
 * Verify if user is authenticated on server-side
 * @param request - Optional Next.js request object
 * @returns Boolean indicating authentication status
 */
export async function isAuthenticated(request?: NextRequest): Promise<boolean> {
  const user = await getServerUser(request)
  return user !== null
}

/**
 * Get current session information
 * @param request - Optional Next.js request object
 * @returns Session information or null
 */
export async function getServerSession(request?: NextRequest) {
  try {
    const account = createServerAccount(request)
    return await account.getSession('current')
  } catch (error) {
    return null
  }
}

/**
 * Middleware helper to check authentication
 * @param request - Next.js request object
 * @returns Boolean indicating if request is authenticated
 */
export async function checkAuth(request: NextRequest): Promise<boolean> {
  return await isAuthenticated(request)
}

/**
 * Get user preferences from server-side
 * @param request - Optional Next.js request object
 * @returns User preferences or null
 */
export async function getServerUserPrefs(request?: NextRequest) {
  try {
    const account = createServerAccount(request)
    return await account.getPrefs()
  } catch (error) {
    return null
  }
}

/**
 * Admin client factory (uses API key for administrative operations)
 * @returns Client configured with API key for admin operations
 */
export function createAdminClient(): Client {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)

  // Use API key for admin operations
  if (process.env.APPWRITE_API_KEY) {
    client.setKey(process.env.APPWRITE_API_KEY)
  }

  return client
}

/**
 * Create admin services for backend operations
 */
export function createAdminServices() {
  const client = createAdminClient()
  
  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
    functions: new Functions(client),
  }
}

/**
 * Utility to extract session token from various sources
 * @param request - Request object, cookie string, or undefined
 * @returns Session token or undefined
 */
export function extractSessionToken(request?: NextRequest | string): string | undefined {
  if (typeof request === 'string') {
    // Direct session token
    return request
  }

  if (request && typeof request === 'object' && 'cookies' in request) {
    // NextRequest object
    return request.cookies.get(SESSION_COOKIE)?.value
  }

  // Try to get from cookies() if available
  try {
    const cookieStore = cookies()
    return cookieStore.get(SESSION_COOKIE)?.value
  } catch {
    return undefined
  }
}

/**
 * Type definitions
 */
export interface ServerContext {
  client: Client
  account: Account
  databases: Databases
  storage: Storage
  functions: Functions
  user: any | null
}

/**
 * Create a complete server context with all services and user info
 * @param request - Optional Next.js request object
 * @returns Complete server context
 */
export async function createServerContext(request?: NextRequest): Promise<ServerContext> {
  const client = createServerClient(request)
  const account = new Account(client)
  const databases = new Databases(client)
  const storage = new Storage(client)
  const functions = new Functions(client)

  // Try to get current user
  let user = null
  try {
    user = await account.get()
  } catch (error) {
    // User not authenticated
  }

  return {
    client,
    account,
    databases,
    storage,
    functions,
    user,
  }
}

/**
 * Error handling utilities
 */
export class ServerAuthError extends Error {
  constructor(message: string, public code?: number) {
    super(message)
    this.name = 'ServerAuthError'
  }
}

/**
 * Helper to handle common server-side auth errors
 * @param error - Error from Appwrite
 * @returns Standardized error response
 */
export function handleServerAuthError(error: any): ServerAuthError {
  if (error.code === 401) {
    return new ServerAuthError('Unauthorized - Invalid or expired session', 401)
  }
  
  if (error.code === 403) {
    return new ServerAuthError('Forbidden - Insufficient permissions', 403)
  }

  return new ServerAuthError(error.message || 'Authentication error', error.code)
}

/**
 * Configuration constants
 */
export const SERVER_CONFIG = {
  SESSION_COOKIE,
  DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  STORAGE_ID: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID!,
} as const