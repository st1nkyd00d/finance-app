import { useState, useEffect, useCallback } from 'react'
import { HiPlus, HiTrophy } from 'react-icons/hi2'
import GoalCard from './GoalCard'
import GoalForm from './GoalForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import {
  fetchGoalsWithProgress,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../../services/goals'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'active' | 'completed'

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchGoalsWithProgress()
      setGoals(data)
    } catch (err) {
      console.error('Error loading goals:', err)
      setError(err.message || 'Error al cargar las metas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const openForm = useCallback(() => {
    setEditingGoal(null)
    setIsFormOpen(true)
  }, [])

  const openEdit = useCallback((goal) => {
    setEditingGoal(goal)
    setIsFormOpen(true)
  }, [])

  const closeForm = useCallback(() => {
    setIsFormOpen(false)
    setEditingGoal(null)
  }, [])

  const handleSave = useCallback(async (data) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, data)
    } else {
      await createGoal(data)
    }
    await loadGoals()
  }, [editingGoal, loadGoals])

  const handleToggleActive = useCallback(async (id, isActive) => {
    try {
      await updateGoal(id, { is_active: isActive })
      await loadGoals()
    } catch (err) {
      console.error('Error toggling goal:', err)
      setError(err.message || 'Error al actualizar la meta')
    }
  }, [loadGoals])

  const openDeleteConfirm = useCallback((id, name) => {
    setDeleteConfirm({ isOpen: true, id, name })
  }, [])

  const closeDeleteConfirm = useCallback(() => {
    setDeleteConfirm({ isOpen: false, id: null, name: '' })
  }, [])

  const handleDelete = async () => {
    try {
      await deleteGoal(deleteConfirm.id)
      closeDeleteConfirm()
      await loadGoals()
    } catch (err) {
      console.error('Error deleting goal:', err)
      setError(err.message || 'Error al eliminar la meta')
      closeDeleteConfirm()
    }
  }

  // Filter goals
  const filteredGoals = goals.filter((goal) => {
    if (filter === 'active') return goal.is_active && goal.status !== 'completed'
    if (filter === 'completed') return goal.status === 'completed'
    return true
  })

  // Calculate alerts
  const completedGoals = goals.filter((g) => g.status === 'completed' && g.is_active)
  const nearDeadlineGoals = goals.filter((g) => {
    return g.is_active && g.daysRemaining !== null && g.daysRemaining <= 7 && g.daysRemaining >= 0 && g.status !== 'completed'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <HiTrophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Metas de Ahorro</h1>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            <HiPlus className="w-5 h-5" />
            Nueva Meta
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Define tus objetivos de ahorro y rastrea tu progreso
        </p>
      </div>

      {/* Alerts */}
      {completedGoals.length > 0 && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 font-medium">
            ¡Felicidades! {completedGoals.length} meta{completedGoals.length > 1 ? 's' : ''} completada{completedGoals.length > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {nearDeadlineGoals.length > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
            {nearDeadlineGoals.length} meta{nearDeadlineGoals.length > 1 ? 's' : ''} cerca de su fecha límite
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Todas ({goals.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Activas ({goals.filter((g) => g.is_active && g.status !== 'completed').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Completadas ({goals.filter((g) => g.status === 'completed').length})
        </button>
      </div>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12">
          <HiTrophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            {filter === 'all'
              ? 'No tienes metas de ahorro. ¡Crea tu primera meta!'
              : filter === 'completed'
              ? 'No hay metas completadas aún'
              : 'No hay metas activas'}
          </p>
          {filter === 'all' && (
            <button
              onClick={openForm}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              Crear Primera Meta
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={openEdit}
              onDelete={openDeleteConfirm}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <GoalForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSave={handleSave}
        initialData={editingGoal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Eliminar Meta"
        message={`¿Estás seguro de que deseas eliminar la meta "${deleteConfirm.name}"? Las transacciones asociadas no se eliminarán.`}
        confirmText="Eliminar"
        confirmStyle="danger"
      />
    </div>
  )
}
