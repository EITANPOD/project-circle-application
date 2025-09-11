import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icon'

type WorkoutTemplate = {
  id: string
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number
  equipment: string[]
  exercises: TemplateExercise[]
  image?: string
  tags: string[]
}

type TemplateExercise = {
  name: string
  sets: number
  reps: number
  rest_seconds: number
  notes: string
}

const workoutTemplates: WorkoutTemplate[] = [
  {
    id: 'full-body-beginner',
    name: 'Full Body Beginner',
    description: 'A complete full-body workout perfect for beginners',
    category: 'Full Body',
    difficulty: 'beginner',
    duration: 30,
    equipment: ['None'],
    tags: ['beginner', 'full-body', 'no-equipment'],
    exercises: [
      { name: 'Push-ups', sets: 3, reps: 8, rest_seconds: 60, notes: 'Keep your core tight' },
      { name: 'Bodyweight Squats', sets: 3, reps: 12, rest_seconds: 60, notes: 'Go down until thighs parallel' },
      { name: 'Plank', sets: 3, reps: 1, rest_seconds: 60, notes: 'Hold for 30 seconds' },
      { name: 'Lunges', sets: 3, reps: 10, rest_seconds: 60, notes: 'Alternate legs' },
      { name: 'Mountain Climbers', sets: 3, reps: 20, rest_seconds: 60, notes: 'Keep core engaged' }
    ]
  },
  {
    id: 'upper-body-strength',
    name: 'Upper Body Strength',
    description: 'Build upper body strength with this focused workout',
    category: 'Upper Body',
    difficulty: 'intermediate',
    duration: 45,
    equipment: ['Dumbbells', 'Pull-up Bar'],
    tags: ['strength', 'upper-body', 'intermediate'],
    exercises: [
      { name: 'Bench Press', sets: 4, reps: 8, rest_seconds: 90, notes: 'Use proper form' },
      { name: 'Pull-ups', sets: 4, reps: 6, rest_seconds: 90, notes: 'Full range of motion' },
      { name: 'Overhead Press', sets: 3, reps: 10, rest_seconds: 75, notes: 'Keep core tight' },
      { name: 'Bent-over Rows', sets: 3, reps: 12, rest_seconds: 75, notes: 'Squeeze shoulder blades' },
      { name: 'Dips', sets: 3, reps: 10, rest_seconds: 60, notes: 'Control the movement' }
    ]
  },
  {
    id: 'hiit-cardio',
    name: 'HIIT Cardio Blast',
    description: 'High-intensity interval training for maximum calorie burn',
    category: 'Cardio',
    difficulty: 'advanced',
    duration: 25,
    equipment: ['None'],
    tags: ['hiit', 'cardio', 'fat-burn', 'advanced'],
    exercises: [
      { name: 'Burpees', sets: 4, reps: 15, rest_seconds: 30, notes: 'Full body movement' },
      { name: 'Jump Squats', sets: 4, reps: 20, rest_seconds: 30, notes: 'Explosive movement' },
      { name: 'High Knees', sets: 4, reps: 30, rest_seconds: 30, notes: 'Run in place' },
      { name: 'Mountain Climbers', sets: 4, reps: 25, rest_seconds: 30, notes: 'Fast pace' },
      { name: 'Jumping Jacks', sets: 4, reps: 40, rest_seconds: 30, notes: 'Full range' }
    ]
  },
  {
    id: 'core-focused',
    name: 'Core Crusher',
    description: 'Target your core with this intense ab workout',
    category: 'Core',
    difficulty: 'intermediate',
    duration: 20,
    equipment: ['None'],
    tags: ['core', 'abs', 'strength', 'intermediate'],
    exercises: [
      { name: 'Plank', sets: 3, reps: 1, rest_seconds: 45, notes: 'Hold for 60 seconds' },
      { name: 'Russian Twists', sets: 3, reps: 20, rest_seconds: 45, notes: 'Keep feet off ground' },
      { name: 'Bicycle Crunches', sets: 3, reps: 25, rest_seconds: 45, notes: 'Slow and controlled' },
      { name: 'Leg Raises', sets: 3, reps: 15, rest_seconds: 45, notes: 'Keep legs straight' },
      { name: 'Mountain Climbers', sets: 3, reps: 30, rest_seconds: 45, notes: 'Core engaged' }
    ]
  },
  {
    id: 'leg-day',
    name: 'Leg Day Destroyer',
    description: 'Build strong, powerful legs with this comprehensive workout',
    category: 'Lower Body',
    difficulty: 'advanced',
    duration: 50,
    equipment: ['Barbell', 'Dumbbells'],
    tags: ['legs', 'strength', 'advanced', 'power'],
    exercises: [
      { name: 'Back Squats', sets: 4, reps: 8, rest_seconds: 120, notes: 'Full depth' },
      { name: 'Romanian Deadlifts', sets: 4, reps: 10, rest_seconds: 120, notes: 'Keep back straight' },
      { name: 'Walking Lunges', sets: 3, reps: 12, rest_seconds: 90, notes: 'Each leg' },
      { name: 'Bulgarian Split Squats', sets: 3, reps: 10, rest_seconds: 90, notes: 'Each leg' },
      { name: 'Calf Raises', sets: 4, reps: 20, rest_seconds: 60, notes: 'Full range of motion' }
    ]
  },
  {
    id: 'yoga-flow',
    name: 'Morning Yoga Flow',
    description: 'Start your day with this gentle yoga sequence',
    category: 'Flexibility',
    difficulty: 'beginner',
    duration: 30,
    equipment: ['Yoga Mat'],
    tags: ['yoga', 'flexibility', 'morning', 'beginner'],
    exercises: [
      { name: 'Sun Salutation A', sets: 3, reps: 1, rest_seconds: 30, notes: 'Flow smoothly' },
      { name: 'Warrior I', sets: 2, reps: 1, rest_seconds: 30, notes: 'Hold for 30 seconds each side' },
      { name: 'Downward Dog', sets: 3, reps: 1, rest_seconds: 30, notes: 'Hold for 45 seconds' },
      { name: 'Child\'s Pose', sets: 2, reps: 1, rest_seconds: 30, notes: 'Relax and breathe' },
      { name: 'Corpse Pose', sets: 1, reps: 1, rest_seconds: 0, notes: 'Final relaxation' }
    ]
  }
]

export function WorkoutTemplates() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const categories = ['All', ...Array.from(new Set(workoutTemplates.map(t => t.category)))]
  const difficulties = ['All', 'beginner', 'intermediate', 'advanced']

  const filteredTemplates = workoutTemplates.filter(template => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesDifficulty && matchesSearch
  })

  async function createWorkoutFromTemplate(template: WorkoutTemplate) {
    if (!user) return

    setIsCreating(true)
    try {
      const base = (window as any).__API_BASE__ || ''
      
      // Create the workout
      const workoutRes = await fetch(`${base}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: template.name,
          notes: template.description
        })
      })

      if (workoutRes.ok) {
        const workout = await workoutRes.json()
        
        // Add exercises to the workout
        for (const exercise of template.exercises) {
          await fetch(`${base}/api/workouts/${workout.id}/exercises`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(exercise)
          })
        }

        alert('Workout created successfully!')
        navigate('/workouts')
      } else {
        alert('Failed to create workout. Please try again.')
      }
    } catch (error) {
      console.error('Error creating workout:', error)
      alert('Error creating workout. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'Full Body': return 'dumbbell'
      case 'Upper Body': return 'target'
      case 'Lower Body': return 'activity'
      case 'Core': return 'zap'
      case 'Cardio': return 'flame'
      case 'Flexibility': return 'heart'
      default: return 'dumbbell'
    }
  }

  if (authLoading) {
    return (
      <div className="main-content">
        <div className="loading">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="templates-container">
      <div className="templates-header">
        <h1 className="templates-title">
          <Icon name="bookmark" size={32} className="mr-3" />
          FitForge Templates
        </h1>
        <p className="templates-subtitle">Forge your workouts with our curated collection of training plans</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Icon name="search" size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="filter-select"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="filter-select"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="templates-grid">
        {filteredTemplates.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <div className="template-category">
                <Icon name={getCategoryIcon(template.category)} size={16} />
                <span>{template.category}</span>
              </div>
              <div className={`difficulty-badge ${getDifficultyColor(template.difficulty)}`}>
                {template.difficulty}
              </div>
            </div>

            <div className="template-content">
              <h3 className="template-name">{template.name}</h3>
              <p className="template-description">{template.description}</p>
              
              <div className="template-meta">
                <div className="meta-item">
                  <Icon name="clock" size={16} />
                  <span>{template.duration} min</span>
                </div>
                <div className="meta-item">
                  <Icon name="activity" size={16} />
                  <span>{template.exercises.length} exercises</span>
                </div>
              </div>

              <div className="template-tags">
                {template.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>

              <div className="template-equipment">
                <Icon name="dumbbell" size={16} />
                <span>{template.equipment.join(', ')}</span>
              </div>
            </div>

            <div className="template-actions">
              <button
                className="preview-btn"
                onClick={() => {/* TODO: Add preview modal */}}
              >
                <Icon name="eye" size={16} />
                Preview
              </button>
              <button
                className="create-btn"
                onClick={() => createWorkoutFromTemplate(template)}
                disabled={isCreating}
              >
                <Icon name="plus" size={16} />
                {isCreating ? 'Creating...' : 'Create Workout'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="no-templates">
          <Icon name="search" size={48} />
          <h3>No templates found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  )
}
