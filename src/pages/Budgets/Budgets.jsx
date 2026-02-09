import { useState, useEffect, useCallback } from 'react'
import {
  fetchBudgetsWithSpending,
  createBudget,
  updateBudget,
  deleteBudget,
} from '../../services/budgets'
import { fetchCategories } from '../../services/categories'
import BudgetCard from './BudgetCard'
import BudgetForm from './BudgetForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filter, setFilter] = useState('active') // 'active', 'inactive', 'all'

  const loadData = useCallback(async () => {
    try {
      const [budgetsData, categoriesData] = await Promise.all([
        fetchBudgetsWithSpending(),
        fetchCategories(),
      ])
      setBudgets(budgetsData)
      setCategories(categoriesData)
    } catch (err) {
      console.error('Error cargando datos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreate(data) {
    const newBudget = await createBudget(data)
    await loadData()
  }

  async function handleUpdate(data) {
    if (!editingBudget) return
    await updateBudget(editingBudget.id, data)
    await loadData()
    setEditingBudget(null)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await deleteBudget(deleteConfirm.id)
      setBudgets((prev) => prev.filter((b) => b.id !== deleteConfirm.id))
    } catch (err) {
      console.error('Error eliminando presupuesto:', err)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleToggle = useCallback(async (budget) => {
    try {
      await updateBudget(budget.id, { is_active: !budget.is_active })
      await loadData()
    } catch (err) {
      console.error('Error actualizando presupuesto:', err)
    }
  }, [loadData])

  const openEdit = useCallback((budget) => {
    setEditingBudget(budget)
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingBudget(null)
  }, [])

  // Filtrar presupuestos
  const filteredBudgets = budgets.filter((b) => {
    if (filter === 'active') return b.is_active
    if (filter === 'inactive') return !b.is_active
    return true
  })

  // Stats
  const activeBudgets = budgets.filter((b) => b.is_active)
  const exceededCount = activeBudgets.filter((b) => b.status === 'exceeded').length
  const warningCount = activeBudgets.filter((b) => b.status === 'warning').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Presupuestos</h1>
          {activeBudgets.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeBudgets.length} presupuesto{activeBudgets.length !== 1 ? 's' : ''} activo{activeBudgets.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {/* Alertas */}
      {(exceededCount > 0 || warningCount > 0) && (
        <div className="mb-6 space-y-2">
          {exceededCount > 0 && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                {exceededCount} presupuesto{exceededCount !== 1 ? 's' : ''} excedido{exceededCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-amber-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                {warningCount} presupuesto{warningCount !== 1 ? 's' : ''} cerca del limite
              </span>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      {budgets.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Inactivos
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Todos
          </button>
        </div>
      )}

      {/* Lista de presupuestos */}
      {budgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
          <svg
            className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 7h6m0 10v-3m-3 3v-6m-3 6v-1m6-9a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay presupuestos creados.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
          >
            Crear tu primer presupuesto
          </button>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No hay presupuestos {filter === 'active' ? 'activos' : 'inactivos'}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      <BudgetForm
        isOpen={showForm}
        onClose={closeForm}
        onSubmit={editingBudget ? handleUpdate : handleCreate}
        categories={categories}
        budget={editingBudget}
      />

      {/* Dialogo de confirmacion */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar Presupuesto"
        message={`¿Seguro que quieres eliminar el presupuesto de "${deleteConfirm?.category?.name}"? Esta accion no se puede deshacer.`}
        confirmText="Eliminar"
      />
    </div>
  )
}
