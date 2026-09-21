import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-xl font-bold text-cyan-600">
          Job App Assistant
        </Link>
        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-cyan-600">
          Log in 
        </Link>
      </div>
    </nav>
  )
}

export default Navbar