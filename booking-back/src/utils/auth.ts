import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { CookieOptions } from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

export function generateCookie(token: string): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)
  return hashedPassword
}

export async function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    return isMatch
  } catch (error: any) {
    console.error('[comparePassword] Error comparing passwords:', error.message)
    return false
  }
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}
