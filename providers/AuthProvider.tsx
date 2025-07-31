/**
 * Authentication Provider for MonEpice&Riz
 * 
 * This React context provider manages authentication state using Appwrite.
 * It provides authentication methods and manages user session state throughout
 * the application lifecycle.
 * 
 * @fileoverview Authentication context provider using Appwrite
 */

'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { account, databases, appwriteConfig } from '@/lib/appwrite';
import { env } from '@/lib/config/environment';
import { 
  AuthContextType, 
  AuthState, 
  User, 
  CustomerProfile,
  LoginCredentials,
  PhoneLoginCredentials,
  RegistrationData,
  PasswordResetData,
  OTPVerificationData,
  UserUpdateData,
  AuthError,
  AuthErrorDetails,
  defaultAuthState,
  defaultUserPreferences,
  UserRole,
  StoreCode,
  isUser,
  isCustomer
} from '@/lib/types/auth';
import { captureError, setUserContext, addBreadcrumb } from '@/sentry.client.config';
import { ID, Query } from 'appwrite';

/**
 * Authentication Context
 * Provides authentication state and methods to child components
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props Interface
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  /**
   * Update authentication state helper
   */
  const updateAuthState = useCallback((updates: Partial<AuthState>) => {
    setAuthState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error: any): AuthErrorDetails => {
    let authError: AuthErrorDetails;

    // Map Appwrite errors to our error types
    switch (error?.code) {
      case 401:
        authError = {
          type: AuthError.INVALID_CREDENTIALS,
          message: 'Email ou mot de passe incorrect',
          code: error.code,
        };
        break;
      case 404:
        authError = {
          type: AuthError.USER_NOT_FOUND,
          message: 'Utilisateur introuvable',
          code: error.code,
        };
        break;
      case 409:
        if (error.message?.includes('email')) {
          authError = {
            type: AuthError.EMAIL_ALREADY_EXISTS,
            message: 'Cette adresse email est déjà utilisée',
            code: error.code,
          };
        } else if (error.message?.includes('phone')) {
          authError = {
            type: AuthError.PHONE_ALREADY_EXISTS,
            message: 'Ce numéro de téléphone est déjà utilisé',
            code: error.code,
          };
        } else {
          authError = {
            type: AuthError.UNKNOWN_ERROR,
            message: 'Un compte existe déjà avec ces informations',
            code: error.code,
          };
        }
        break;
      case 400:
        if (error.message?.includes('Invalid token')) {
          authError = {
            type: AuthError.INVALID_OTP,
            message: 'Code de vérification incorrect',
            code: error.code,
          };
        } else {
          authError = {
            type: AuthError.UNKNOWN_ERROR,
            message: 'Données invalides',
            code: error.code,
          };
        }
        break;
      default:
        authError = {
          type: AuthError.UNKNOWN_ERROR,
          message: error?.message || 'Une erreur inattendue s\'est produite',
          code: error?.code,
          details: error?.type,
        };
    }

    // Log error for debugging
    console.error('Auth Error:', authError);
    captureError(error instanceof Error ? error : new Error(authError.message), {
      auth_error_type: authError.type,
      error_code: authError.code,
    });

    return authError;
  }, []);

  /**
   * Load customer profile for authenticated user
   */
  const loadCustomerProfile = useCallback(async (userId: string): Promise<CustomerProfile | null> => {
    try {
      if (!appwriteConfig.databaseId) {
        console.warn('Database ID not configured');
        return null;
      }

      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.collections.customers,
        [Query.equal('userId', userId)]
      );

      if (response.documents.length > 0) {
        const customerDoc = response.documents[0];
        return {
          $id: customerDoc.$id,
          userId: customerDoc.userId,
          loyaltyPoints: customerDoc.loyaltyPoints || 0,
          totalOrders: customerDoc.totalOrders || 0,
          totalSpent: customerDoc.totalSpent || 0,
          tier: customerDoc.tier || 'new',
          lastOrderAt: customerDoc.lastOrderAt,
          addresses: customerDoc.addresses || [],
          $createdAt: customerDoc.$createdAt,
          $updatedAt: customerDoc.$updatedAt,
        } as CustomerProfile;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading customer profile:', error);
      return null;
    }
  }, []);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      updateAuthState({ loading: true, error: null });

      // Check for existing session
      const currentUser = await account.get();
      
      if (isUser(currentUser)) {
        addBreadcrumb('User session restored', 'auth', { user_id: currentUser.$id });
        
        // Load customer profile if user is a customer
        let customerProfile: CustomerProfile | null = null;
        if (currentUser.role === UserRole.CUSTOMER) {
          customerProfile = await loadCustomerProfile(currentUser.$id);
        }

        // Set user context for Sentry
        setUserContext({
          id: currentUser.$id,
          email: currentUser.email,
          name: currentUser.name,
        });

        updateAuthState({
          user: currentUser,
          customer: customerProfile,
          loading: false,
          initialized: true,
          sessionId: 'current', // Appwrite doesn't expose session ID in user object
        });
      } else {
        updateAuthState({
          loading: false,
          initialized: true,
        });
      }
    } catch (error) {
      // No active session or session expired
      updateAuthState({
        loading: false,
        initialized: true,
        error: null, // Don't treat missing session as an error
      });
    }
  }, [updateAuthState, loadCustomerProfile]);

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Login attempt', 'auth', { email: credentials.email });

      // Create session with Appwrite
      const session = await account.createEmailPasswordSession(
        credentials.email,
        credentials.password
      );

      // Get user details
      const user = await account.get();
      
      if (!isUser(user)) {
        throw new Error('Invalid user data received');
      }

      // Load customer profile if applicable
      let customerProfile: CustomerProfile | null = null;
      if (user.role === UserRole.CUSTOMER) {
        customerProfile = await loadCustomerProfile(user.$id);
      }

      // Set user context for Sentry
      setUserContext({
        id: user.$id,
        email: user.email,
        name: user.name,
      });

      addBreadcrumb('Login successful', 'auth', { user_id: user.$id });

      updateAuthState({
        user,
        customer: customerProfile,
        loading: false,
        sessionId: session.$id,
        error: null,
      });
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError, loadCustomerProfile]);

  /**
   * Login with phone and OTP (placeholder for future implementation)
   */
  const loginWithPhone = useCallback(async (credentials: PhoneLoginCredentials) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Phone login attempt', 'auth', { phone: credentials.phone });

      // TODO: Implement phone/OTP authentication with Appwrite
      // This will require setting up phone authentication in Appwrite
      // For now, throw a not implemented error
      throw new Error('Phone authentication not yet implemented');
      
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegistrationData) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Registration attempt', 'auth', { 
        email: data.email, 
        phone: data.phone 
      });

      // Create user account
      const user = await account.create(
        ID.unique(),
        data.email || `${data.phone}@temp.monepiceriz.ci`, // Temp email if not provided
        data.password,
        data.name
      );

      // Set user preferences
      await account.updatePrefs({
        ...defaultUserPreferences,
        preferredStore: data.preferredStore,
        notifications: {
          ...defaultUserPreferences.notifications,
          marketing: data.marketingConsent,
        },
        marketingConsent: data.marketingConsent,
        termsAcceptedAt: new Date().toISOString(),
        privacyAcceptedAt: new Date().toISOString(),
      });

      // Create customer profile in database
      if (appwriteConfig.databaseId) {
        try {
          await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.collections.customers,
            ID.unique(),
            {
              userId: user.$id,
              loyaltyPoints: 0,
              totalOrders: 0,
              totalSpent: 0,
              tier: 'new',
            }
          );
        } catch (dbError) {
          console.error('Error creating customer profile:', dbError);
          // Don't fail registration if customer profile creation fails
        }
      }

      // Create session
      await account.createEmailPasswordSession(
        data.email || `${data.phone}@temp.monepiceriz.ci`,
        data.password
      );

      // Reinitialize auth state
      await initializeAuth();

      addBreadcrumb('Registration successful', 'auth', { user_id: user.$id });
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError, initializeAuth]);

  /**
   * Logout current user
   */
  const logout = useCallback(async () => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Logout attempt', 'auth', { user_id: authState.user?.$id });

      // Delete current session
      await account.deleteSession('current');

      // Clear Sentry user context
      setUserContext({ id: '', email: '', name: '' });

      addBreadcrumb('Logout successful', 'auth');

      updateAuthState({
        user: null,
        customer: null,
        loading: false,
        sessionId: null,
        error: null,
      });
    } catch (error) {
      // Even if logout fails, clear local state
      updateAuthState({
        user: null,
        customer: null,
        loading: false,
        sessionId: null,
        error: null,
      });
      console.error('Logout error:', error);
    }
  }, [updateAuthState, authState.user]);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Password reset requested', 'auth', { email });

      await account.createRecovery(
        email,
        `${env.app.url}/reset-password`
      );

      updateAuthState({ loading: false });
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError]);

  /**
   * Confirm password reset
   */
  const confirmPasswordReset = useCallback(async (data: PasswordResetData) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Password reset confirmation', 'auth');

      if (!data.token || !data.newPassword) {
        throw new Error('Token and new password are required');
      }

      await account.updateRecovery(
        data.token,
        data.newPassword,
        data.confirmPassword || data.newPassword
      );

      updateAuthState({ loading: false });
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError]);

  /**
   * Send OTP (placeholder for future implementation)
   */
  const sendOTP = useCallback(async (phone: string, type: OTPVerificationData['type']) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('OTP send attempt', 'auth', { phone, type });

      // TODO: Implement OTP sending with Appwrite phone authentication
      throw new Error('OTP functionality not yet implemented');
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError]);

  /**
   * Verify OTP (placeholder for future implementation)
   */
  const verifyOTP = useCallback(async (data: OTPVerificationData) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('OTP verification attempt', 'auth', { 
        phone: data.phone, 
        type: data.type 
      });

      // TODO: Implement OTP verification with Appwrite
      throw new Error('OTP verification not yet implemented');
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({
        loading: false,
        error: authError.message,
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UserUpdateData) => {
    try {
      updateAuthState({ loading: true, error: null });
      addBreadcrumb('Profile update attempt', 'auth', { user_id: authState.user?.$id });

      // Update account information
      if (data.name) {
        await account.updateName(data.name);
      }
      
      if (data.email) {
        await account.updateEmail(data.email, authState.user?.password || '');
      }

      if (data.preferences) {
        const currentPrefs = authState.user?.prefs || {};
        await account.updatePrefs({
          ...currentPrefs,
          ...data.preferences,
        });
      }

      // Refresh user data
      await initializeAuth();

      addBreadcrumb('Profile update successful', 'auth', { user_id: authState.user?.$id });
    } catch (error) {
      const authError = handleAuthError(error);
      updateAuthState({ 
        loading: false, 
        error: authError.message 
      });
      throw authError;
    }
  }, [updateAuthState, handleAuthError, authState.user, initializeAuth]);

  /**
   * Refresh current session
   */
  const refreshSession = useCallback(async () => {
    await initializeAuth();
  }, [initializeAuth]);

  /**
   * Clear authentication error
   */
  const clearError = useCallback(() => {
    updateAuthState({ error: null });
  }, [updateAuthState]);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Context value
  const contextValue: AuthContextType = {
    ...authState,
    login,
    loginWithPhone,
    register,
    logout,
    resetPassword,
    confirmPasswordReset,
    sendOTP,
    verifyOTP,
    updateProfile,
    refreshSession,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth Hook
 * Custom hook to use the authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Utility hook for authentication status
 */
export function useAuthStatus() {
  const { user, loading, initialized } = useAuth();
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    isInitialized: initialized,
    user,
  };
}

/**
 * HOC for protecting routes that require authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, loading, initialized } = useAuth();
    
    if (!initialized || loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      );
    }
    
    if (!user) {
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }
    
    return <Component {...props} />;
  };
}