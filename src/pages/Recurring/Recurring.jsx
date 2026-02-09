import { useState, useEffect, useCallback } from 'react'
import {
  fetchRecurringWithNextDate,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  processRecurringTransactions,
} from '../../services/recurring'
import { fetchWallets } from '../../services/wallets'
import { fetchCategories } from '../../services/categories'
import RecurringCard from './RecurringCard'
import RecurringForm from './RecurringForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Recurring() {
  const [recurrings, setRecurrings] = useState([])
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [processResult, setProcessResult] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filter, setFilter] = useState('active')

  const loadData = useCallback(async () => {
    try {
      const [recurringsData, walletsData, categoriesData] = await Promise.all([
        fetchRecurringWithNextDate(),
        fetchWallets(),
        fetchCategories(),
      ])
      setRecurrings(recurringsData)
      setWallets(walletsData)
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

  async function handleProcess() {
    setProcessing(true)
    setProcessResult(null)
    try {
      const result = await processRecurringTransactions()
      setProcessResult(result)
      await loadData()
    } catch (err) {
      console.error('Error procesando recurrentes:', err)
    } finally {
      setProcessing(false)
    }
  }

  async function handleCreate(data) {
    await createRecurringTransaction(data)
    await loadData()
  }

  async function handleUpdate(data) {
    if (!editingRecurring) return
    await updateRecurringTransaction(editingRecurring.id, data)
    await loadData()
    setEditingRecurring(null)
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      await deleteRecurringTransaction(deleteConfirm.id)
      setRecurrings((prev) => prev.filter((r) => r.id !== deleteConfirm.id))
    } catch (err) {
      console.error('Error eliminando recurrente:', err)
    } finally {
      setDeleteConfirm(null)
    }
  }

  const handleToggle = useCallback(async (recurring) => {
    try {
      await updateRecurringTransaction(recurring.id, {
        is_active: !recurring.is_active,
      })
      await loadData()
    } catch (err) {
      console.error('Error actualizando recurrente:', err)
    }
  }, [loadData])

  const openEdit = useCallback((recurring) => {
    setEditingRecurring(recurring)
    setShowForm(true)
  }, [])

  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditingRecurring(null)
  }, [])

  // Filtrar recurrentes
  const filteredRecurrings = recurrings.filter((r) => {
    if (filter === 'active') return r.is_active
    if (filter === 'inactive') return !r.is_active
    return true
  })

  const activeCount = recurrings.filter((r) => r.is_active).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Transacciones Recurrentes
          </h1>
          {activeCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeCount} recurrente{activeCount !== 1 ? 's' : ''} activa
              {activeCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleProcess}
            disabled={processing}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Procesando...
              </span>
            ) : (
              'Procesar Pendientes'
            )}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Nueva Recurrente
          </button>
        </div>
      </div>

      {/* Resultado de procesamiento */}
      {processResult && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg ${
            processResult.processed > 0
              ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <p
            className={`text-sm font-medium ${
              processResult.processed > 0 ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {processResult.processed > 0
              ? `Se crearon ${processResult.processed} transaccion${
                  processResult.processed !== 1 ? 'es' : ''
                }`
              : 'No hay transacciones pendientes por procesar'}
          </p>
        </div>
      )}

      {/* Filtros */}
      {recurrings.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Pausadas
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Todas
          </button>
        </div>
      )}

      {/* Lista */}
      {recurrings.length === 0 ? (
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay transacciones recurrentes.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
          >
            Crear tu primera recurrente
          </button>
        </div>
      ) : filteredRecurrings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No hay recurrentes {filter === 'active' ? 'activas' : 'pausadas'}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredRecurrings.map((recurring) => (
            <RecurringCard
              key={recurring.id}
              recurring={recurring}
              onEdit={openEdit}
              onDelete={setDeleteConfirm}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Formulario */}
      <RecurringForm
        isOpen={showForm}
        onClose={closeForm}
        onSubmit={editingRecurring ? handleUpdate : handleCreate}
        wallets={wallets}
        categories={categories}
        recurring={editingRecurring}
      />

      {/* Confirmacion de eliminacion */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar Recurrente"
        message={`¿Seguro que quieres eliminar "${
          deleteConfirm?.description || deleteConfirm?.category?.name
        }"? Las transacciones ya creadas no se eliminaran.`}
        confirmText="Eliminar"
      />
    </div>
  )
}
