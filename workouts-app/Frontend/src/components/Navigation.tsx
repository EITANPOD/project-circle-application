import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Navigation() {
  const { user, logout, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (isLoading) {
    return (
      <nav className="navbar">
        <div className="nav-brand">
          <img src="/octopus-logo.png" alt="Octopus" className="nav-logo" />
          <span className="nav-title">Workouts</span>
        </div>
        <div className="nav-links">
          <span className="nav-link">Loading...</span>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img src="/octopus-logo.png" alt="Octopus" className="nav-logo" />
        <span className="nav-title">Workouts</span>
      </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        {user ? (
          <>
            <Link to="/workouts" className="nav-link">My Workouts</Link>
            <span className="nav-link user-info">
              Welcome, {user.full_name || user.email}
            </span>
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
