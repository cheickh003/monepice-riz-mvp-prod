/**
 * Verify OTP API Route
 * 
 * Handles POST requests for verifying OTP codes and completing
 * phone authentication flows.
 */

import { NextRequest, NextResponse } from 'next/server'
import { completePhoneLogin, validatePhoneForAuth, getAuthErrorMessage } from '@/lib/services/auth'
import { cookies } from 'next/headers'

// Rate limiting for OTP verification attempts
const otpAttempts = new Map<string, { count: number; resetTime: number }>()

function checkOTPAttempts(key: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = otpAttempts.get(key)
  
  if (!record || now > record.resetTime) {
    otpAttempts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { phone, userId, otp, type = 'login' } = await request.json()

    // Validate input
    if (!phone || !userId || !otp) {
      return NextResponse.json(
        { error: 'Numéro de téléphone, ID utilisateur et code OTP requis' },
        { status: 400 }
      )
    }

    if (!['login', 'registration', 'password_reset'].includes(type)) {
      return NextResponse.json(
        { error: 'Type de vérification invalide' },
        { status: 400 }
      )
    }

    try {
      // Validate phone number format
      const validPhone = validatePhoneForAuth(phone)
      
      // Check rate limiting for OTP attempts
      const attemptKey = `otp_verify:${validPhone}`
      if (!checkOTPAttempts(attemptKey)) {
        return NextResponse.json(
          { 
            error: 'Trop de tentatives de vérification. Veuillez attendre 15 minutes.',
            retryAfter: 15 * 60
          },
          { status: 429 }
        )
      }

      // Validate OTP format (should be 6 digits)
      if (!/^\d{6}$/.test(otp)) {
        return NextResponse.json(
          { error: 'Code OTP invalide. Le code doit contenir 6 chiffres' },
          { status: 400 }
        )
      }

      // Complete phone authentication
      const result = await completePhoneLogin(userId, otp)
      
      if (!result.success || !result.session) {
        throw new Error('Échec de la création de session')
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

      // Clear rate limiting on successful verification
      otpAttempts.delete(attemptKey)
      
      // Log successful verification (for monitoring)
      console.log(`OTP verified successfully for ${validPhone.slice(0, 8)}*** (${type})`)

      return NextResponse.json({
        success: true,
        phone: validPhone,
        type,
        session: {
          $id: result.session.$id,
          expire: result.session.expire,
          provider: result.session.provider,
        },
        message: 'Vérification réussie',
      })

    } catch (authError: any) {
      console.error('Verify OTP error:', authError)
      
      const errorMessage = getAuthErrorMessage(authError)
      
      // Map to appropriate HTTP status codes
      let statusCode = 500
      if (authError.message?.includes('invalide') || authError.code === 401) {
        statusCode = 401
      } else if (authError.message?.includes('expiré')) {
        statusCode = 410 // Gone - expired
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
    console.error('Verify OTP API error:', error)
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