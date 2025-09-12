import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icon'

type Workout = { 
  id: number; 
  title: string; 
  notes?: string;
  exercises?: Exercise[];
}

type Exercise = {
  id: number;
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes?: string;
}

type WorkoutLog = {
  id: number;
  workout_date: string;
  notes?: string;
  exercise_logs: ExerciseLog[];
}

type ExerciseLog = {
  id: number;
  exercise_id: number;
  actual_sets: number;
  actual_reps: number;
  weight?: number;
  notes?: string;
}

export function Workouts() {
  const nav = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [showLoggingForm, setShowLoggingForm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: 3,
    reps: 10,
    rest_seconds: 60,
    notes: ''
  })
  const [loggingForm, setLoggingForm] = useState<{
    notes: string;
    exercise_logs: Array<{
      exercise_id: number;
      actual_sets: number;
      actual_reps: number;
      weight?: number;
      notes?: string;
    }>;
  }>({
    notes: '',
    exercise_logs: []
  })
  
  // AI Workout Generation states
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiRequest, setAiRequest] = useState({
    user_request: '',
    workout_type: '',
    duration_minutes: 45,
    difficulty_level: 'intermediate',
    equipment_available: [] as string[],
    focus_areas: [] as string[]
  })
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiGeneratedWorkout, setAiGeneratedWorkout] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      nav('/login')
    }
  }, [user, authLoading, nav])

  async function loadWorkouts() {
    const base = (window as any).__API_BASE__ || ''
    const res = await fetch(`${base}/api/workouts`, { credentials: 'include' })
    if (res.status === 401) return nav('/login')
    const data = await res.json()
    setWorkouts(data)
  }

  async function loadExercises(workoutId: number) {
    const base = (window as any).__API_BASE__ || ''
    console.log(`Loading exercises for workout ${workoutId}`)
    try {
      const res = await fetch(`${base}/api/workouts/${workoutId}/exercises`, { credentials: 'include' })
      console.log(`Exercises API response for workout ${workoutId}:`, res.status)
      
      if (res.ok) {
        const exercises = await res.json()
        console.log(`Loaded ${exercises.length} exercises for workout ${workoutId}:`, exercises)
        
        setWorkouts(prev => prev.map(w => 
          w.id === workoutId ? { ...w, exercises } : w
        ))
        
        // Also update the selected workout if it's the current one
        setSelectedWorkout(prev => {
          if (prev && prev.id === workoutId) {
            console.log(`Updating selectedWorkout with exercises for workout ${workoutId}`)
            return { ...prev, exercises }
          }
          return prev
        })
        
        return exercises
      } else {
        const errorText = await res.text()
        console.error(`Failed to load exercises for workout ${workoutId}:`, res.status, errorText)
        return []
      }
    } catch (error) {
      console.error(`Error loading exercises for workout ${workoutId}:`, error)
      return []
    }
  }

  async function loadWorkoutLogs(workoutId: number) {
    const base = (window as any).__API_BASE__ || ''
    try {
      console.log('Loading workout logs for workout ID:', workoutId)
      const res = await fetch(`${base}/api/workouts/${workoutId}/logs`, { credentials: 'include' })
      
      if (res.ok) {
        const logs = await res.json()
        console.log('Raw workout logs from API:', JSON.stringify(logs, null, 2))
        console.log('Number of logs received:', logs ? logs.length : 0)
        
        // Ensure logs is an array and has proper structure
        const safeLogs = Array.isArray(logs) ? logs.map((log: any) => {
          console.log('Processing log:', log)
          console.log('Log exercise_logs:', log.exercise_logs)
          
          return {
            id: log.id || 0,
            workout_date: log.workout_date || new Date().toISOString(),
            notes: log.notes || '',
            exercise_logs: Array.isArray(log.exercise_logs) ? log.exercise_logs.map((exLog: any) => {
              console.log('Processing exercise log:', exLog)
              return {
                id: exLog.id || 0,
                exercise_id: exLog.exercise_id || 0,
                actual_sets: exLog.actual_sets || 0,
                actual_reps: exLog.actual_reps || 0,
                weight: exLog.weight || undefined,
                notes: exLog.notes || ''
              }
            }) : []
          }
        }) : []
        
        console.log('Processed workout logs:', safeLogs)
        console.log('Selected workout exercises:', selectedWorkout?.exercises)
        setWorkoutLogs(safeLogs)
        return safeLogs
      } else {
        console.error('Failed to load workout logs:', res.status)
        const errorText = await res.text()
        console.error('Error response:', errorText)
        setWorkoutLogs([])
        return []
      }
    } catch (error) {
      console.error('Error loading workout logs:', error)
      setWorkoutLogs([])
      return []
    }
  }

  async function addWorkout(e: React.FormEvent) {
    const base = (window as any).__API_BASE__ || ''
    e.preventDefault()
    try {
      const res = await fetch(`${base}/api/workouts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, notes })
      })
      
      if (res.ok) {
        setTitle(''); 
        setNotes('')
        await loadWorkouts()
        alert('Workout created successfully!')
      } else {
        console.error('Failed to create workout:', res.status)
        alert('Failed to create workout. Please try again.')
      }
    } catch (error) {
      console.error('Error creating workout:', error)
      alert('Error creating workout. Please try again.')
    }
  }

  function confirmDeleteWorkout(workout: Workout) {
    setWorkoutToDelete(workout)
    setShowDeleteConfirm(true)
  }

  async function deleteWorkout() {
    if (!workoutToDelete) return
    
    const base = (window as any).__API_BASE__ || ''
    try {
      const res = await fetch(`${base}/api/workouts/${workoutToDelete.id}`, { 
        method: 'DELETE', 
        credentials: 'include' 
      })
      
      if (res.ok) {
        await loadWorkouts()
        if (selectedWorkout?.id === workoutToDelete.id) {
          setSelectedWorkout(null)
        }
        setShowDeleteConfirm(false)
        setWorkoutToDelete(null)
      } else {
        alert('Failed to delete workout. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
      alert('Error deleting workout. Please try again.')
    }
  }

  async function addExercise(e: React.FormEvent) {
    const base = (window as any).__API_BASE__ || ''
    e.preventDefault()
    if (!selectedWorkout) return
    
    try {
      const res = await fetch(`${base}/api/workouts/${selectedWorkout.id}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(exerciseForm)
      })
      
      if (res.ok) {
        setExerciseForm({
          name: '',
          sets: 3,
          reps: 10,
          rest_seconds: 60,
          notes: ''
        })
        setShowExerciseForm(false)
        await loadExercises(selectedWorkout.id)
        alert('Exercise added successfully!')
      } else {
        console.error('Failed to add exercise:', res.status)
        alert('Failed to add exercise. Please try again.')
      }
    } catch (error) {
      console.error('Error adding exercise:', error)
      alert('Error adding exercise. Please try again.')
    }
  }

  async function deleteExercise(exerciseId: number) {
    const base = (window as any).__API_BASE__ || ''
    if (!selectedWorkout) return
    await fetch(`${base}/api/workouts/${selectedWorkout.id}/exercises/${exerciseId}`, { 
      method: 'DELETE', 
      credentials: 'include' 
    })
    loadExercises(selectedWorkout.id)
  }

  async function logWorkout(e: React.FormEvent) {
    const base = (window as any).__API_BASE__ || ''
    e.preventDefault()
    if (!selectedWorkout) return
    
    try {
      // Validate that we have exercise logs to submit
      if (!loggingForm.exercise_logs || loggingForm.exercise_logs.length === 0) {
        alert('No exercise data to log. Please make sure exercises are loaded and try again.')
        return
      }
      
      const res = await fetch(`${base}/api/workouts/${selectedWorkout.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loggingForm)
      })
      
      if (res.ok) {
        // Reset form states immediately
        setLoggingForm({ notes: '', exercise_logs: [] })
        setShowLoggingForm(false)
        
        // Immediately reload workout logs
        setIsRefreshingLogs(true)
        await loadWorkoutLogs(selectedWorkout.id)
        setIsRefreshingLogs(false)
        
        // Show success message
        alert('Workout logged successfully!')
      } else {
        alert('Failed to log workout. Please try again.')
      }
    } catch (error) {
      console.error('Error logging workout:', error)
      alert('Error logging workout. Please try again.')
    }
  }

  async function selectWorkout(workout: Workout) {
    try {
      setIsLoading(true)
      
      // Reset all form states to prevent crashes
      setShowExerciseForm(false)
      setShowLoggingForm(false)
      setLoggingForm({ notes: '', exercise_logs: [] })
      setExerciseForm({
        name: '',
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        notes: ''
      })
      
      // Set selected workout
      setSelectedWorkout(workout)
      
      // Always reload exercises first, then logs to ensure exercises are available
      const exercises = await loadExercises(workout.id)
      await loadWorkoutLogs(workout.id)
    } catch (error) {
      console.error('Error selecting workout:', error)
      // Reset to safe state on error
      setSelectedWorkout(null)
    } finally {
      setIsLoading(false)
    }
  }

  function updateLoggingForm(exerciseId: number, field: string, value: any) {
    setLoggingForm(prev => {
      const existingIndex = prev.exercise_logs.findIndex(log => log.exercise_id === exerciseId)
      
      if (existingIndex >= 0) {
        // Update existing exercise log
        const updated = [...prev.exercise_logs]
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          [field]: value 
        }
        return { ...prev, exercise_logs: updated }
      } else {
        // Create new exercise log entry
        const newExerciseLog = {
          exercise_id: exerciseId,
          actual_sets: field === 'actual_sets' ? value : 0,
          actual_reps: field === 'actual_reps' ? value : 0,
          weight: field === 'weight' ? value : undefined,
          notes: field === 'notes' ? value : ''
        }
        return {
          ...prev,
          exercise_logs: [...prev.exercise_logs, newExerciseLog]
        }
      }
    })
  }

  function toggleLogExpansion(logId: number) {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  async function initializeLoggingForm() {
    if (!selectedWorkout) {
      return
    }
    
    if (!selectedWorkout.exercises || selectedWorkout.exercises.length === 0) {
      const exercises = await loadExercises(selectedWorkout.id)
      if (exercises && exercises.length > 0) {
        // Update the selected workout with the loaded exercises
        setSelectedWorkout(prev => prev ? { ...prev, exercises } : null)
        // Recursively call this function now that exercises are loaded
        return initializeLoggingForm()
      } else {
        alert('No exercises found for this workout. Please add exercises first.')
        return
      }
    }
    
    const initialExerciseLogs = selectedWorkout.exercises.map(exercise => ({
      exercise_id: exercise.id,
      actual_sets: 0,
      actual_reps: 0,
      weight: undefined,
      notes: ''
    }))
    
    setLoggingForm({
      notes: '',
      exercise_logs: initialExerciseLogs
    })
  }

  async function generateAIWorkout() {
    if (!aiRequest.user_request.trim()) {
      alert('Please describe what kind of workout you want!')
      return
    }
    
    setIsGeneratingAI(true)
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/workouts/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(aiRequest)
      })
      
      if (res.ok) {
        const aiWorkout = await res.json()
        setAiGeneratedWorkout(aiWorkout)
        setShowAIModal(false)
      } else {
        console.error('Failed to generate AI workout:', res.status)
        alert('Failed to generate workout. Please try again.')
      }
    } catch (error) {
      console.error('Error generating AI workout:', error)
      alert('Error generating workout. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  async function saveAIWorkout() {
    if (!aiRequest.user_request.trim()) {
      alert('Please describe what kind of workout you want!')
      return
    }
    
    setIsGeneratingAI(true)
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/workouts/ai-generate-and-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(aiRequest)
      })
      
      if (res.ok) {
        const result = await res.json()
        setShowAIModal(false)
        setAiRequest({
          user_request: '',
          workout_type: '',
          duration_minutes: 45,
          difficulty_level: 'intermediate',
          equipment_available: [],
          focus_areas: []
        })
        await loadWorkouts()
        alert('AI workout created successfully!')
      } else {
        console.error('Failed to save AI workout:', res.status)
        alert('Failed to create workout. Please try again.')
      }
    } catch (error) {
      console.error('Error saving AI workout:', error)
      alert('Error creating workout. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  useEffect(() => { loadWorkouts() }, [])

  return (
    <div className="workouts-container">
      {/* Workouts List */}
      <div className="workouts-list">
        <h2>My Workouts</h2>
        <div className="add-workout-section">
          <h3 className="section-subtitle">🏋️ Create New Workout</h3>
          <form onSubmit={addWorkout} className="add-workout-form">
            <div className="form-group">
              <input 
                className="form-input"
                placeholder="Workout title" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input 
                className="form-input"
                placeholder="Notes (optional)" 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <button type="submit" className="form-button add-workout-btn">
              <Icon name="plus" size={16} className="mr-2" />
              Add Workout
            </button>
          </form>
          
          <div className="ai-workout-section">
            <button 
              className="ai-generate-btn"
              onClick={() => setShowAIModal(true)}
            >
              <Icon name="bot" size={16} className="mr-2" />
              Generate with AI
            </button>
          </div>
        </div>
        
        <div>
          {workouts.map(w => (
            <div 
              key={w.id} 
              className={`workout-item ${selectedWorkout?.id === w.id ? 'selected' : ''}`}
              onClick={() => selectWorkout(w)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="workout-title">{w.title}</div>
                  {w.notes && <div className="workout-notes">{w.notes}</div>}
                  {w.exercises && (
                    <div className="workout-exercise-count">
                      {w.exercises.length} exercises
                    </div>
                  )}
                </div>
                <div className="workout-actions">
                  <button 
                    className="view-details-btn"
                    onClick={(e) => { e.stopPropagation(); nav(`/workouts/${w.id}`) }}
                    title="View Details"
                  >
                    <Icon name="eye" size={16} />
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={(e) => { e.stopPropagation(); confirmDeleteWorkout(w) }}
                    title="Delete Workout"
                  >
                    <Icon name="trash-2" size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {selectedWorkout && isLoading && (
        <div className="workout-details">
          <h3>{selectedWorkout.title}</h3>
          <div className="loading">Loading workout details...</div>
        </div>
      )}

      {/* Workout Details */}
      {selectedWorkout && !isLoading && (
        <div className="workout-details">
          <h3>{selectedWorkout.title}</h3>
          {selectedWorkout.notes && <p>{selectedWorkout.notes}</p>}
          
          <div className="workout-actions">
            <button 
              className="btn btn-primary action-btn"
              onClick={() => setShowExerciseForm(!showExerciseForm)}
            >
              <Icon name={showExerciseForm ? "x" : "plus"} size={16} className="mr-2" />
              {showExerciseForm ? 'Cancel' : 'Add Exercise'}
            </button>
            <button 
              className="btn btn-secondary action-btn"
              onClick={async () => {
                if (!showLoggingForm) {
                  // Ensure exercises are loaded first
                  if (selectedWorkout && (!selectedWorkout.exercises || selectedWorkout.exercises.length === 0)) {
                    await loadExercises(selectedWorkout.id)
                  }
                  await initializeLoggingForm()
                }
                setShowLoggingForm(!showLoggingForm)
              }}
            >
              <Icon name={showLoggingForm ? "x" : "edit"} size={16} className="mr-2" />
              {showLoggingForm ? 'Cancel Logging' : 'Log Workout'}
            </button>
          </div>

          {showExerciseForm && (
            <form onSubmit={addExercise} className="exercise-form">
              <h4>Add Exercise</h4>
              <div className="form-group">
                <input 
                  className="form-input"
                  placeholder="Exercise name" 
                  value={exerciseForm.name} 
                  onChange={e => setExerciseForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="exercise-inputs">
                <div className="input-group">
                  <label className="input-label">Sets</label>
                  <input 
                    className="form-input"
                    type="number" 
                    placeholder="3" 
                    value={exerciseForm.sets} 
                    onChange={e => setExerciseForm(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Reps</label>
                  <input 
                    className="form-input"
                    type="number" 
                    placeholder="10" 
                    value={exerciseForm.reps} 
                    onChange={e => setExerciseForm(prev => ({ ...prev, reps: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Rest (seconds)</label>
                  <input 
                    className="form-input"
                    type="number" 
                    placeholder="60" 
                    value={exerciseForm.rest_seconds} 
                    onChange={e => setExerciseForm(prev => ({ ...prev, rest_seconds: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <input 
                  className="form-input"
                  placeholder="Notes (optional)" 
                  value={exerciseForm.notes} 
                  onChange={e => setExerciseForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <button type="submit" className="form-button">
                <Icon name="plus" size={16} className="mr-2" />
                Add Exercise
              </button>
            </form>
          )}

          {showLoggingForm && selectedWorkout.exercises && (
            <form onSubmit={logWorkout} className="logging-section">
              <h4>
                <Icon name="edit" size={20} className="mr-2" />
                Log Your Workout
              </h4>
              <div className="form-group">
                <input 
                  className="form-input"
                  placeholder="Workout notes (optional)" 
                  value={loggingForm.notes} 
                  onChange={e => setLoggingForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              {selectedWorkout.exercises.length > 0 ? (
                <div className="logging-exercises-container">
                  {selectedWorkout.exercises.map(exercise => {
                    const exerciseLog = loggingForm.exercise_logs.find(log => log.exercise_id === exercise.id)
                    return (
                      <div key={exercise.id} className="exercise-log-card">
                        <div className="exercise-log-header">
                          <h5 className="exercise-log-name">{exercise.name}</h5>
                          <div className="exercise-log-target">
                            Target: {exercise.sets} sets × {exercise.reps} reps
                          </div>
                        </div>
                        <div className="log-inputs">
                          <div className="log-input-group">
                            <label className="log-label">Sets Completed</label>
                            <input 
                              className="log-input"
                              type="number" 
                              placeholder="0" 
                              value={exerciseLog?.actual_sets || ''}
                              onChange={e => updateLoggingForm(exercise.id, 'actual_sets', parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                          <div className="log-input-group">
                            <label className="log-label">Reps per Set</label>
                            <input 
                              className="log-input"
                              type="number" 
                              placeholder="0" 
                              value={exerciseLog?.actual_reps || ''}
                              onChange={e => updateLoggingForm(exercise.id, 'actual_reps', parseInt(e.target.value) || 0)}
                              min="0"
                            />
                          </div>
                          <div className="log-input-group">
                            <label className="log-label">Weight (kg)</label>
                            <input 
                              className="log-input"
                              type="number" 
                              placeholder="0" 
                              value={exerciseLog?.weight || ''}
                              onChange={e => updateLoggingForm(exercise.id, 'weight', parseFloat(e.target.value) || undefined)}
                              min="0"
                              step="0.5"
                            />
                          </div>
                          <div className="log-input-group">
                            <label className="log-label">Notes</label>
                            <input 
                              className="log-input"
                              placeholder="How did it feel?" 
                              value={exerciseLog?.notes || ''}
                              onChange={e => updateLoggingForm(exercise.id, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="no-exercises-message">
                  <Icon name="dumbbell" size={48} className="no-exercises-icon" />
                  <p>No exercises in this workout yet. Add exercises first!</p>
                </div>
              )}
              <button type="submit" className="log-btn">
                <Icon name="save" size={16} className="mr-2" />
                Save Workout Log
              </button>
            </form>
          )}

          <div>
            <h4>Exercises</h4>
            {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
              selectedWorkout.exercises.map(exercise => (
                <div key={exercise.id} className="exercise-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="exercise-name">{exercise.name}</div>
                      <div className="exercise-details">
                        {exercise.sets} sets × {exercise.reps} reps
                        {exercise.rest_seconds > 0 && (
                          <span style={{ marginLeft: '10px' }}>
                            Rest: {exercise.rest_seconds}s
                          </span>
                        )}
                      </div>
                      {exercise.notes && (
                        <div className="exercise-notes">
                          {exercise.notes}
                        </div>
                      )}
                    </div>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteExercise(exercise.id)}
                    >
                      <Icon name="trash-2" size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#666', fontStyle: 'italic' }}>
                No exercises yet. Add your first exercise!
              </div>
            )}
          </div>

          {/* Workout History */}
          <div style={{ marginTop: '2rem' }}>
            <h4>Workout History</h4>
            {isRefreshingLogs && (
              <div style={{ 
                textAlign: 'center', 
                padding: '10px', 
                color: '#2ecc71',
                fontSize: '0.9em'
              }}>
                Refreshing workout history...
              </div>
            )}
            {workoutLogs && workoutLogs.length > 0 ? (
              workoutLogs.map((log: any) => {
                const isExpanded = expandedLogs.has(log.id)
                return (
                  <div key={log.id} style={{ 
                    background: 'rgba(46, 204, 113, 0.1)', 
                    border: '1px solid #2ecc71', 
                    borderRadius: '10px', 
                    padding: '15px', 
                    marginBottom: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => toggleLogExpansion(log.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(46, 204, 113, 0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(46, 204, 113, 0.1)'
                  }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      fontWeight: 'bold', 
                      marginBottom: '10px' 
                    }}>
                      <div>
                        {new Date(log.workout_date).toLocaleDateString()} - {new Date(log.workout_date).toLocaleTimeString()}
                      </div>
                      <div style={{ 
                        fontSize: '0.8em', 
                        color: '#2ecc71',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}>
                        ▼
                      </div>
                    </div>
                    
                    {log.notes && (
                      <div style={{ 
                        marginBottom: '10px', 
                        padding: '8px', 
                        background: 'rgba(255, 255, 255, 0.1)', 
                        borderRadius: '5px',
                        fontSize: '0.9em'
                      }}>
                        <strong>Notes:</strong> {log.notes}
                      </div>
                    )}
                    
                    {isExpanded && (
                      <div style={{ 
                        marginTop: '15px',
                        padding: '15px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(46, 204, 113, 0.3)'
                      }}>
                        <h5 style={{ margin: '0 0 15px 0', color: '#2ecc71' }}>Exercise Details:</h5>
                        {(() => {
                          console.log('DEBUG: Workout log exercise_logs:', log.exercise_logs)
                          console.log('DEBUG: Selected workout exercises:', selectedWorkout?.exercises)
                          return null
                        })()}
                        {log.exercise_logs && log.exercise_logs.length > 0 ? (
                          log.exercise_logs.map((exLog: any) => {
                            // Find the exercise name from the selected workout
                            const exercise = selectedWorkout?.exercises?.find(ex => ex.id === exLog.exercise_id)
                            console.log('Exercise log:', exLog, 'Found exercise:', exercise, 'Selected workout exercises:', selectedWorkout?.exercises)
                            
                            // Debug: Show raw data even if exercise name not found
                            return (
                              <div key={exLog.id} style={{ 
                                marginBottom: '12px',
                                padding: '10px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                border: '1px solid rgba(46, 204, 113, 0.2)'
                              }}>
                                <div style={{ 
                                  fontWeight: 'bold', 
                                  color: '#2ecc71',
                                  marginBottom: '5px'
                                }}>
                                  {exercise?.name || `Exercise ${exLog.exercise_id}`}
                                </div>
                                {/* Debug: Show raw exercise log data */}
                                <div style={{ fontSize: '0.8em', color: '#999', marginBottom: '5px' }}>
                                  DEBUG: ID={exLog.exercise_id}, Sets={exLog.actual_sets}, Reps={exLog.actual_reps}, Weight={exLog.weight}
                                </div>
                                <div style={{ fontSize: '0.9em', color: '#fff' }}>
                                  <div>✅ <strong>Completed:</strong> {exLog.actual_sets || 0} sets × {exLog.actual_reps || 0} reps</div>
                                  {exLog.weight && (
                                    <div>🏋️ <strong>Weight:</strong> {exLog.weight}kg</div>
                                  )}
                                  {exLog.notes && (
                                    <div>📝 <strong>Notes:</strong> {exLog.notes}</div>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          <div style={{ 
                            fontSize: '0.9em', 
                            color: '#666', 
                            fontStyle: 'italic',
                            textAlign: 'center',
                            padding: '20px'
                          }}>
                            No exercise details recorded for this workout
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!isExpanded && (
                      <div style={{ fontSize: '0.9em', color: '#666' }}>
                        {log.exercise_logs && log.exercise_logs.length > 0 ? (
                          <div>
                            <div style={{ marginBottom: '5px' }}>
                              <strong>Exercises completed:</strong> {log.exercise_logs.length}
                            </div>
                            <div style={{ fontStyle: 'italic' }}>
                              Click to view details
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontStyle: 'italic' }}>
                            No exercise details recorded
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666', 
                fontStyle: 'italic' 
              }}>
                No workout history yet. Log your first workout to see it here!
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Workout Generation Modal */}
      {showAIModal && (
        <div className="ai-modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="ai-modal" onClick={e => e.stopPropagation()}>
            <div className="ai-modal-header">
              <h3>
                <Icon name="bot" size={20} className="mr-2" />
                AI Workout Generator
              </h3>
              <button 
                className="ai-modal-close"
                onClick={() => setShowAIModal(false)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            
            <div className="ai-modal-content">
              <div className="form-group">
                <label className="form-label">Describe your ideal workout</label>
                <textarea
                  className="form-input ai-textarea"
                  placeholder="e.g., 'I want a 30-minute upper body workout for beginners with no equipment'"
                  value={aiRequest.user_request}
                  onChange={e => setAiRequest(prev => ({ ...prev, user_request: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="ai-options">
                <div className="form-group">
                  <label className="form-label">Workout Type (optional)</label>
                  <select
                    className="form-input"
                    value={aiRequest.workout_type}
                    onChange={e => setAiRequest(prev => ({ ...prev, workout_type: e.target.value }))}
                  >
                    <option value="">Any type</option>
                    <option value="strength">Strength Training</option>
                    <option value="cardio">Cardio</option>
                    <option value="hiit">HIIT</option>
                    <option value="yoga">Yoga</option>
                    <option value="pilates">Pilates</option>
                    <option value="flexibility">Flexibility</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="10"
                    max="120"
                    value={aiRequest.duration_minutes}
                    onChange={e => setAiRequest(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 45 }))}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Difficulty Level</label>
                  <select
                    className="form-input"
                    value={aiRequest.difficulty_level}
                    onChange={e => setAiRequest(prev => ({ ...prev, difficulty_level: e.target.value }))}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
              
              <div className="ai-modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowAIModal(false)}
                  disabled={isGeneratingAI}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={generateAIWorkout}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? 'Generating...' : 'Preview Workout'}
                </button>
                <button 
                  className="ai-save-btn"
                  onClick={saveAIWorkout}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? 'Creating...' : 'Create & Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generated Workout Preview */}
      {aiGeneratedWorkout && (
        <div className="ai-preview-overlay" onClick={() => setAiGeneratedWorkout(null)}>
          <div className="ai-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ai-preview-header">
              <h3>
                <Icon name="bot" size={20} className="mr-2" />
                AI Generated Workout
              </h3>
              <button 
                className="ai-modal-close"
                onClick={() => setAiGeneratedWorkout(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
            
            <div className="ai-preview-content">
              <div className="ai-workout-info">
                <h4>{aiGeneratedWorkout.title}</h4>
                <p>{aiGeneratedWorkout.description}</p>
                <div className="ai-workout-meta">
                  <span className="ai-meta-item">
                    <Icon name="clock" size={16} className="mr-1" />
                    {aiGeneratedWorkout.estimated_duration} minutes
                  </span>
                  <span className="ai-meta-item">
                    <Icon name="zap" size={16} className="mr-1" />
                    {aiGeneratedWorkout.difficulty}
                  </span>
                </div>
              </div>
              
              <div className="ai-exercises">
                <h5>Exercises:</h5>
                {aiGeneratedWorkout.exercises.map((exercise: any, index: number) => (
                  <div key={index} className="ai-exercise-card">
                    <div className="ai-exercise-name">{exercise.name}</div>
                    <div className="ai-exercise-details">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.rest_seconds > 0 && (
                        <span> • Rest: {exercise.rest_seconds}s</span>
                      )}
                    </div>
                    {exercise.notes && (
                      <div className="ai-exercise-notes">{exercise.notes}</div>
                    )}
                  </div>
                ))}
              </div>
              
              {aiGeneratedWorkout.tips && aiGeneratedWorkout.tips.length > 0 && (
                <div className="ai-tips">
                  <h5>
                    <Icon name="lightbulb" size={16} className="mr-2" />
                    Tips:
                  </h5>
                  <ul>
                    {aiGeneratedWorkout.tips.map((tip: string, index: number) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="ai-preview-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setAiGeneratedWorkout(null)}
                >
                  Close
                </button>
                <button 
                  className="ai-save-btn"
                  onClick={saveAIWorkout}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? 'Creating...' : 'Save This Workout'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && workoutToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">
                <Icon name="alert-triangle" size={24} />
              </div>
              <h3 className="modal-title">Delete Workout</h3>
            </div>
            
            <div className="modal-content">
              <p className="modal-message">
                Are you sure you want to delete <strong>"{workoutToDelete.title}"</strong>?
              </p>
              <p className="modal-warning">
                This action cannot be undone. All exercises and workout logs associated with this workout will be permanently deleted.
              </p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <Icon name="x" size={16} className="mr-2" />
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={deleteWorkout}
              >
                <Icon name="trash-2" size={16} className="mr-2" />
                Delete Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
