import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Icon } from '../components/Icon'

type Exercise = {
  id: string
  name: string
  category: string
  muscleGroups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  instructions: string[]
  tips: string[]
  videoUrl?: string
  imageUrl?: string
  variations: string[]
  commonMistakes: string[]
}

const exerciseLibrary: Exercise[] = [
  {
    id: 'push-ups',
    name: 'Push-ups',
    category: 'Upper Body',
    muscleGroups: ['Chest', 'Shoulders', 'Triceps'],
    equipment: ['None'],
    difficulty: 'beginner',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulders',
      'Keep your body in a straight line from head to heels',
      'Lower your chest toward the ground by bending your elbows',
      'Push back up to the starting position',
      'Keep your core tight throughout the movement'
    ],
    tips: [
      'Keep your elbows at a 45-degree angle to your body',
      'Don\'t let your hips sag or pike up',
      'Breathe out as you push up, in as you lower down'
    ],
    variations: ['Incline Push-ups', 'Decline Push-ups', 'Diamond Push-ups', 'Wide Push-ups'],
    commonMistakes: [
      'Flaring elbows too wide',
      'Sagging hips',
      'Not going low enough',
      'Rushing the movement'
    ]
  },
  {
    id: 'squats',
    name: 'Squats',
    category: 'Lower Body',
    muscleGroups: ['Quadriceps', 'Glutes', 'Hamstrings'],
    equipment: ['None'],
    difficulty: 'beginner',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Toes slightly pointed outward',
      'Lower your body by bending at the hips and knees',
      'Go down until your thighs are parallel to the floor',
      'Push through your heels to return to standing'
    ],
    tips: [
      'Keep your chest up and core engaged',
      'Weight should be on your heels',
      'Knees should track over your toes'
    ],
    variations: ['Jump Squats', 'Pistol Squats', 'Sumo Squats', 'Wall Squats'],
    commonMistakes: [
      'Knees caving inward',
      'Leaning too far forward',
      'Not going low enough',
      'Lifting heels off ground'
    ]
  },
  {
    id: 'plank',
    name: 'Plank',
    category: 'Core',
    muscleGroups: ['Core', 'Shoulders', 'Glutes'],
    equipment: ['None'],
    difficulty: 'beginner',
    instructions: [
      'Start in a push-up position',
      'Lower down to your forearms',
      'Keep your body in a straight line',
      'Engage your core and glutes',
      'Hold the position for the desired time'
    ],
    tips: [
      'Keep your hips level',
      'Don\'t let your lower back sag',
      'Breathe normally throughout',
      'Look at the ground to keep neck neutral'
    ],
    variations: ['Side Plank', 'Plank Up-Downs', 'Plank Jacks', 'Single-Arm Plank'],
    commonMistakes: [
      'Hips too high or too low',
      'Sagging lower back',
      'Holding breath',
      'Looking up instead of down'
    ]
  },
  {
    id: 'deadlifts',
    name: 'Deadlifts',
    category: 'Full Body',
    muscleGroups: ['Hamstrings', 'Glutes', 'Lower Back', 'Traps'],
    equipment: ['Barbell', 'Dumbbells'],
    difficulty: 'intermediate',
    instructions: [
      'Stand with feet hip-width apart, bar over mid-foot',
      'Bend at the hips and knees to grip the bar',
      'Keep your back straight and chest up',
      'Drive through your heels to lift the bar',
      'Stand up straight, squeezing your glutes at the top'
    ],
    tips: [
      'Keep the bar close to your body',
      'Engage your lats before lifting',
      'Don\'t round your back',
      'Push your hips back on the way down'
    ],
    variations: ['Romanian Deadlifts', 'Sumo Deadlifts', 'Single-Leg Deadlifts', 'Trap Bar Deadlifts'],
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Not engaging core',
      'Lifting with arms instead of legs'
    ]
  },
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    category: 'Upper Body',
    muscleGroups: ['Lats', 'Biceps', 'Rhomboids', 'Middle Traps'],
    equipment: ['Pull-up Bar'],
    difficulty: 'intermediate',
    instructions: [
      'Hang from the bar with hands slightly wider than shoulders',
      'Engage your lats and pull your shoulder blades down',
      'Pull your body up until your chin clears the bar',
      'Lower yourself down with control',
      'Keep your core engaged throughout'
    ],
    tips: [
      'Start each rep from a dead hang',
      'Don\'t swing or use momentum',
      'Focus on pulling with your back, not just arms',
      'Full range of motion is key'
    ],
    variations: ['Chin-ups', 'Wide Grip Pull-ups', 'Close Grip Pull-ups', 'L-Sit Pull-ups'],
    commonMistakes: [
      'Using momentum to swing up',
      'Not going all the way down',
      'Not engaging the lats',
      'Rushing the movement'
    ]
  },
  {
    id: 'burpees',
    name: 'Burpees',
    category: 'Full Body',
    muscleGroups: ['Chest', 'Shoulders', 'Core', 'Legs'],
    equipment: ['None'],
    difficulty: 'intermediate',
    instructions: [
      'Start standing with feet shoulder-width apart',
      'Drop into a squat and place hands on the floor',
      'Jump feet back into a plank position',
      'Do a push-up',
      'Jump feet back to squat position',
      'Jump up with arms overhead'
    ],
    tips: [
      'Keep your core tight throughout',
      'Land softly on your feet',
      'Maintain good form even when tired',
      'Breathe rhythmically'
    ],
    variations: ['Half Burpees', 'Burpee Box Jumps', 'Single-Arm Burpees', 'Burpee Pull-ups'],
    commonMistakes: [
      'Skipping the push-up',
      'Not jumping high enough at the end',
      'Poor landing technique',
      'Rushing and losing form'
    ]
  }
]

export function ExerciseLibrary() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All')
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('All')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const categories = ['All', ...Array.from(new Set(exerciseLibrary.map(e => e.category)))]
  const difficulties = ['All', 'beginner', 'intermediate', 'advanced']
  const muscleGroups = ['All', ...Array.from(new Set(exerciseLibrary.flatMap(e => e.muscleGroups)))]

  const filteredExercises = exerciseLibrary.filter(exercise => {
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'All' || exercise.difficulty === selectedDifficulty
    const matchesMuscleGroup = selectedMuscleGroup === 'All' || exercise.muscleGroups.includes(selectedMuscleGroup)
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.muscleGroups.some(mg => mg.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         exercise.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesDifficulty && matchesMuscleGroup && matchesSearch
  })

  function openExerciseModal(exercise: Exercise) {
    setSelectedExercise(exercise)
    setShowModal(true)
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
      case 'Upper Body': return 'target'
      case 'Lower Body': return 'activity'
      case 'Core': return 'zap'
      case 'Full Body': return 'dumbbell'
      case 'Cardio': return 'flame'
      case 'Flexibility': return 'heart'
      default: return 'dumbbell'
    }
  }

  if (authLoading) {
    return (
      <div className="main-content">
        <div className="loading">Loading exercise library...</div>
      </div>
    )
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <h1 className="library-title">
          <Icon name="bookmark" size={32} className="mr-3" />
          FitForge Exercise Library
        </h1>
        <p className="library-subtitle">Forge perfect form with our comprehensive exercise database</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Icon name="search" size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search exercises..."
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

          <select
            value={selectedMuscleGroup}
            onChange={(e) => setSelectedMuscleGroup(e.target.value)}
            className="filter-select"
          >
            {muscleGroups.map(muscleGroup => (
              <option key={muscleGroup} value={muscleGroup}>{muscleGroup}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exercises Grid */}
      <div className="exercises-grid">
        {filteredExercises.map(exercise => (
          <div key={exercise.id} className="exercise-card">
            <div className="exercise-header">
              <div className="exercise-category">
                <Icon name={getCategoryIcon(exercise.category)} size={16} />
                <span>{exercise.category}</span>
              </div>
              <div className={`difficulty-badge ${getDifficultyColor(exercise.difficulty)}`}>
                {exercise.difficulty}
              </div>
            </div>

            <div className="exercise-content">
              <h3 className="exercise-name">{exercise.name}</h3>
              
              <div className="muscle-groups">
                <Icon name="activity" size={16} />
                <span>{exercise.muscleGroups.join(', ')}</span>
              </div>

              <div className="exercise-equipment">
                <Icon name="dumbbell" size={16} />
                <span>{exercise.equipment.join(', ')}</span>
              </div>
            </div>

            <div className="exercise-actions">
              <button
                className="view-btn"
                onClick={() => openExerciseModal(exercise)}
              >
                <Icon name="eye" size={16} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="no-exercises">
          <Icon name="search" size={48} />
          <h3>No exercises found</h3>
          <p>Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Exercise Detail Modal */}
      {showModal && selectedExercise && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="exercise-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedExercise.name}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            <div className="modal-content">
              <div className="exercise-info">
                <div className="info-row">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{selectedExercise.category}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Muscle Groups:</span>
                  <span className="info-value">{selectedExercise.muscleGroups.join(', ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Equipment:</span>
                  <span className="info-value">{selectedExercise.equipment.join(', ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Difficulty:</span>
                  <span className={`info-value ${getDifficultyColor(selectedExercise.difficulty)}`}>
                    {selectedExercise.difficulty}
                  </span>
                </div>
              </div>

              <div className="instructions-section">
                <h3>Instructions</h3>
                <ol className="instructions-list">
                  {selectedExercise.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              <div className="tips-section">
                <h3>Tips</h3>
                <ul className="tips-list">
                  {selectedExercise.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="variations-section">
                <h3>Variations</h3>
                <div className="variations-list">
                  {selectedExercise.variations.map((variation, index) => (
                    <span key={index} className="variation-tag">{variation}</span>
                  ))}
                </div>
              </div>

              <div className="mistakes-section">
                <h3>Common Mistakes</h3>
                <ul className="mistakes-list">
                  {selectedExercise.commonMistakes.map((mistake, index) => (
                    <li key={index}>{mistake}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
