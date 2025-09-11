import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icon'

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
            <div className="loading">Loading your fitness journey...</div>
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
            <img src="/octopus-logo.png" alt="FitForge" className="hero-logo" />
          </div>
          <h1 className="hero-title">Welcome to FitForge</h1>
          <p className="hero-subtitle">
            Forge your fitness journey with our powerful workout management platform
          </p>
          <div className="hero-features">
            <div className="feature">
              <div className="feature-icon">
                <Icon name="dumbbell" size={48} />
              </div>
              <h3>Create Workouts</h3>
              <p>Design your perfect training programs with our intuitive workout builder</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <Icon name="trending-up" size={48} />
              </div>
              <h3>Track Progress</h3>
              <p>Log your actual performance and see your strength gains over time</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <Icon name="target" size={48} />
              </div>
              <h3>Stay Motivated</h3>
              <p>Monitor your fitness goals and celebrate every achievement</p>
            </div>
            <div className="feature">
              <div className="feature-icon">
                <Icon name="bot" size={48} />
              </div>
              <h3>AI-Powered Planner</h3>
              <p>Generate personalized workouts instantly with our intelligent AI trainer</p>
            </div>
          </div>
          <div className="hero-actions">
            {user ? (
              <>
                <div className="action-buttons">
                  <Link to="/dashboard" className="btn btn-primary">
                    <Icon name="bar-chart" size={20} className="mr-2" />
                    View Dashboard
                  </Link>
                  <Link to="/workouts" className="btn btn-secondary">
                    <Icon name="dumbbell" size={20} className="mr-2" />
                    My Workouts
                  </Link>
                  <Link to="/templates" className="btn btn-secondary">
                    <Icon name="bookmark" size={20} className="mr-2" />
                    Templates
                  </Link>
                </div>
                <p className="welcome-message">
                  Welcome back, {user.full_name || user.email}! Ready to forge ahead with your fitness journey?
                </p>
              </>
            ) : (
              <>
                <div className="action-buttons">
                  <Link to="/signup" className="btn btn-primary">
                    <Icon name="user-plus" size={20} className="mr-2" />
                    Get Started
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    <Icon name="user" size={20} className="mr-2" />
                    Sign In
                  </Link>
                </div>
                <div className="stats-preview">
                  <div className="stat-item">
                    <Icon name="users" size={24} />
                    <span>10,000+ Active Users</span>
                  </div>
                  <div className="stat-item">
                    <Icon name="dumbbell" size={24} />
                    <span>500+ Exercises</span>
                  </div>
                  <div className="stat-item">
                    <Icon name="trophy" size={24} />
                    <span>50+ Workout Templates</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
