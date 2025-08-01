/**
 * Magic Link Authentication API Route
 * 
 * Handles POST requests for generating magic links and GET requests
 * for verifying magic link tokens.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateMagicLink, verifyMagicLink, getAuthErrorMessage } from '@/lib/services/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Rate limiting for magic link generation
const magicLinkRequests = new Map<string, { count: number; resetTime: number }>()

function checkMagicLinkRateLimit(email: string, maxRequests: number = 3, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const key = `magic_link:${email}`
  const record = magicLinkRequests.get(key)
  
  if (!record || now > record.resetTime) {
    magicLinkRequests.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

/**
 * POST - Generate magic link
 */
export async function POST(request: NextRequest) {
  try {
    const { email, redirectUrl } = await request.json()

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Adresse e-mail requise' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'adresse e-mail invalide' },
        { status: 400 }
      )
    }

    try {
      // Check rate limiting
      if (!checkMagicLinkRateLimit(email)) {
        return NextResponse.json(
          { 
            error: 'Trop de demandes de lien magique. Veuillez attendre 15 minutes.',
            retryAfter: 15 * 60
          },
          { status: 429 }
        )
      }

      // Generate magic link with custom redirect URL
      const magicLinkUrl = redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/auth/magic-link/verify`
      const result = await generateMagicLink(email, magicLinkUrl)
      
      // Log successful magic link generation (for monitoring)
      console.log(`Magic link generated for ${email}`)

      return NextResponse.json({
        success: true,
        userId: result.userId,
        email: result.email,
        expire: result.expire,
        message: `Lien de connexion envoyé à ${email}. Vérifiez votre boîte mail.`,
      })

    } catch (authError: any) {
      console.error('Generate magic link error:', authError)
      
      const errorMessage = getAuthErrorMessage(authError)
      
      let statusCode = 500
      if (authError.message?.includes('invalide')) {
        statusCode = 400
      } else if (authError.code === 404) {
        statusCode = 404
      } else if (authError.code === 429) {
        statusCode = 429
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      )
    }
  } catch (error) {
    console.error('Magic link generation API error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * GET - Verify magic link token
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const secret = searchParams.get('secret')
    const redirectTo = searchParams.get('redirect') || '/dashboard'

    // Validate required parameters
    if (!userId || !secret) {
      return NextResponse.json(
        { error: 'Paramètres de vérification manquants' },
        { status: 400 }
      )
    }

    try {
      // Verify magic link
      const result = await verifyMagicLink({ userId, secret })
      
      if (!result.success || !result.session) {
        throw new Error('Échec de la vérification du lien magique')
      }

      // Set session cookie
      const cookieStore = cookies()
      cookieStore.set({
        name: `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`,
        value: result.session.secret,
        expires: new Date(result.session.expire),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })

      // Log successful verification
      console.log(`Magic link verified successfully for user ${userId}`)

      // Redirect to success page or dashboard
      return NextResponse.redirect(new URL(redirectTo, request.url))

    } catch (authError: any) {
      console.error('Verify magic link error:', authError)
      
      // Redirect to error page with error message
      const errorUrl = new URL('/auth/magic-link/error', request.url)
      
      if (authError.message?.includes('invalide') || authError.code === 401) {
        errorUrl.searchParams.set('error', 'invalid_token')
        errorUrl.searchParams.set('message', 'Lien magique invalide ou expiré')
      } else {
        errorUrl.searchParams.set('error', 'verification_failed')
        errorUrl.searchParams.set('message', 'Erreur lors de la vérification du lien')
      }
      
      return NextResponse.redirect(errorUrl)
    }
  } catch (error) {
    console.error('Magic link verification API error:', error)
    
    // Redirect to error page
    const errorUrl = new URL('/auth/magic-link/error', request.url)
    errorUrl.searchParams.set('error', 'server_error')
    errorUrl.searchParams.set('message', 'Erreur interne du serveur')
    
    return NextResponse.redirect(errorUrl)
  }
}

// Handle unsupported methods
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