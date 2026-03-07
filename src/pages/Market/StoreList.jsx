import { useState, useEffect, useCallback } from 'react'
import { HiPlus, HiBuildingStorefront, HiPencil, HiTrash } from 'react-icons/hi2'
import StoreForm from './StoreForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { fetchStores, createStore, updateStore, deleteStore } from '../../services/stores'

export default function StoreList() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { success, error: toastError } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editingStore, setEditingStore] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadStores = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setStores(await fetchStores())
    } catch (err) {
      setError(err.message || 'Error al cargar tiendas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStores() }, [loadStores])

  const openCreate = () => { setEditingStore(null); setFormOpen(true) }
  const openEdit = (s) => { setEditingStore(s); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditingStore(null) }

  const handleSave = async (data) => {
    try {
      if (editingStore) {
        await updateStore(editingStore.id, data)
        success('Tienda actualizada')
      } else {
        await createStore(data)
        success('Tienda creada')
      }
      await loadStores()
    } catch (err) {
      toastError(err.message || 'Error al guardar')
      throw err
    }
  }

  const openDelete = (s) => setDeleteConfirm({ isOpen: true, id: s.id, name: s.name })
  const closeDelete = () => setDeleteConfirm({ isOpen: false, id: null, name: '' })

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteStore(deleteConfirm.id)
      success('Tienda eliminada')
      closeDelete()
      await loadStores()
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
          {stores.length} tienda{stores.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <HiPlus className="w-4 h-4" />
          Nueva Tienda
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {stores.length === 0 ? (
        <div className="text-center py-16">
          <HiBuildingStorefront className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">Sin tiendas registradas</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">
            Crea tus tiendas aquí para asignarlas fácilmente a los precios de productos
          </p>
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Crear Primera Tienda
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-4 py-3 flex items-center gap-3"
            >
              <HiBuildingStorefront className="w-8 h-8 text-indigo-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{store.name}</p>
                {store.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{store.notes}</p>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(store)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Editar"
                >
                  <HiPencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDelete(store)}
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Eliminar"
                >
                  <HiTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <StoreForm
        isOpen={formOpen}
        onClose={closeForm}
        onSave={handleSave}
        initialData={editingStore}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Eliminar Tienda"
        message={`¿Eliminar "${deleteConfirm.name}"? Los precios que ya la usan no se verán afectados.`}
        confirmText="Eliminar"
        loading={deleteLoading}
      />
    </div>
  )
}
