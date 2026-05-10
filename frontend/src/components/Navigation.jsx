import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Menu, X, BookOpen, User, LogOut, Star } from 'lucide-react'

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuth()

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'E-Books', path: '/resources' },
    { name: 'Services', path: '/services' },
    { name: 'Events', path: '/events' },
    { name: 'Reviews', path: '/reviews', icon: Star },
    { name: 'Help', path: '/contact' },
  ]

  const getDashboardPath = () => {
    if (!user) return '/login'
    switch (user.Role) {
      case 'Admin':
      case 'SuperAdmin':
        return '/admin/dashboard'
      case 'Staff':
        return '/staff/dashboard'
      default:
        return '/user/dashboard'
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-primary shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src="/logo.png" alt="Bugema University Logo" className="w-14 h-14 object-contain" />
            <span className="text-white font-semibold text-lg hidden sm:block">Bugema University</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link flex items-center gap-1 ${
                    isActive ? 'text-secondary' : 'text-white'
                  }`}
                >
                  {Icon && (
                    <Icon
                      size={15}
                      fill={isActive ? 'currentColor' : 'none'}
                      className="shrink-0"
                    />
                  )}
                  {link.name}
                </Link>
              )
            })}
            
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="nav-link text-white flex items-center gap-2"
                >
                  <User size={18} />
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="nav-link text-white flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link text-white">Login</Link>
                <Link to="/register" className="bg-secondary text-primary px-4 py-2 rounded-full font-semibold hover:bg-white transition-colors duration-300">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white hover:text-secondary focus:outline-none"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary border-t border-blue-800">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 font-semibold ${
                  location.pathname === link.path ? 'text-secondary' : 'text-white hover:text-secondary'
                } transition-colors duration-300`}
              >
                {link.name}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white hover:text-secondary py-2"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                  className="block w-full text-left text-white hover:text-secondary py-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-white hover:text-secondary py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block bg-secondary text-primary px-4 py-2 rounded-lg font-semibold text-center mt-2"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
