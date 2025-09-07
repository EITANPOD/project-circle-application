import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

  async function loadWorkouts() {
    const base = (window as any).__API_BASE__ || ''
    const res = await fetch(`${base}/api/workouts`, { credentials: 'include' })
    if (res.status === 401) return nav('/login')
    const data = await res.json()
    setWorkouts(data)
  }

  async function loadExercises(workoutId: number) {
    const base = (window as any).__API_BASE__ || ''
    try {
      const res = await fetch(`${base}/api/workouts/${workoutId}/exercises`, { credentials: 'include' })
      if (res.ok) {
        const exercises = await res.json()
        setWorkouts(prev => prev.map(w => 
          w.id === workoutId ? { ...w, exercises } : w
        ))
        
        // Also update the selected workout if it's the current one
        setSelectedWorkout(prev => {
          if (prev && prev.id === workoutId) {
            return { ...prev, exercises }
          }
          return prev
        })
        
        return exercises
      } else {
        console.error('Failed to load exercises:', res.status)
        return []
      }
    } catch (error) {
      console.error('Error loading exercises:', error)
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

  async function deleteWorkout(id: number) {
    const base = (window as any).__API_BASE__ || ''
    await fetch(`${base}/api/workouts/${id}`, { method: 'DELETE', credentials: 'include' })
    loadWorkouts()
    if (selectedWorkout?.id === id) {
      setSelectedWorkout(null)
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
        console.error('No exercise logs to submit')
        return
      }
      
      console.log('Submitting workout log:', JSON.stringify(loggingForm, null, 2))
      
      const res = await fetch(`${base}/api/workouts/${selectedWorkout.id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loggingForm)
      })
      
      if (res.ok) {
        const responseData = await res.json()
        console.log('Workout log saved successfully:', responseData)
        
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
        console.error('Failed to log workout:', res.status)
        const errorText = await res.text()
        console.error('Error details:', errorText)
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
      await loadExercises(workout.id)
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
    console.log(`Updating exercise ${exerciseId}, field: ${field}, value:`, value)
    
    setLoggingForm(prev => {
      const existingIndex = prev.exercise_logs.findIndex(log => log.exercise_id === exerciseId)
      
      if (existingIndex >= 0) {
        // Update existing exercise log
        const updated = [...prev.exercise_logs]
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          [field]: value 
        }
        console.log('Updated existing exercise log:', updated[existingIndex])
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
        console.log('Created new exercise log:', newExerciseLog)
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

  function initializeLoggingForm() {
    if (!selectedWorkout?.exercises) {
      console.log('No exercises found in selected workout')
      return
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
    console.log('Initialized logging form with exercises:', initialExerciseLogs)
  }

  useEffect(() => { loadWorkouts() }, [])

  return (
    <div className="workouts-container">
      {/* Workouts List */}
      <div className="workouts-list">
        <h2>My Workouts</h2>
        <form onSubmit={addWorkout} style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <input 
              className="form-input"
              placeholder="Workout title" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
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
          <button type="submit" className="form-button">Add Workout</button>
        </form>
        
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
                <button 
                  className="delete-btn"
                  onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id) }}
                >
                  X
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {selectedWorkout && isLoading && (
        <div className="workout-details">
          <h3>{selectedWorkout.title}</h3>
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            Loading workout details...
          </div>
        </div>
      )}

      {/* Workout Details */}
      {selectedWorkout && !isLoading && (
        <div className="workout-details">
          <h3>{selectedWorkout.title}</h3>
          {selectedWorkout.notes && <p>{selectedWorkout.notes}</p>}
          
          <div style={{ marginBottom: '20px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowExerciseForm(!showExerciseForm)}
              style={{ marginRight: '10px' }}
            >
              {showExerciseForm ? 'Cancel' : 'Add Exercise'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                if (!showLoggingForm) {
                  initializeLoggingForm()
                }
                setShowLoggingForm(!showLoggingForm)
              }}
            >
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
                <input 
                  className="form-input"
                  type="number" 
                  placeholder="Sets" 
                  value={exerciseForm.sets} 
                  onChange={e => setExerciseForm(prev => ({ ...prev, sets: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  className="form-input"
                  type="number" 
                  placeholder="Reps" 
                  value={exerciseForm.reps} 
                  onChange={e => setExerciseForm(prev => ({ ...prev, reps: parseInt(e.target.value) || 0 }))}
                />
                <input 
                  className="form-input"
                  type="number" 
                  placeholder="Rest (sec)" 
                  value={exerciseForm.rest_seconds} 
                  onChange={e => setExerciseForm(prev => ({ ...prev, rest_seconds: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <input 
                  className="form-input"
                  placeholder="Notes (optional)" 
                  value={exerciseForm.notes} 
                  onChange={e => setExerciseForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              <button type="submit" className="form-button">Add Exercise</button>
            </form>
          )}

          {showLoggingForm && selectedWorkout.exercises && (
            <form onSubmit={logWorkout} className="logging-section">
              <h4>Log Your Workout</h4>
              <div className="form-group">
                <input 
                  className="form-input"
                  placeholder="Workout notes (optional)" 
                  value={loggingForm.notes} 
                  onChange={e => setLoggingForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>
              {selectedWorkout.exercises.length > 0 ? (
                selectedWorkout.exercises.map(exercise => {
                  const exerciseLog = loggingForm.exercise_logs.find(log => log.exercise_id === exercise.id)
                  return (
                    <div key={exercise.id} style={{ marginBottom: '15px', padding: '10px', border: '1px solid #2ecc71', borderRadius: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{exercise.name}</div>
                      <div className="log-inputs">
                        <input 
                          className="log-input"
                          type="number" 
                          placeholder="Actual sets" 
                          value={exerciseLog?.actual_sets || ''}
                          onChange={e => updateLoggingForm(exercise.id, 'actual_sets', parseInt(e.target.value) || 0)}
                        />
                        <input 
                          className="log-input"
                          type="number" 
                          placeholder="Actual reps" 
                          value={exerciseLog?.actual_reps || ''}
                          onChange={e => updateLoggingForm(exercise.id, 'actual_reps', parseInt(e.target.value) || 0)}
                        />
                        <input 
                          className="log-input"
                          type="number" 
                          placeholder="Weight (kg)" 
                          value={exerciseLog?.weight || ''}
                          onChange={e => updateLoggingForm(exercise.id, 'weight', parseFloat(e.target.value) || undefined)}
                        />
                        <input 
                          className="log-input"
                          placeholder="Notes" 
                          value={exerciseLog?.notes || ''}
                          onChange={e => updateLoggingForm(exercise.id, 'notes', e.target.value)}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
                  No exercises in this workout yet. Add exercises first!
                </div>
              )}
              <button type="submit" className="log-btn">Save Workout Log</button>
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
                      X
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
    </div>
  )
}
