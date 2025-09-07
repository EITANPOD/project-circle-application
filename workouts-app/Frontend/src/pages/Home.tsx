import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <div className="hero-content">
            <div className="logo-container">
              <img src="/octopus-logo.png" alt="Octopus Computer Solutions" className="hero-logo" />
            </div>
            <h1 className="hero-title">Welcome to Workouts</h1>
            <p className="hero-subtitle">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-container">
            <img src="/octopus-logo.png" alt="Octopus Computer Solutions" className="hero-logo" />
          </div>
          <h1 className="hero-title">Welcome to Workouts</h1>
          <p className="hero-subtitle">
            Track your fitness journey with our powerful workout management app
          </p>
          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">💪</div>
              <h3>Create Workouts</h3>
              <p>Design your perfect training programs</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Log your actual performance</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3>Stay Motivated</h3>
              <p>Monitor your fitness goals</p>
            </div>
          </div>
          <div className="hero-actions">
            {user ? (
              <>
                <Link to="/workouts" className="btn btn-primary">My Workouts</Link>
                <p className="welcome-message">
                  Welcome back, {user.full_name || user.email}! Ready to continue your fitness journey?
                </p>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary">Get Started</Link>
                <Link to="/login" className="btn btn-secondary">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
