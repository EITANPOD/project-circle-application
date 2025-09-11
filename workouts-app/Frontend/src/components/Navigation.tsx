import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from './Icon'

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
        <img src="/octopus-logo.png" alt="FitForge" className="nav-logo" />
        <span className="nav-title">FitForge</span>
      </div>
        <div className="nav-links">
          <div className="loading">Loading...</div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/octopus-logo.png" alt="FitForge" className="nav-logo" />
          <span className="nav-title">FitForge</span>
        </div>
      <div className="nav-links">
        <Link to="/" className="nav-link">
          <Icon name="home" size={16} className="mr-2" />
          Home
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">
              <Icon name="bar-chart" size={16} className="mr-2" />
              Dashboard
            </Link>
            <Link to="/workouts" className="nav-link">
              <Icon name="dumbbell" size={16} className="mr-2" />
              My Workouts
            </Link>
            <Link to="/templates" className="nav-link">
              <Icon name="bookmark" size={16} className="mr-2" />
              Templates
            </Link>
            <Link to="/exercises" className="nav-link">
              <Icon name="activity" size={16} className="mr-2" />
              Exercises
            </Link>
            <Link to="/settings" className="nav-link user-info">
              <Icon name="settings" size={16} className="mr-2" />
              Welcome, {user.full_name || user.email}
            </Link>
            <button onClick={handleLogout} className="nav-link logout-btn">
              <Icon name="lock" size={16} className="mr-2" />
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">
              <Icon name="user" size={16} className="mr-2" />
              Login
            </Link>
            <Link to="/signup" className="nav-link">
              <Icon name="user-plus" size={16} className="mr-2" />
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}


