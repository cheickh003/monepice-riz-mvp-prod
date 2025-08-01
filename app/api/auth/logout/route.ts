/**
 * Logout API Route
 * 
 * Handles POST requests for user logout. Terminates the current session
 * and clears authentication cookies.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerAccount } from '@/lib/server/appwrite'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const account = createServerAccount(request)
    
    try {
      // Delete current session
      await account.deleteSession('current')
      
      // Log successful logout (for monitoring)
      console.log('User logged out successfully')
    } catch (sessionError: any) {
      // Session might already be invalid/expired - that's okay
      console.warn('Session deletion warning:', sessionError.message)
    }

    // Clear all authentication cookies
    const cookieStore = cookies()
    const sessionCookieName = `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
    
    // Clear session cookie
    cookieStore.set({
      name: sessionCookieName,
      value: '',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Clear remember me cookie if it exists
    cookieStore.set({
      name: 'remember_user',
      value: '',
      expires: new Date(0),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Clear any other auth-related cookies
    cookieStore.set({
      name: 'auth_state',
      value: '',
      expires: new Date(0),
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    })

  } catch (error) {
    console.error('Logout API error:', error)
    
    // Even if there's an error, we should still clear cookies
    const cookieStore = cookies()
    const sessionCookieName = `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`
    
    cookieStore.set({
      name: sessionCookieName,
      value: '',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      message: 'Déconnexion effectuée',
      warning: 'Session might have already been expired',
    })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée. Utilisez POST pour vous déconnecter' },
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