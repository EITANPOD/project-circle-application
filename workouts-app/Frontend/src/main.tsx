import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Workouts } from './pages/Workouts'
import { Home } from './pages/Home'
import './styles.css'

function App() {
  ;(window as any).__API_BASE__ = (import.meta as any).env?.VITE_API_BASE || ''
  console.log('API base:', (window as any).__API_BASE__)
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <img src="/octopus-logo.png" alt="Octopus" className="nav-logo" />
            <span className="nav-title">Workouts</span>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign up</Link>
            <Link to="/workouts" className="nav-link">My Workouts</Link>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/workouts" element={<Workouts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
