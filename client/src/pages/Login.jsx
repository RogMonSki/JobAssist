import { useState } from 'react'
import Navbar from '../components/Navbar.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    // Auth isn't built yet, so submitting deliberately does nothing.
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back. Enter your details to continue.
          </p>

          <label
            htmlFor="email"
            className="mt-6 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />

          <label
            htmlFor="password"
            className="mt-4 block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
          />

          <button
            type="submit"
            className="mt-6 w-full rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 px-4 py-2.5 font-semibold text-white hover:opacity-90"
          >
            Log in
          </button>
        </form>
      </main>
    </div>
  )
}

export default Login
