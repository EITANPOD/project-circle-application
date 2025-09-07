import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })
      if (res.ok) {
        nav('/workouts')
      } else {
        const text = await res.text()
        setError(text || 'Login failed')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Login</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="form-group">
        <input 
          className="form-input"
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div className="form-group">
        <input 
          className="form-input"
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="form-button">Login</button>
    </form>
  )
}
