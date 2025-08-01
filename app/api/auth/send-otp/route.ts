/**
 * Send OTP API Route
 * 
 * Handles POST requests for sending OTP codes to phone numbers.
 * Supports login, registration, and password reset flows.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendPhoneOTP, validatePhoneForAuth, getAuthErrorMessage } from '@/lib/services/auth'

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, maxRequests: number = 3, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const { phone, type = 'login' } = await request.json()

    // Validate input
    if (!phone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
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
      // Validate and format phone number
      const validPhone = validatePhoneForAuth(phone)
      
      // Check rate limiting
      const rateLimitKey = `otp:${validPhone}`
      if (!checkRateLimit(rateLimitKey)) {
        return NextResponse.json(
          { 
            error: 'Trop de tentatives. Veuillez attendre 15 minutes avant de réessayer.',
            retryAfter: 15 * 60 // seconds
          },
          { status: 429 }
        )
      }

      // Send OTP
      const result = await sendPhoneOTP(validPhone, type)
      
      // Log successful OTP send (for monitoring)
      console.log(`OTP sent successfully to ${validPhone.slice(0, 8)}*** for ${type}`)

      return NextResponse.json({
        success: true,
        userId: result.userId,
        phone: validPhone,
        type,
        expire: result.expire,
        message: `Code de vérification envoyé au ${validPhone}`,
      })

    } catch (authError: any) {
      console.error('Send OTP error:', authError)
      
      const errorMessage = getAuthErrorMessage(authError)
      
      // Map to appropriate HTTP status codes
      let statusCode = 500
      if (authError.message?.includes('invalide')) {
        statusCode = 400
      } else if (authError.message?.includes('limite')) {
        statusCode = 429
      } else if (authError.code === 404) {
        statusCode = 404
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      )
    }
  } catch (error) {
    console.error('Send OTP API error:', error)
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