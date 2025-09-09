import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { Home } from '../pages/Home'

// Mock the API base
Object.defineProperty(window, '__API_BASE__', {
  value: 'http://localhost:8000',
  writable: true
})

// Mock the auth context
vi.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: null,
    isLoading: false
  })
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
)

describe('Home', () => {
  it('renders the main heading', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )
    
    expect(screen.getByText('Welcome to Workouts')).toBeDefined()
  })

  it('renders feature cards', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )
    
    expect(screen.getByText('Create Workouts')).toBeDefined()
    expect(screen.getByText('Track Progress')).toBeDefined()
    expect(screen.getByText('Stay Motivated')).toBeDefined()
    expect(screen.getByText('AI-Powered Planner')).toBeDefined()
  })

  it('renders call-to-action buttons', () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    )
    
    expect(screen.getByText('Get Started')).toBeDefined()
    expect(screen.getByText('Sign In')).toBeDefined()
  })
})
