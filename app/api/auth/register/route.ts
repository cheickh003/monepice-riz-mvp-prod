/**
 * User Registration API Route
 * 
 * Handles POST requests for user registration with email/phone.
 * Creates user account and customer profile.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerAccount, createServerDatabases } from '@/lib/server/appwrite'
import { ID } from 'appwrite'
import { isValidIvorianPhone, toInternationalFormat } from '@/lib/utils/phone'
import { SERVER_CONFIG } from '@/lib/server/appwrite'

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      preferredStore,
      marketingConsent,
      acceptTerms,
      acceptPrivacy
    } = await request.json()

    // Validate required fields
    if (!name || !password) {
      return NextResponse.json(
        { error: 'Nom et mot de passe requis' },
        { status: 400 }
      )
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email ou numéro de téléphone requis' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Les mots de passe ne correspondent pas' },
        { status: 400 }
      )
    }

    if (!acceptTerms || !acceptPrivacy) {
      return NextResponse.json(
        { error: 'Veuillez accepter les conditions d\'utilisation et la politique de confidentialité' },
        { status: 400 }
      )
    }

    // Validate phone number if provided
    let formattedPhone = null
    if (phone) {
      if (!isValidIvorianPhone(phone)) {
        return NextResponse.json(
          { error: 'Format de numéro de téléphone invalide' },
          { status: 400 }
        )
      }
      formattedPhone = toInternationalFormat(phone)
    }

    const account = createServerAccount()
    const databases = createServerDatabases()

    try {
      // Create user account
      const userId = ID.unique()
      const user = await account.create(
        userId,
        email || formattedPhone!, // Use email or phone as identifier
        password,
        name
      )

      // Set user preferences
      const userPrefs = {
        preferredStore: preferredStore || 'COCODY',
        notifications: {
          sms: true,
          email: !!email,
          push: true,
          marketing: marketingConsent || false,
        },
        language: 'fr',
        theme: 'system',
        marketingConsent: marketingConsent || false,
        termsAcceptedAt: new Date().toISOString(),
        privacyAcceptedAt: new Date().toISOString(),
      }

      await account.updatePrefs(userPrefs)

      // Update phone if provided (Appwrite might not set it during creation)
      if (formattedPhone) {
        try {
          await account.updatePhone(formattedPhone, password)
        } catch (phoneError) {
          console.warn('Could not set phone during registration:', phoneError)
        }
      }

      // Create customer profile in database
      try {
        await databases.createDocument(
          SERVER_CONFIG.DATABASE_ID,
          'customers',
          ID.unique(),
          {
            userId: user.$id,
            loyaltyPoints: 0,
            totalOrders: 0,
            totalSpent: 0.0,
            tier: 'new',
            preferredStore: preferredStore || 'COCODY',
            marketingConsent: marketingConsent || false,
          }
        )
      } catch (dbError) {
        console.error('Error creating customer profile:', dbError)
        // Continue - user account is created, profile can be created later
      }

      // Send email verification if email provided
      if (email) {
        try {
          await account.createVerification(`${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`)
        } catch (verificationError) {
          console.warn('Could not send email verification:', verificationError)
        }
      }

      // Create session for immediate login
      const session = await account.createEmailPasswordSession(
        email || formattedPhone!,
        password
      )

      return NextResponse.json({
        success: true,
        user: {
          $id: user.$id,
          name: user.name,
          email: user.email,
          phone: formattedPhone,
          emailVerification: user.emailVerification,
          phoneVerification: user.phoneVerification,
          prefs: userPrefs,
        },
        session: {
          $id: session.$id,
          expire: session.expire,
        },
        message: email 
          ? 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.'
          : 'Compte créé avec succès.',
      })

    } catch (authError: any) {
      console.error('Registration error:', authError)
      
      // Handle specific registration errors
      if (authError.code === 409) {
        if (authError.message?.includes('email')) {
          return NextResponse.json(
            { error: 'Un compte existe déjà avec cette adresse email' },
            { status: 409 }
          )
        }
        if (authError.message?.includes('phone')) {
          return NextResponse.json(
            { error: 'Un compte existe déjà avec ce numéro de téléphone' },
            { status: 409 }
          )
        }
        return NextResponse.json(
          { error: 'Un compte existe déjà avec ces informations' },
          { status: 409 }
        )
      }
      
      if (authError.code === 400) {
        return NextResponse.json(
          { error: 'Données d\'inscription invalides' },
          { status: 400 }
        )
      }

      if (authError.code === 429) {
        return NextResponse.json(
          { error: 'Trop de tentatives. Veuillez réessayer plus tard' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la création du compte' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}