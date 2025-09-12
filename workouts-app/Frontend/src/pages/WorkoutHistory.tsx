import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icon'
import { format } from 'date-fns'

interface WorkoutLog {
  id: number
  workout_date: string
  notes?: string
  created_at: string
  workout: {
    id: number
    title: string
    notes?: string
  }
  exercise_logs: ExerciseLog[]
}

interface ExerciseLog {
  id: number
  sets_completed: number
  reps_completed: number
  weight_used?: number
  notes?: string
  exercise: {
    id: number
    name: string
    sets: number
    reps: number
    rest_seconds: number
  }
}

export function WorkoutHistory() {
  const { user } = useAuth()
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'workout'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (user) {
      loadWorkoutHistory()
    }
  }, [user])

  async function loadWorkoutHistory() {
    const base = (window as any).__API_BASE__ || ''
    try {
      console.log('Loading workout history from:', `${base}/api/workouts/history`)
      const response = await fetch(`${base}/api/workouts/history`, {
        credentials: 'include'
      })
      console.log('History response status:', response.status)
      
      if (response.ok) {
        const logs = await response.json()
        console.log('Loaded workout logs:', logs)
        console.log('First log structure:', logs[0])
        console.log('First log workout:', logs[0]?.workout)
        setWorkoutLogs(logs)
      } else {
        const errorText = await response.text()
        console.error('Failed to load workout history:', response.status, errorText)
        
        // Fallback: try to load from individual workout logs
        console.log('Trying fallback method...')
        await loadWorkoutHistoryFallback()
      }
    } catch (error) {
      console.error('Error loading workout history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadWorkoutHistoryFallback() {
    const base = (window as any).__API_BASE__ || ''
    try {
      // First get all workouts
      const workoutsResponse = await fetch(`${base}/api/workouts`, {
        credentials: 'include'
      })
      
      if (!workoutsResponse.ok) {
        console.error('Failed to load workouts for fallback')
        return
      }
      
      const workouts = await workoutsResponse.json()
      console.log('Loaded workouts for fallback:', workouts)
      
      // Then get logs for each workout
      const allLogs: WorkoutLog[] = []
      
      for (const workout of workouts) {
        const logsResponse = await fetch(`${base}/api/workouts/${workout.id}/logs`, {
          credentials: 'include'
        })
        
        if (logsResponse.ok) {
          const logs = await logsResponse.json()
          console.log(`Loaded ${logs.length} logs for workout ${workout.id}`)
          
          // Process each log to ensure proper data structure
          const processedLogs = logs.map((log: any) => {
            // Ensure exercise_logs is an array and has proper structure
            const exerciseLogs = (log.exercise_logs || []).map((exLog: any) => ({
              id: exLog.id,
              sets_completed: exLog.sets_completed || exLog.sets || 0,
              reps_completed: exLog.reps_completed || exLog.reps || 0,
              weight_used: exLog.weight_used || exLog.weight || 0,
              notes: exLog.notes || '',
              exercise: {
                id: exLog.exercise?.id || exLog.exercise_id || 0,
                name: exLog.exercise?.name || 'Unknown Exercise',
                sets: exLog.exercise?.sets || exLog.sets || 0,
                reps: exLog.exercise?.reps || exLog.reps || 0,
                rest_seconds: exLog.exercise?.rest_seconds || 0
              }
            }))
            
            return {
              id: log.id,
              workout_date: log.workout_date,
              notes: log.notes || '',
              created_at: log.created_at || log.workout_date,
              workout: {
                id: workout.id,
                title: workout.title || 'Untitled Workout',
                notes: workout.notes || ''
              },
              exercise_logs: exerciseLogs
            }
          })
          
          allLogs.push(...processedLogs)
        }
      }
      
      console.log('Total logs loaded via fallback:', allLogs.length)
      setWorkoutLogs(allLogs)
      
    } catch (error) {
      console.error('Error in fallback method:', error)
    }
  }

  // Filter and sort workout logs
  const filteredLogs = workoutLogs
    .filter(log => {
      const workoutTitle = log.workout?.title || 'Untitled Workout'
      const workoutNotes = log.workout?.notes || ''
      const logNotes = log.notes || ''
      
      const matchesSearch = workoutTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           workoutNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           logNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (log.exercise_logs || []).some(exLog => 
                             exLog.exercise?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false
                           )
      
      const matchesDate = !selectedDate || 
        format(new Date(log.workout_date), 'yyyy-MM-dd') === selectedDate
      
      return matchesSearch && matchesDate
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = new Date(a.workout_date).getTime() - new Date(b.workout_date).getTime()
      } else {
        const titleA = a.workout?.title || 'Untitled Workout'
        const titleB = b.workout?.title || 'Untitled Workout'
        comparison = titleA.localeCompare(titleB)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Group logs by date
  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = format(new Date(log.workout_date), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(log)
    return groups
  }, {} as Record<string, WorkoutLog[]>)

  if (isLoading) {
    return (
      <div className="workout-history-container">
        <div className="history-header">
          <h1 className="history-title">Workout History</h1>
        </div>
        <div className="loading-state">
          <Icon name="activity" size={48} className="loading-icon" />
          <p>Loading your workout history...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="workout-history-container">
      <div className="history-header">
        <h1 className="history-title">Workout History</h1>
        <p className="history-subtitle">Track your fitness journey and progress</p>
      </div>

      {/* Filters and Search */}
      <div className="history-filters">
        <div className="search-box">
          <Icon name="search" size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search workouts, exercises, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="date-filter"
            />
          </div>
          
          <div className="filter-group">
            <label>Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'workout')}
              className="sort-select"
            >
              <option value="date">Date</option>
              <option value="workout">Workout Name</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Order:</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="sort-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>


      {/* Workout Logs */}
      <div className="history-content">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="empty-state">
            <Icon name="calendar" size={64} className="empty-icon" />
            <h3>No workout history found</h3>
            <p>Start logging your workouts to see your progress here!</p>
          </div>
        ) : (
          Object.entries(groupedLogs)
            .sort(([a], [b]) => sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b))
            .map(([date, logs]) => (
              <div key={date} className="date-group">
                <div className="date-header">
                  <h2 className="date-title">
                    {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <span className="workout-count">{logs.length} workout{logs.length !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="workout-logs">
                  {logs.map((log) => (
                    <div key={log.id} className="workout-log-card">
                      <div className="log-header">
                        <div className="log-title-section">
                          <h3 className="log-title">{log.workout.title}</h3>
                          <div className="log-meta">
                            <span className="log-time">
                              <Icon name="clock" size={14} />
                              {format(new Date(log.workout_date), 'h:mm a')}
                            </span>
                            <span className="log-exercises">
                              <Icon name="activity" size={14} />
                              {log.exercise_logs?.length || 0} exercise{(log.exercise_logs?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="log-stats">
                          <div className="stat-item">
                            <span className="stat-value">{log.exercise_logs?.length || 0}</span>
                            <span className="stat-label">Exercises</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-value">
                              {(log.exercise_logs || []).reduce((total, ex) => total + (ex.sets_completed || 0), 0)}
                            </span>
                            <span className="stat-label">Sets</span>
                          </div>
                        </div>
                      </div>
                      
                      {log.notes && (
                        <div className="log-notes">
                          <Icon name="message-circle" size={16} />
                          <span>{log.notes}</span>
                        </div>
                      )}
                      
                      <div className="exercise-logs">
                        <h4 className="exercises-title">Exercises Completed</h4>
                        {(log.exercise_logs || []).map((exerciseLog) => (
                          <div key={exerciseLog.id} className="exercise-log-item">
                            <div className="exercise-info">
                              <h5 className="exercise-name">
                                {exerciseLog.exercise?.name || 'Unknown Exercise'}
                              </h5>
                              <div className="exercise-details">
                                <span className="exercise-sets">
                                  {exerciseLog.sets_completed}/{exerciseLog.exercise?.sets || '?'} sets
                                </span>
                                <span className="exercise-reps">
                                  {exerciseLog.reps_completed} reps each
                                </span>
                                {exerciseLog.weight_used && (
                                  <span className="exercise-weight">
                                    @ {exerciseLog.weight_used}lbs
                                  </span>
                                )}
                              </div>
                            </div>
                            {exerciseLog.notes && (
                              <div className="exercise-notes">
                                <Icon name="message-circle" size={14} />
                                <span>{exerciseLog.notes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
