/**
 * Appwrite Configuration for MonEpice&Riz
 * 
 * This file contains the central Appwrite client configuration and exports
 * pre-configured service instances for use throughout the application.
 * 
 * Services exported:
 * - client: Main Appwrite client instance
 * - account: User authentication and account management
 * - databases: Database operations (CRUD)
 * - storage: File storage and management
 * - functions: Cloud function execution
 * 
 * @see https://appwrite.io/docs/references
 */

import { Client, Account, Databases, Storage, Functions } from 'appwrite'
import { COLLECTION_IDS } from '@/lib/config/collections'
import { BUCKET_IDS } from '@/lib/config/storage'

// Environment variables validation
const requiredEnvVars = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT,
} as const

// Validate required environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(
      `Missing required environment variable: NEXT_PUBLIC_APPWRITE_${key.toUpperCase()}\n` +
      'Please check your .env.local file and ensure all Appwrite variables are set correctly.\n' +
      'See .env.example for reference.'
    )
  }
})

/**
 * Main Appwrite client instance
 * Configured with endpoint and project ID from environment variables
 */
export const client = new Client()
  .setEndpoint(requiredEnvVars.endpoint!)
  .setProject(requiredEnvVars.projectId!)

/**
 * Account service for user authentication and management
 * 
 * Usage:
 * - Login/logout users
 * - Register new accounts
 * - Manage user sessions
 * - Update user preferences
 * 
 * @example
 * ```typescript
 * // Login user
 * const session = await account.createEmailPasswordSession(email, password)
 * 
 * // Get current user
 * const user = await account.get()
 * 
 * // Logout
 * await account.deleteSession('current')
 * ```
 */
export const account = new Account(client)

/**
 * Databases service for data management
 * 
 * Usage:
 * - CRUD operations on documents
 * - Query collections
 * - Manage database permissions
 * 
 * @example
 * ```typescript
 * // Create document
 * const document = await databases.createDocument(
 *   databaseId,
 *   collectionId,
 *   'unique()',
 *   data
 * )
 * 
 * // List documents
 * const documents = await databases.listDocuments(
 *   databaseId,
 *   collectionId,
 *   [Query.equal('status', 'active')]
 * )
 * ```
 */
export const databases = new Databases(client)

/**
 * Storage service for file management
 * 
 * Usage:
 * - Upload/download files
 * - Manage file permissions
 * - Generate file previews
 * 
 * @example
 * ```typescript
 * // Upload file
 * const file = await storage.createFile(
 *   bucketId,
 *   'unique()',
 *   fileInput.files[0]
 * )
 * 
 * // Get file URL
 * const url = storage.getFileView(bucketId, fileId)
 * ```
 */
export const storage = new Storage(client)

/**
 * Functions service for serverless function execution
 * 
 * Usage:
 * - Execute cloud functions
 * - Handle background tasks
 * - Process webhooks
 * 
 * @example
 * ```typescript
 * // Execute function
 * const result = await functions.createExecution(
 *   functionId,
 *   JSON.stringify(data)
 * )
 * ```
 */
export const functions = new Functions(client)

/**
 * Configuration constants for the application
 * These IDs should be set in your environment variables
 */
export const appwriteConfig = {
  endpoint: requiredEnvVars.endpoint!,
  projectId: requiredEnvVars.projectId!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
  storageId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_ID,
  
  // Collection IDs imported from configuration
  collections: COLLECTION_IDS,
  
  // Storage bucket IDs imported from configuration
  buckets: BUCKET_IDS,
} as const

/**
 * Helper function to check if Appwrite is properly configured
 * @returns boolean indicating if configuration is valid
 */
export const isAppwriteConfigured = (): boolean => {
  return !!(
    appwriteConfig.endpoint &&
    appwriteConfig.projectId &&
    appwriteConfig.databaseId &&
    appwriteConfig.storageId
  )
}

/**
 * Helper function to get environment-specific project ID
 * Useful for switching between dev/staging/prod environments
 */
export const getProjectId = (): string => {
  const environment = process.env.NODE_ENV || 'development'
  
  switch (environment) {
    case 'production':
      return process.env.NEXT_PUBLIC_APPWRITE_PROJECT_PRODUCTION || appwriteConfig.projectId
    case 'staging':
      return process.env.NEXT_PUBLIC_APPWRITE_PROJECT_STAGING || appwriteConfig.projectId
    default:
      return appwriteConfig.projectId
  }
}

// Export types for TypeScript
export type AppwriteConfig = typeof appwriteConfig
export type CollectionId = keyof typeof appwriteConfig.collections
export type BucketId = keyof typeof appwriteConfig.buckets