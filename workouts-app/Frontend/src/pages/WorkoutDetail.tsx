import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

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

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())
  const [showLogModal, setShowLogModal] = useState(false)
  const [showExerciseLogModal, setShowExerciseLogModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [logNotes, setLogNotes] = useState('')
  const [exerciseLogs, setExerciseLogs] = useState<{[key: number]: {sets: number, reps: number, weight?: number, notes?: string}}>({})
  const [isLogging, setIsLogging] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  async function loadWorkout() {
    if (!id) return
    
    const base = (window as any).__API_BASE__ || ''
    try {
      const res = await fetch(`${base}/api/workouts/${id}`, { credentials: 'include' })
      if (res.status === 401) return navigate('/login')
      if (res.ok) {
        const workoutData = await res.json()
        setWorkout(workoutData)
        
        // Load exercises for this workout
        const exercisesRes = await fetch(`${base}/api/workouts/${id}/exercises`, { credentials: 'include' })
        if (exercisesRes.ok) {
          const exercises = await exercisesRes.json()
          setWorkout(prev => prev ? { ...prev, exercises } : null)
        }
        
        // Load workout logs
        const logsRes = await fetch(`${base}/api/workouts/${id}/logs`, { credentials: 'include' })
        if (logsRes.ok) {
          const logs = await logsRes.json()
          setWorkoutLogs(logs)
        }
      } else {
        navigate('/workouts')
      }
    } catch (error) {
      console.error('Error loading workout:', error)
      navigate('/workouts')
    } finally {
      setIsLoading(false)
    }
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

  function openLogModal() {
    // Initialize exercise logs with default values
    const initialExerciseLogs: {[key: number]: {sets: number, reps: number, weight?: number, notes?: string}} = {}
    
    if (workout?.exercises) {
      workout.exercises.forEach(exercise => {
        initialExerciseLogs[exercise.id] = {
          sets: exercise.sets,
          reps: exercise.reps,
          weight: 0,
          notes: ''
        }
      })
    }
    
    setExerciseLogs(initialExerciseLogs)
    setLogNotes('')
    setShowLogModal(true)
  }

  function openExerciseLogModal(exercise: Exercise) {
    setSelectedExercise(exercise)
    setExerciseLogs({
      [exercise.id]: {
        sets: exercise.sets,
        reps: exercise.reps,
        weight: 0,
        notes: ''
      }
    })
    setLogNotes('')
    setShowExerciseLogModal(true)
  }

  function updateExerciseLog(exerciseId: number, field: string, value: string | number) {
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }))
  }

  async function submitWorkoutLog() {
    if (!id || !workout?.exercises) return
    
    setIsLogging(true)
    const base = (window as any).__API_BASE__ || ''
    
    const exerciseLogsArray = Object.entries(exerciseLogs).map(([exerciseId, log]) => ({
      exercise_id: parseInt(exerciseId),
      actual_sets: log.sets,
      actual_reps: log.reps,
      weight: log.weight || 0,
      notes: log.notes || ''
    }))
    
    try {
      const res = await fetch(`${base}/api/workouts/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notes: logNotes,
          exercise_logs: exerciseLogsArray
        })
      })
      
      if (res.ok) {
        setShowLogModal(false)
        setLogNotes('')
        setExerciseLogs({})
        // Reload workout logs
        const logsRes = await fetch(`${base}/api/workouts/${id}/logs`, { credentials: 'include' })
        if (logsRes.ok) {
          const logs = await logsRes.json()
          setWorkoutLogs(logs)
        }
      } else {
        console.error('Failed to log workout')
      }
    } catch (error) {
      console.error('Error logging workout:', error)
    } finally {
      setIsLogging(false)
    }
  }

  async function submitExerciseLog() {
    if (!id || !selectedExercise) return
    
    setIsLogging(true)
    const base = (window as any).__API_BASE__ || ''
    
    try {
      const res = await fetch(`${base}/api/workouts/${id}/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notes: logNotes,
          exercise_logs: [{
            exercise_id: selectedExercise.id,
            actual_sets: exerciseLogs[selectedExercise.id]?.sets || selectedExercise.sets,
            actual_reps: exerciseLogs[selectedExercise.id]?.reps || selectedExercise.reps,
            weight: exerciseLogs[selectedExercise.id]?.weight || 0,
            notes: exerciseLogs[selectedExercise.id]?.notes || ''
          }]
        })
      })
      
      if (res.ok) {
        setShowExerciseLogModal(false)
        setSelectedExercise(null)
        setLogNotes('')
        setExerciseLogs({})
        // Reload workout logs
        const logsRes = await fetch(`${base}/api/workouts/${id}/logs`, { credentials: 'include' })
        if (logsRes.ok) {
          const logs = await logsRes.json()
          setWorkoutLogs(logs)
        }
      } else {
        console.error('Failed to log exercise')
      }
    } catch (error) {
      console.error('Error logging exercise:', error)
    } finally {
      setIsLogging(false)
    }
  }

  useEffect(() => {
    loadWorkout()
  }, [id])

  if (authLoading || isLoading) {
    return (
      <div className="main-content">
        <div className="loading">Loading workout details...</div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="main-content">
        <div className="error-message">Workout not found</div>
      </div>
    )
  }

  return (
    <div className="workout-detail-container">
      {/* Header */}
      <div className="workout-detail-header">
        <button 
          className="back-button"
          onClick={() => navigate('/workouts')}
        >
          ← Back to Workouts
        </button>
        <h1 className="workout-detail-title">{workout.title}</h1>
        {workout.notes && (
          <p className="workout-detail-description">{workout.notes}</p>
        )}
      </div>

      {/* Workout Content */}
      <div className="workout-detail-content">
        {/* Exercises Section */}
        <div className="workout-exercises-section">
          <h2 className="section-title"><span className="emoji">🏋️</span>Exercises</h2>
          {workout.exercises && workout.exercises.length > 0 ? (
            <div className="exercises-grid">
              {workout.exercises.map((exercise, index) => (
                <div key={exercise.id} className="exercise-detail-card">
                  <div className="exercise-number">#{index + 1}</div>
                  <div className="exercise-content">
                    <div className="exercise-header">
                      <h3 className="exercise-name">{exercise.name}</h3>
                      <button 
                        className="log-exercise-btn"
                        onClick={() => openExerciseLogModal(exercise)}
                        title="Log this exercise"
                      >
                        📝 Log
                      </button>
                    </div>
                    <div className="exercise-specs">
                      <span className="spec-item">
                        <strong>{exercise.sets}</strong> sets
                      </span>
                      <span className="spec-item">
                        <strong>{exercise.reps}</strong> reps
                      </span>
                      {exercise.rest_seconds > 0 && (
                        <span className="spec-item">
                          <strong>{exercise.rest_seconds}s</strong> rest
                        </span>
                      )}
                    </div>
                    {exercise.notes && (
                      <div className="exercise-instructions">
                        <h4>Instructions:</h4>
                        <p>{exercise.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-exercises">
              <p>No exercises added to this workout yet.</p>
            </div>
          )}
        </div>

        {/* Workout History Section */}
        <div className="workout-history-section">
          <div className="history-header">
            <h2 className="section-title"><span className="emoji">📊</span>Workout History</h2>
            <button 
              className="log-workout-btn"
              onClick={openLogModal}
            >
              📝 Log Workout
            </button>
          </div>
          {workoutLogs && workoutLogs.length > 0 ? (
            <div className="workout-logs">
              {workoutLogs.map((log: any) => {
                const isExpanded = expandedLogs.has(log.id)
                return (
                  <div key={log.id} className="workout-log-card">
                    <div 
                      className="workout-log-header"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className="log-date">
                        {new Date(log.workout_date).toLocaleDateString()} - {new Date(log.workout_date).toLocaleTimeString()}
                      </div>
                      <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                        ▼
                      </div>
                    </div>
                    
                    {log.notes && (
                      <div className="log-notes">
                        <strong>Notes:</strong> {log.notes}
                      </div>
                    )}
                    
                    {isExpanded && log.exercise_logs && log.exercise_logs.length > 0 && (
                      <div className="log-details">
                        <h4>Exercise Details:</h4>
                        {log.exercise_logs.map((exLog: any) => {
                          const exercise = workout.exercises?.find(ex => ex.id === exLog.exercise_id)
                          return (
                            <div key={exLog.id} className="log-exercise">
                              <div className="log-exercise-name">
                                {exercise?.name || `Exercise ${exLog.exercise_id}`}
                              </div>
                              <div className="log-exercise-data">
                                <span>✅ {exLog.actual_sets || 0} sets × {exLog.actual_reps || 0} reps</span>
                                {exLog.weight && <span>🏋️ {exLog.weight}kg</span>}
                                {exLog.notes && <span>📝 {exLog.notes}</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="no-history">
              <p>No workout history yet. Log your first workout to see it here!</p>
            </div>
          )}
        </div>
      </div>

      {/* Workout Logging Modal */}
      {showLogModal && (
        <div className="log-modal-overlay" onClick={() => setShowLogModal(false)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <h2>📝 Log Workout</h2>
              <button 
                className="log-modal-close"
                onClick={() => setShowLogModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="log-modal-content">
              <div className="log-notes-section">
                <label className="log-label">Workout Notes (Optional)</label>
                <textarea
                  className="log-textarea"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="How did the workout feel? Any observations..."
                  rows={3}
                />
              </div>

              <div className="log-exercises-section">
                <h3>Exercise Performance</h3>
                {workout?.exercises?.map((exercise) => (
                  <div key={exercise.id} className="log-exercise-card">
                    <div className="log-exercise-header">
                      <h4>{exercise.name}</h4>
                      <span className="log-exercise-target">
                        Target: {exercise.sets} sets × {exercise.reps} reps
                      </span>
                    </div>
                    
                    <div className="log-exercise-inputs">
                      <div className="log-input-group">
                        <label>Sets Completed</label>
                        <input
                          type="number"
                          value={exerciseLogs[exercise.id]?.sets || exercise.sets}
                          onChange={(e) => updateExerciseLog(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                          min="0"
                          className="log-input"
                        />
                      </div>
                      
                      <div className="log-input-group">
                        <label>Reps per Set</label>
                        <input
                          type="number"
                          value={exerciseLogs[exercise.id]?.reps || exercise.reps}
                          onChange={(e) => updateExerciseLog(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                          min="0"
                          className="log-input"
                        />
                      </div>
                      
                      <div className="log-input-group">
                        <label>Weight (kg)</label>
                        <input
                          type="number"
                          value={exerciseLogs[exercise.id]?.weight || 0}
                          onChange={(e) => updateExerciseLog(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.5"
                          className="log-input"
                        />
                      </div>
                      
                      <div className="log-input-group log-input-group-full">
                        <label>Notes</label>
                        <input
                          type="text"
                          value={exerciseLogs[exercise.id]?.notes || ''}
                          onChange={(e) => updateExerciseLog(exercise.id, 'notes', e.target.value)}
                          placeholder="How did this exercise feel?"
                          className="log-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="log-modal-actions">
              <button 
                className="log-cancel-btn"
                onClick={() => setShowLogModal(false)}
              >
                Cancel
              </button>
              <button 
                className="log-save-btn"
                onClick={submitWorkoutLog}
                disabled={isLogging}
              >
                {isLogging ? 'Saving...' : 'Save Workout Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual Exercise Logging Modal */}
      {showExerciseLogModal && selectedExercise && (
        <div className="log-modal-overlay" onClick={() => setShowExerciseLogModal(false)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <h2>📝 Log Exercise: {selectedExercise.name}</h2>
              <button 
                className="log-modal-close"
                onClick={() => setShowExerciseLogModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="log-modal-content">
              <div className="log-notes-section">
                <label className="log-label">Exercise Notes (Optional)</label>
                <textarea
                  className="log-textarea"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="How did this exercise feel? Any observations..."
                  rows={3}
                />
              </div>

              <div className="log-exercises-section">
                <div className="log-exercise-card">
                  <div className="log-exercise-header">
                    <h4>{selectedExercise.name}</h4>
                    <span className="log-exercise-target">
                      Target: {selectedExercise.sets} sets × {selectedExercise.reps} reps
                    </span>
                  </div>
                  
                  <div className="log-exercise-inputs">
                    <div className="log-input-group">
                      <label>Sets Completed</label>
                      <input
                        type="number"
                        value={exerciseLogs[selectedExercise.id]?.sets || selectedExercise.sets}
                        onChange={(e) => updateExerciseLog(selectedExercise.id, 'sets', parseInt(e.target.value) || 0)}
                        min="0"
                        className="log-input"
                      />
                    </div>
                    
                    <div className="log-input-group">
                      <label>Reps per Set</label>
                      <input
                        type="number"
                        value={exerciseLogs[selectedExercise.id]?.reps || selectedExercise.reps}
                        onChange={(e) => updateExerciseLog(selectedExercise.id, 'reps', parseInt(e.target.value) || 0)}
                        min="0"
                        className="log-input"
                      />
                    </div>
                    
                    <div className="log-input-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        value={exerciseLogs[selectedExercise.id]?.weight || 0}
                        onChange={(e) => updateExerciseLog(selectedExercise.id, 'weight', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.5"
                        className="log-input"
                      />
                    </div>
                    
                    <div className="log-input-group log-input-group-full">
                      <label>Personal Notes</label>
                      <input
                        type="text"
                        value={exerciseLogs[selectedExercise.id]?.notes || ''}
                        onChange={(e) => updateExerciseLog(selectedExercise.id, 'notes', e.target.value)}
                        placeholder="How did this exercise feel?"
                        className="log-input"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="log-modal-actions">
              <button 
                className="log-cancel-btn"
                onClick={() => setShowExerciseLogModal(false)}
              >
                Cancel
              </button>
              <button 
                className="log-save-btn"
                onClick={submitExerciseLog}
                disabled={isLogging}
              >
                {isLogging ? 'Saving...' : 'Save Exercise Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
