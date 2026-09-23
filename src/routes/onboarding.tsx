import { createFileRoute, redirect, useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import type { SubmitEvent } from 'react'

import { createProfile, getAuthState } from '../server/auth'

export const Route = createFileRoute('/onboarding')({
  loader: async ({ location }) => {
    const auth = await getAuthState()
    if (!auth) throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    if (auth.profile) throw redirect({ to: '/' })
    return auth
  },
  component: Onboarding,
})

function Onboarding() {
  const navigate = useNavigate()
  const router = useRouter()
  const search = useSearch({ from: '/onboarding' }) as { redirect?: string }
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'property_owner' | 'realtor'>('property_owner')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await createProfile({ data: { firstName, lastName, role } })
      await navigate({ to: search.redirect || '/' })
      await router.invalidate()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create your account.')
      setBusy(false)
    }
  }

  return (
    <main className="page-shell form-layout">
      <div className="form-intro"><span className="eyebrow">One last step</span><h1>Tell us a little about you.</h1><p>This helps shape a better HAUZ experience from the very beginning.</p></div>
      <div className="form-card"><h2>Your details</h2><form onSubmit={submit}>
        <label>First name <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required autoFocus /></label>
        <label>Last name <input value={lastName} onChange={(event) => setLastName(event.target.value)} required /></label>
        <label>Role <select value={role} onChange={(event) => setRole(event.target.value as typeof role)}><option value="property_owner">Property Owner</option><option value="realtor">Realtor</option></select></label>
        <button disabled={busy}>{busy ? 'Creating...' : 'Continue'}</button>
      </form>
      {error && <p role="alert">{error}</p>}</div>
    </main>
  )
}