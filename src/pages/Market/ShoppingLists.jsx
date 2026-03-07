import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiPlus, HiShoppingCart } from 'react-icons/hi2'
import ShoppingListCard from './ShoppingListCard'
import ShoppingListForm from './ShoppingListForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import {
  fetchShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
} from '../../services/shoppingLists'

export default function ShoppingLists() {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const [formOpen, setFormOpen] = useState(false)
  const [editingList, setEditingList] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadLists = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchShoppingLists()
      setLists(data)
    } catch (err) {
      setError(err.message || 'Error al cargar las listas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLists() }, [loadLists])

  const openCreate = () => { setEditingList(null); setFormOpen(true) }
  const openEdit = (list) => { setEditingList(list); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditingList(null) }

  const handleSave = async (data) => {
    try {
      if (editingList) {
        await updateShoppingList(editingList.id, data)
        success('Lista actualizada')
      } else {
        await createShoppingList(data)
        success('Lista creada')
      }
      await loadLists()
    } catch (err) {
      toastError(err.message || 'Error al guardar')
      throw err
    }
  }

  const handleToggleComplete = async (list) => {
    try {
      await updateShoppingList(list.id, { is_completed: !list.is_completed })
      success(list.is_completed ? 'Lista reactivada' : 'Lista completada')
      await loadLists()
    } catch (err) {
      toastError(err.message || 'Error al actualizar')
    }
  }

  const openDeleteConfirm = (list) => {
    setDeleteConfirm({ isOpen: true, id: list.id, name: list.name })
  }
  const closeDeleteConfirm = () => {
    setDeleteConfirm({ isOpen: false, id: null, name: '' })
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteShoppingList(deleteConfirm.id)
      success('Lista eliminada')
      closeDeleteConfirm()
      await loadLists()
    } catch (err) {
      toastError(err.message || 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {lists.length} lista{lists.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <HiPlus className="w-4 h-4" />
          Nueva Lista
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg" role="alert">
          {error}
        </div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-16">
          <HiShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Sin listas de compra</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Crea tu primera lista para empezar</p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Crear Primera Lista
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ShoppingListCard
              key={list.id}
              list={list}
              onOpen={(l) => navigate(`/market/list/${l.id}`)}
              onEdit={openEdit}
              onDelete={openDeleteConfirm}
              onToggleComplete={handleToggleComplete}
            />
          ))}
        </div>
      )}

      <ShoppingListForm
        isOpen={formOpen}
        onClose={closeForm}
        onSave={handleSave}
        initialData={editingList}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDelete}
        title="Eliminar Lista"
        message={`¿Eliminar la lista "${deleteConfirm.name}" y todos sus ítems?`}
        confirmText="Eliminar"
        loading={deleteLoading}
      />
    </div>
  )
}
