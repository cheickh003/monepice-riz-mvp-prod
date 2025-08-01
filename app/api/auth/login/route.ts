/**
 * Email/Password Login API Route
 * 
 * Handles POST requests for email/password authentication.
 * Sets session cookies and returns user information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerAccount } from '@/lib/server/appwrite'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password, remember } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Create server account instance
    const account = createServerAccount()

    try {
      // Create email session
      const session = await account.createEmailPasswordSession(email, password)
      
      // Get user information
      const user = await account.get()

      // Set session cookie
      const cookieStore = cookies()
      cookieStore.set({
        name: `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`,
        value: session.secret,
        expires: new Date(session.expire),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })

      // Set remember me cookie if requested
      if (remember) {
        cookieStore.set({
          name: 'remember_user',
          value: email,
          expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })
      }

      return NextResponse.json({
        success: true,
        user: {
          $id: user.$id,
          name: user.name,
          email: user.email,
          emailVerification: user.emailVerification,
          phone: user.phone,
          phoneVerification: user.phoneVerification,
          prefs: user.prefs,
          labels: user.labels,
        },
        session: {
          $id: session.$id,
          expire: session.expire,
          provider: session.provider,
        },
      })
    } catch (authError: any) {
      console.error('Authentication error:', authError)
      
      // Handle specific authentication errors
      if (authError.code === 401) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect' },
          { status: 401 }
        )
      }
      
      if (authError.code === 429) {
        return NextResponse.json(
          { error: 'Trop de tentatives. Veuillez réessayer plus tard' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: 'Erreur lors de la connexion' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Login API error:', error)
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