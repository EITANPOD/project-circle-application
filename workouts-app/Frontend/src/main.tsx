import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Workouts } from './pages/Workouts'
import { WorkoutDetail } from './pages/WorkoutDetail'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'
import { AuthProvider } from './contexts/AuthContext'
import { Navigation } from './components/Navigation'
import './styles.css'

function App() {
  ;(window as any).__API_BASE__ = (import.meta as any).env?.VITE_API_BASE || ''
  console.log('API base:', (window as any).__API_BASE__)
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/workouts" element={<Workouts />} />
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
