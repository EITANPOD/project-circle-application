import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Workouts } from './pages/Workouts'
import { WorkoutDetail } from './pages/WorkoutDetail'
import { Home } from './pages/Home'
import { Settings } from './pages/Settings'
import { Dashboard } from './pages/Dashboard'
import { WorkoutTemplates } from './pages/WorkoutTemplates'
import { ExerciseLibrary } from './pages/ExerciseLibrary'
import { WorkoutHistory } from './pages/WorkoutHistory'
import { AuthProvider } from './contexts/AuthContext'
import { Navigation } from './components/Navigation'

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
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/workouts" element={<Workouts />} />
                    <Route path="/workouts/:id" element={<WorkoutDetail />} />
                    <Route path="/history" element={<WorkoutHistory />} />
                    <Route path="/templates" element={<WorkoutTemplates />} />
                    <Route path="/exercises" element={<ExerciseLibrary />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
