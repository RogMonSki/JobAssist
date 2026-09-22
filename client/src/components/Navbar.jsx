import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-cyan-600">
          Job App Assistant
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-600 hover:text-cyan-600">
              {user.username}
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-slate-600 hover:text-cyan-600"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-cyan-600">
              Log in
            </Link>
            <Link to="/signup" className="text-sm font-medium text-slate-600 hover:text-cyan-600">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar