import { useState, useEffect, useCallback } from 'react'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../services/categories'
import CategoryItem from './CategoryItem'
import CategoryForm from './CategoryForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('expense')

  // Modal states
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadCategories = useCallback(async () => {
    try {
      setError('')
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      setError('Error al cargar categorias: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const filteredCategories = activeTab === 'expense' ? expenseCategories : incomeCategories

  async function handleCreate(data) {
    await createCategory(data)
    await loadCategories()
  }

  async function handleUpdate(data) {
    await updateCategory(editingCategory.id, data)
    await loadCategories()
  }

  function handleEditClick(category) {
    setEditingCategory(category)
    setShowForm(true)
  }

  function handleDeleteClick(category) {
    setDeleteError('')
    setDeletingCategory(category)
  }

  async function handleConfirmDelete() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      await loadCategories()
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingCategory(null)
  }

  function handleOpenCreate() {
    setEditingCategory(null)
    setShowForm(true)
  }

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + Nueva
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-6 w-fit">
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'expense'
              ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Gastos ({expenseCategories.length})
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'income'
              ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Ingresos ({incomeCategories.length})
        </button>
      </div>

      {/* Lista */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay categorias de {activeTab === 'expense' ? 'gastos' : 'ingresos'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
          >
            Crear una categoria
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
          {filteredCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <CategoryForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={editingCategory ? handleUpdate : handleCreate}
        category={editingCategory}
        defaultType={activeTab}
      />

      {/* Dialog confirmar eliminacion */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Categoria"
        message={
          deleteError
            ? deleteError
            : `Estas seguro que quieres eliminar "${deletingCategory?.name}"? Esta accion no se puede deshacer.`
        }
        loading={deleteLoading}
      />
    </div>
  )
}
