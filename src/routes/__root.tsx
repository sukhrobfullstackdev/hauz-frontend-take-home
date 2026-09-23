import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  Link,
  useRouter,
  useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'

import { getAuthState, logout } from '../server/auth'
import appCss from '../styles.css?url'

export interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: () => getAuthState(),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'HAUZ' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function Header() {
  const auth = Route.useLoaderData()
  const navigate = useNavigate()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function signOut() {
    setBusy(true)
    await logout()
    await navigate({ to: '/' })
    await router.invalidate()
  }

  return (
    <header>
      <Link to="/">HAUZ</Link>
      <nav>
        {auth?.profile ? (
          <>
            <Link to="/profile">{auth.profile.firstName}</Link>
            <button type="button" onClick={signOut} disabled={busy}>
              Log out
            </button>
          </>
        ) : auth ? (
          <span>{auth.user.email}</span>
        ) : (
          <Link to="/sign-in">Sign in</Link>
        )}
      </nav>
    </header>
  )
}
