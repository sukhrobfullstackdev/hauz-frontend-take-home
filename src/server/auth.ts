import { Account, Client, ExecutionMethod, Functions, ID } from 'node-appwrite'
import { createServerFn } from '@tanstack/react-start'
import { deleteCookie, getCookie, setCookie } from '@tanstack/react-start/server'

import type { Profile } from '../types'

const sessionCookie = 'hauz_appwrite_session'

function config() {
  const endpoint = process.env.APPWRITE_ENDPOINT
  const projectId = process.env.APPWRITE_PROJECT_ID
  const apiKey = process.env.APPWRITE_API_KEY
  const functionId = process.env.APPWRITE_FUNCTION_ID ?? 'personal-account'

  const missing = [
    !endpoint && '',
    !projectId && '',
    !apiKey && '',
  ].filter((name): name is string => Boolean(name))

  if (missing.length > 0) {
    throw new Error(
      `Appwrite server environment is not configured. Add ${missing.join(', ')} to .env, then restart the dev server.`,
    )
  }

  return {
    endpoint: endpoint as string,
    projectId: projectId as string,
    apiKey: apiKey as string,
    functionId,
  }
}

function client(session?: string) {
  const settings = config()
  const value = new Client()
    .setEndpoint(settings.endpoint)
    .setProject(settings.projectId)

  if (session) value.setSession(session)
  else value.setKey(settings.apiKey)

  return value
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  }
}

type AppwriteUser = { $id: string; email: string; name?: string }

class ProfileExecutionError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

async function currentUser() {
  const session = getCookie(sessionCookie)
  if (!session) return null

  try {
    const user = await new Account(client(session)).get<AppwriteUser>()
    return user
  } catch {
    deleteCookie(sessionCookie, { path: '/' })
    return null
  }
}

async function executeProfile(
  session: string,
  method: ExecutionMethod,
  body?: Record<string, unknown>,
) {
  const settings = config()
  const execution = await new Functions(client(session)).createExecution({
    functionId: settings.functionId,
    method,
    xpath: '/personal-account',
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'content-type': 'application/json' },
  })

  const response = execution.responseBody ? JSON.parse(execution.responseBody) : null
  if (execution.responseStatusCode >= 400) {
    throw new ProfileExecutionError(
      execution.responseStatusCode,
      response?.message ?? 'Profile request failed.',
    )
  }

  return response as Profile | null
}

export const getAuthState = createServerFn({ method: 'POST' }).handler(async () => {
  const user = await currentUser()
  if (!user) return null

  const session = getCookie(sessionCookie)
  if (!session) return null

  let profile: Profile | null = null
  try {
    profile = await executeProfile(session, ExecutionMethod.GET)
  } catch (error) {
    if (error instanceof ProfileExecutionError && error.status === 404) {
      profile = null
    } else {
      deleteCookie(sessionCookie, { path: '/' })
      return null
    }
  }

  return { user: { id: user.$id, email: user.email }, profile }
})

export const requestEmailCode = createServerFn({ method: 'POST' })
  .validator((data: { email: string }) => data)
  .handler(async ({ data }) => {
    const email = data.email.trim().toLowerCase()
    if (!email || !email.includes('@')) throw new Error('Enter a valid email address.')

    const token = await new Account(client()).createEmailToken({
      userId: ID.unique(),
      email,
      phrase: false,
    })
    return { email, userId: token.userId }
})

export const verifyEmailCode = createServerFn({ method: 'POST' })
  .validator((data: { email: string; userId: string; secret: string }) => data)
  .handler(async ({ data }) => {
    try {
      const session = await new Account(client()).createSession({
        userId: data.userId.trim(),
        secret: data.secret.trim(),
      })
      setCookie(sessionCookie, session.secret, cookieOptions())

      let hasProfile = false
      try {
        await executeProfile(session.secret, ExecutionMethod.GET)
        hasProfile = true
      } catch (cause) {
        if (!(cause instanceof ProfileExecutionError && cause.status === 404)) {
          throw cause
        }
      }

      return { hasProfile }
    } catch (cause) {
      const error = cause as { code?: number; message?: string }
      throw new Error(
        error.code && error.message
          ? `Appwrite ${error.code}: ${error.message}`
          : 'The code was rejected. Request a new code and try again.',
      )
    }
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const session = getCookie(sessionCookie)
  if (session) {
    try {
      await new Account(client(session)).deleteSession({ sessionId: 'current' })
    } catch {
      // The local cookie still needs clearing if Appwrite already expired it.
    }
  }
  deleteCookie(sessionCookie, { path: '/' })
  return { ok: true }
})

export const createProfile = createServerFn({ method: 'POST' })
  .validator((data: { firstName: string; lastName: string; role: Profile['role'] }) => data)
  .handler(async ({ data }) => {
    const user = await currentUser()
    const session = getCookie(sessionCookie)
    if (!user || !session) throw new Error('Sign in required.')
    return executeProfile(session, ExecutionMethod.POST, data)
  })

export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data: { userId: string; firstName?: string; lastName?: string; contactEmail?: string | null; bio?: string | null }) => data)
  .handler(async ({ data }) => {
    const user = await currentUser()
    const session = getCookie(sessionCookie)
    if (!user || !session) throw new Error('Sign in required.')
    return executeProfile(session, ExecutionMethod.PATCH, data)
  })