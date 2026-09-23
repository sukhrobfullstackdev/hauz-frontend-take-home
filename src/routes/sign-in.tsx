import { createFileRoute, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import type { SubmitEvent } from 'react'

import { requestEmailCode, verifyEmailCode } from '../server/auth'

export const Route = createFileRoute('/sign-in')({ component: SignIn })

function SignIn() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ from: '/sign-in' }) as { redirect?: string }
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState('')
  const [secret, setSecret] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submitEmail(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await requestEmailCode({ data: { email } })
      setEmail(result.email)
      setUserId(result.userId)
      setSent(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send the code.')
    } finally {
      setBusy(false)
    }
  }

  async function submitCode(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await verifyEmailCode({ data: { email, userId, secret } })
      const destination = result.hasProfile
        ? search.redirect || '/'
        : `/onboarding${search.redirect ? `?redirect=${encodeURIComponent(search.redirect)}` : ''}`
      await navigate({ to: destination })
      await router.invalidate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The code was not accepted.')
      setBusy(false)
    }
  }

  return (
    <main className="page-shell form-layout">
      <div className="form-intro"><span className="eyebrow">Welcome back</span><h1>Make yourself at home.</h1><p>Sign in with a one-time email code. No password to remember.</p></div>
      <div className="form-card">
      <h2>{sent ? 'Check your inbox' : 'Sign in'}</h2>
      {!sent ? (
        <form onSubmit={submitEmail}>
          <label>Email <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus /></label>
          <button disabled={busy}>{busy ? 'Sending...' : 'Send code'}</button>
        </form>
      ) : (
        <form onSubmit={submitCode}>
          <p>Enter the code sent to {email}.</p>
          <label>Code <input type="text" inputMode="numeric" autoComplete="one-time-code" value={secret} onChange={(event) => setSecret(event.target.value)} required autoFocus /></label>
          <button disabled={busy}>{busy ? 'Signing in...' : 'Continue'}</button>
          <button type="button" onClick={() => setSent(false)}>Use another email</button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      </div>
    </main>
  )
}