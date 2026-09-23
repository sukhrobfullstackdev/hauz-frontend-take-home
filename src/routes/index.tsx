import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <main className="hero-shell">
      <div className="hero-copy">
        <span className="eyebrow">Real estate, made personal</span>
        <h1>Find your place in Uzbekistan.</h1>
        <p>HAUZ brings the next chapter of your home journey into one calm, clear space.</p>
        <div className="hero-actions">
          <Link className="button" to="/sign-in">Sign in to continue</Link>
          <span className="helper">Your profile, always in your hands.</span>
        </div>
        <div className="hero-mark">01 / 25</div>
      </div>
    </main>
  )
}
