'use server'

import { auth, db } from "@/firebase/admin"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const ONE_WEEK = 60 * 60 * 24 * 7
export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params

  try {

    const userRecord = await db.collection('users').doc(uid).get()

    if (userRecord.exists) {
      return {
        success: false,
        message: 'User already exists. Please sign in instead.'
      }
    }

    await db.collection('users').doc(uid).set({
      name, email
    })

    return {
      success: true,
      message: 'Account created successfully. Please sign in to continue.'
    }

  } catch (error: any) {
    console.log("Error signing up:", error);

    if (error.code === 'auth/email-already-exists') {
      return {
        success: false,
        message: 'Email already exists. Please sign in instead.'
      }
    }

    return {
      success: false,
      message: 'Failed to create an account. Please try again later.'
    }
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params

  try {
    const userRecord = await auth.getUserByEmail(email)

    if (!userRecord) {
      return {
        success: false,
        message: 'User not found. Please sign up instead.'
      }
    }

    await setSessionCookie(idToken)
  } catch (error: any) {
    console.log("Error signing in:", error);
    return null
  }
}

export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies()

  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: ONE_WEEK * 1000 }) // 7 days

  cookieStore.set('session', sessionCookie, {
    maxAge: ONE_WEEK, // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    sameSite: 'lax',
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value

  if (!sessionCookie) return null

  try {
    // to check whether we have a valid session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)

    const userRecord = await db.collection('users').doc(decodedClaims.uid).get()

    if (!userRecord.exists) return null

    return {
      ...userRecord.data(),
      id: userRecord.id
    } as User

  } catch (error: any) {
    console.log("Error getting current user:", error);
    return null
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser()

  return !!user; // if user is not null, return true . Ex: '' => false, !'' => true, !(!'') => false
  // Therefore using '!!' we can turn existence or non existence of user to a boolean value 
}

export async function signOut() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

