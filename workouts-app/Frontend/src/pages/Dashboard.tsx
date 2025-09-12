import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icon'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'

type WorkoutStats = {
  totalWorkouts: number
  totalExercises: number
  totalDuration: number
  currentStreak: number
  longestStreak: number
  thisWeekWorkouts: number
  lastWeekWorkouts: number
  favoriteExercise: string
  favoriteWorkout: string
  averageWorkoutDuration: number
}

type WeeklyData = {
  day: string
  workouts: number
  duration: number
}

type ExerciseData = {
  name: string
  count: number
  color: string
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    totalExercises: 0,
    totalDuration: 0,
    currentStreak: 0,
    longestStreak: 0,
    thisWeekWorkouts: 0,
    lastWeekWorkouts: 0,
    favoriteExercise: 'None',
    favoriteWorkout: 'None',
    averageWorkoutDuration: 0
  })
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([])
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([])
  const [workoutData, setWorkoutData] = useState<ExerciseData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      loadDashboardData()
      
      // Set up auto-refresh every 10 seconds for real-time updates
      const interval = setInterval(() => {
        loadDashboardData()
      }, 10000)
      
      return () => clearInterval(interval)
    }
  }, [user])

  async function loadDashboardData() {
    const base = (window as any).__API_BASE__ || ''
    
    try {
      const workoutsRes = await fetch(`${base}/api/workouts`, { credentials: 'include' })
      
      if (workoutsRes.ok) {
        const workouts = await workoutsRes.json()
        await loadExerciseLogs(workouts)
      } else {
        console.error('Failed to load workouts:', workoutsRes.status)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadExerciseLogs(workouts: any[]) {
    const base = (window as any).__API_BASE__ || ''
    const exerciseCounts: { [key: string]: number } = {}
    const workoutCounts: { [key: string]: number } = {}
    let totalLoggedExercises = 0
    let totalLoggedDuration = 0

    try {
      // Load exercise logs from all workouts
      for (const workout of workouts) {
        const logsRes = await fetch(`${base}/api/workouts/${workout.id}/logs`, { credentials: 'include' })
        
        if (logsRes.ok) {
          const logs = await logsRes.json()
          
          // Process each workout log
          for (const log of logs) {
            // Count workout completions
            const workoutName = workout.title
            workoutCounts[workoutName] = (workoutCounts[workoutName] || 0) + 1
            
            // Calculate duration from workout log (estimate 2 minutes per exercise)
            const exerciseCount = log.exercise_logs?.length || 0
            const workoutDuration = exerciseCount * 2
            totalLoggedDuration += workoutDuration
            
            if (log.exercise_logs && Array.isArray(log.exercise_logs)) {
              for (const exerciseLog of log.exercise_logs) {
                // Find the exercise name from the workout's exercises
                const exercise = workout.exercises?.find((ex: any) => ex.id === exerciseLog.exercise_id)
                if (exercise) {
                  const exerciseName = exercise.name
                  exerciseCounts[exerciseName] = (exerciseCounts[exerciseName] || 0) + 1
                  totalLoggedExercises++
                }
              }
            }
          }
        }
      }
      
      // Update stats with logged exercise and workout data
      calculateStatsWithLogs(workouts, exerciseCounts, totalLoggedExercises, workoutCounts, totalLoggedDuration)
      
    } catch (error) {
      console.error('Error loading exercise logs:', error)
      // Fallback to original calculation
      calculateStats(workouts)
    }
  }

  function calculateStatsWithLogs(workouts: any[], exerciseCounts: { [key: string]: number }, totalLoggedExercises: number, workoutCounts: { [key: string]: number }, totalLoggedDuration: number) {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    let thisWeekCount = 0
    let lastWeekCount = 0

    // Count workouts by week based on actual logged workouts
    Object.values(workoutCounts).forEach(count => {
      // For simplicity, assume logged workouts are recent
      thisWeekCount += count
    })

    // Find favorite exercise from logged data
    const favoriteExercise = Object.keys(exerciseCounts).length > 0 
      ? Object.keys(exerciseCounts).reduce((a, b) => 
          exerciseCounts[a] > exerciseCounts[b] ? a : b, 'None'
        )
      : 'None'

    // Find favorite workout from logged data
    const favoriteWorkout = Object.keys(workoutCounts).length > 0 
      ? Object.keys(workoutCounts).reduce((a, b) => 
          workoutCounts[a] > workoutCounts[b] ? a : b, 'None'
        )
      : 'None'

    // Generate weekly data for chart
    const weeklyData = generateWeeklyData(workouts)
    
    // Generate exercise data for pie chart from logged exercises
    const exerciseData = Object.entries(exerciseCounts)
      .map(([name, count], index) => ({
        name,
        count,
        color: getColorForIndex(index)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 exercises

    // Generate workout data for pie chart from logged workouts
    const workoutData = Object.entries(workoutCounts)
      .map(([name, count], index) => ({
        name,
        count,
        color: getColorForIndex(index)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 workouts

    const newStats = {
      totalWorkouts: Object.values(workoutCounts).reduce((sum, count) => sum + count, 0), // Total logged workouts
      totalExercises: totalLoggedExercises, // Use logged exercises count
      totalDuration: totalLoggedDuration, // Use logged duration
      currentStreak: calculateCurrentStreak(workouts),
      longestStreak: calculateLongestStreak(workouts),
      thisWeekWorkouts: thisWeekCount,
      lastWeekWorkouts: lastWeekCount,
      favoriteExercise,
      favoriteWorkout,
      averageWorkoutDuration: Object.values(workoutCounts).length > 0 ? Math.round(totalLoggedDuration / Object.values(workoutCounts).reduce((sum, count) => sum + count, 0)) : 0
    }

    setStats(newStats)
    setWeeklyData(weeklyData)
    setExerciseData(exerciseData)
    setWorkoutData(workoutData)
    setLastUpdated(new Date())
  }

  function calculateStats(workouts: any[]) {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    let totalExercises = 0
    let totalDuration = 0
    let thisWeekCount = 0
    let lastWeekCount = 0
    const exerciseCounts: { [key: string]: number } = {}

    // Process each workout
    workouts.forEach((workout, index) => {
      console.log(`Dashboard: Processing workout ${index}:`, workout)
      
      if (workout.exercises && Array.isArray(workout.exercises)) {
        totalExercises += workout.exercises.length
        workout.exercises.forEach((exercise: any) => {
          if (exercise.name) {
            exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] || 0) + 1
          }
        })
      } else {
        console.log(`Dashboard: Workout ${index} has no exercises or exercises is not an array:`, workout.exercises)
      }

      // Calculate duration (estimate 2 minutes per exercise)
      const workoutDuration = (workout.exercises?.length || 0) * 2
      totalDuration += workoutDuration

      // Count workouts by week
      const workoutDate = new Date(workout.created_at)
      if (workoutDate >= oneWeekAgo) {
        thisWeekCount++
      } else if (workoutDate >= twoWeeksAgo && workoutDate < oneWeekAgo) {
        lastWeekCount++
      }
    })
    
    console.log('Dashboard: Exercise counts:', exerciseCounts)
    console.log('Dashboard: Total exercises:', totalExercises)

    // Find favorite exercise
    const favoriteExercise = Object.keys(exerciseCounts).length > 0 
      ? Object.keys(exerciseCounts).reduce((a, b) => 
          exerciseCounts[a] > exerciseCounts[b] ? a : b, 'None'
        )
      : 'None'

    // Generate weekly data for chart
    const weeklyData = generateWeeklyData(workouts)
    
    // Generate exercise data for pie chart
    const exerciseData = Object.entries(exerciseCounts)
      .map(([name, count], index) => ({
        name,
        count,
        color: getColorForIndex(index)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 exercises

    setStats({
      totalWorkouts: workouts.length,
      totalExercises,
      totalDuration,
      currentStreak: calculateCurrentStreak(workouts),
      longestStreak: calculateLongestStreak(workouts),
      thisWeekWorkouts: thisWeekCount,
      lastWeekWorkouts: lastWeekCount,
      favoriteExercise,
      favoriteWorkout: 'None', // Fallback since we don't have workout counts in this function
      averageWorkoutDuration: workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0
    })

    setWeeklyData(weeklyData)
    setExerciseData(exerciseData)
  }

  function generateWeeklyData(workouts: any[]): WeeklyData[] {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Start from Monday

    return days.map((day, index) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + index)
      
      const dayWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.created_at)
        return workoutDate.toDateString() === date.toDateString()
      })

      return {
        day,
        workouts: dayWorkouts.length,
        duration: dayWorkouts.reduce((sum, workout) => 
          sum + ((workout.exercises?.length || 0) * 2), 0
        )
      }
    })
  }

  function calculateCurrentStreak(workouts: any[]): number {
    // Simplified streak calculation
    const sortedWorkouts = workouts
      .map(w => new Date(w.created_at))
      .sort((a, b) => b.getTime() - a.getTime())

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i])
      workoutDate.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === i) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  function calculateLongestStreak(workouts: any[]): number {
    // Simplified longest streak calculation
    return Math.max(1, Math.floor(workouts.length / 7))
  }

  function getColorForIndex(index: number): string {
    const colors = [
      '#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b',
      '#ef4444', '#8b5cf6', '#f97316', '#84cc16', '#06b6d4'
    ]
    return colors[index % colors.length]
  }

  if (authLoading || isLoading) {
    return (
      <div className="main-content">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <Icon name="bar-chart" size={32} className="mr-3" />
          FitForge Dashboard
        </h1>
        <p className="dashboard-subtitle">Forge your fitness journey and track your progress</p>
        {lastUpdated && (
          <p className="dashboard-timestamp">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="dumbbell" size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalWorkouts}</h3>
            <p className="stat-label">Total Workouts Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="activity" size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.totalExercises}</h3>
            <p className="stat-label">Exercises Completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="flame" size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.currentStreak}</h3>
            <p className="stat-label">Current Streak</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="trophy" size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value">{stats.longestStreak}</h3>
            <p className="stat-label">Longest Streak</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="target" size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value stat-value-long">{stats.favoriteExercise}</h3>
            <p className="stat-label">Favorite Exercise</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Icon name="bookmark" size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-value stat-value-long">{stats.favoriteWorkout}</h3>
            <p className="stat-label">Favorite Workout</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3 className="chart-title">Weekly Workout Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="workouts" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Top Exercises</h3>
          {exerciseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={exerciseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {exerciseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => {
                    const total = exerciseData.reduce((sum, item) => sum + item.count, 0)
                    const percentage = ((value / total) * 100).toFixed(1)
                    return [
                      `${props.payload.name}: ${value} times (${percentage}%)`,
                      'Count'
                    ]
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: any, entry: any) => (
                    <span style={{ color: entry.color, fontSize: '12px' }}>
                      {value.length > 12 ? `${value.substring(0, 12)}...` : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">
              <Icon name="activity" size={48} />
              <p>No exercise data available yet</p>
              <p>Start logging workouts to see your top exercises!</p>
            </div>
          )}
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Top Workouts</h3>
          {workoutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={workoutData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={false}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {workoutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: any, props: any) => {
                    const total = workoutData.reduce((sum, item) => sum + item.count, 0)
                    const percentage = ((value / total) * 100).toFixed(1)
                    return [
                      `${props.payload.name}: ${value} times (${percentage}%)`,
                      'Count'
                    ]
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value: any, entry: any) => (
                    <span style={{ color: entry.color, fontSize: '12px' }}>
                      {value.length > 12 ? `${value.substring(0, 12)}...` : value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data-message">
              <Icon name="dumbbell" size={48} />
              <p>No workout data available yet</p>
              <p>Start logging workouts to see your top workouts!</p>
            </div>
          )}
        </div>
      </div>


      {/* Quick Actions */}
      <div className="quick-actions">
        <h3 className="section-title">Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="action-btn"
            onClick={() => navigate('/workouts')}
          >
            <Icon name="plus" size={20} />
            Start New Workout
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/workouts')}
          >
            <Icon name="calendar" size={20} />
            Schedule Workout
          </button>
          <button 
            className="action-btn"
            onClick={() => navigate('/workouts')}
          >
            <Icon name="share" size={20} />
            Share Progress
          </button>
        </div>
      </div>
    </div>
  )
}
