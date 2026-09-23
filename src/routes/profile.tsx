import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'

import { getAuthState, updateProfile } from '../server/auth'

export const Route = createFileRoute('/profile')({
  loader: async ({ location }) => {
    const auth = await getAuthState()
    if (!auth) throw redirect({ to: '/sign-in', search: { redirect: '/profile' } })
    if (!auth.profile) {
      throw redirect({ to: '/onboarding', search: { redirect: location.href } })
    }
    return auth
  },
  component: ProfilePage,
})

function ProfilePage() {
  const auth = Route.useLoaderData()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const profile = auth.profile
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName)
      setLastName(profile.lastName)
      setContactEmail(profile.contactEmail ?? '')
      setBio(profile.bio ?? '')
    }
  }, [profile])

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await updateProfile({ data: { userId: auth.user.id, firstName, lastName, contactEmail: contactEmail || null, bio: bio || null } })
      setMessage('Profile updated.')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Unable to update profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page-shell form-layout">
      <div className="form-intro"><span className="eyebrow">Your HAUZ</span><h1>Your profile.</h1><p>Keep your details current as your property journey changes.</p></div>
      <div className="form-card"><h2>Edit details</h2><form onSubmit={submit}>
        <label>First name <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></label>
        <label>Last name <input value={lastName} onChange={(event) => setLastName(event.target.value)} required /></label>
        <label>Contact email <input type="email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} /></label>
        <label>Bio <textarea value={bio} onChange={(event) => setBio(event.target.value)} /></label>
        <button disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
      </form>
      {message && <p role="status">{message}</p>}</div>
    </main>
  )
}