import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Settings() {
  const nav = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: ''
  })
  
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [preferencesForm, setPreferencesForm] = useState({
    theme: 'light',
    notifications: true,
    workout_reminders: true,
    email_updates: false
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      nav('/login')
    }
  }, [user, authLoading, nav])

  // Load user data
  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || ''
      })
    }
  }, [user])

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileForm)
      })
      
      if (res.ok) {
        setMessage('Profile updated successfully!')
        // Refresh user data
        window.location.reload()
      } else {
        const text = await res.text()
        setError(text || 'Failed to update profile')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('New passwords do not match')
      setIsLoading(false)
      return
    }
    
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/users/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      })
      
      if (res.ok) {
        setMessage('Password updated successfully!')
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        })
      } else {
        const text = await res.text()
        setError(text || 'Failed to update password')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  async function updatePreferences(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setMessage('')
    
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/users/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferencesForm)
      })
      
      if (res.ok) {
        setMessage('Preferences updated successfully!')
      } else {
        const text = await res.text()
        setError(text || 'Failed to update preferences')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  async function deleteAccount() {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/users/account`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (res.ok) {
        alert('Account deleted successfully. You will be redirected to the home page.')
        window.location.href = '/'
      } else {
        const text = await res.text()
        setError(text || 'Failed to delete account')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="main-content">
        <div className="loading">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="main-content">
      <div className="settings-container">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">Manage your account preferences and security settings</p>
        
        {message && (
          <div className="success-message">
            ✅ {message}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="settings-section">
          <h2 className="section-title">👤 Profile Information</h2>
          <form onSubmit={updateProfile} className="settings-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                className="form-input"
                type="text"
                value={profileForm.full_name}
                onChange={e => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                className="form-input"
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email address"
                required
              />
            </div>
            <button type="submit" className="form-button" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Password Change */}
        <div className="settings-section">
          <h2 className="section-title">🔒 Change Password</h2>
          <form onSubmit={updatePassword} className="settings-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input 
                className="form-input"
                type="password"
                value={passwordForm.current_password}
                onChange={e => setPasswordForm(prev => ({ ...prev, current_password: e.target.value }))}
                placeholder="Enter your current password"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input 
                className="form-input"
                type="password"
                value={passwordForm.new_password}
                onChange={e => setPasswordForm(prev => ({ ...prev, new_password: e.target.value }))}
                placeholder="Enter your new password"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input 
                className="form-input"
                type="password"
                value={passwordForm.confirm_password}
                onChange={e => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                placeholder="Confirm your new password"
                required
                minLength={6}
              />
            </div>
            <button type="submit" className="form-button" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Preferences */}
        <div className="settings-section">
          <h2 className="section-title">⚙️ Preferences</h2>
          <form onSubmit={updatePreferences} className="settings-form">
            <div className="form-group">
              <label className="form-label">Theme</label>
              <select 
                className="form-input"
                value={preferencesForm.theme}
                onChange={e => setPreferencesForm(prev => ({ ...prev, theme: e.target.value }))}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={preferencesForm.notifications}
                  onChange={e => setPreferencesForm(prev => ({ ...prev, notifications: e.target.checked }))}
                />
                <span className="checkbox-text">Enable notifications</span>
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={preferencesForm.workout_reminders}
                  onChange={e => setPreferencesForm(prev => ({ ...prev, workout_reminders: e.target.checked }))}
                />
                <span className="checkbox-text">Workout reminders</span>
              </label>
            </div>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox"
                  checked={preferencesForm.email_updates}
                  onChange={e => setPreferencesForm(prev => ({ ...prev, email_updates: e.target.checked }))}
                />
                <span className="checkbox-text">Email updates and tips</span>
              </label>
            </div>
            <button type="submit" className="form-button" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Preferences'}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="settings-section danger-section">
          <h2 className="section-title">⚠️ Account Actions</h2>
          <div className="danger-actions">
            <button 
              onClick={deleteAccount}
              className="danger-button"
              disabled={isLoading}
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </button>
            <p className="danger-warning">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
