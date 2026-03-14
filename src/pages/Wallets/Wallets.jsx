import { useState, useEffect, useCallback } from 'react'
import { fetchWallets, createWallet, updateWallet, deleteWallet, adjustBalance } from '../../services/wallets'
import { useToast } from '../../contexts/ToastContext'
import WalletCard from './WalletCard'
import WalletForm from './WalletForm'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function Wallets() {
  const toast = useToast()
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal states
  const [showForm, setShowForm] = useState(false)
  const [editingWallet, setEditingWallet] = useState(null)
  const [deletingWallet, setDeletingWallet] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadWallets = useCallback(async () => {
    try {
      setError('')
      const data = await fetchWallets()
      setWallets(data)
    } catch (err) {
      setError('Error al cargar billeteras: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWallets()
  }, [loadWallets])

  async function handleCreate(walletData) {
    await createWallet(walletData)
    await loadWallets()
    toast.success('Billetera creada exitosamente')
  }

  async function handleUpdate({ newBalance, ...walletData }) {
    await updateWallet(editingWallet.id, walletData)
    if (newBalance !== undefined) {
      const delta = Math.round((newBalance - (editingWallet.balance ?? 0)) * 100) / 100
      if (delta !== 0) {
        await adjustBalance(editingWallet.id, editingWallet.currency, delta)
      }
    }
    await loadWallets()
    toast.success('Billetera actualizada')
  }

  const handleEditClick = useCallback((wallet) => {
    setEditingWallet(wallet)
    setShowForm(true)
  }, [])

  const handleDeleteClick = useCallback((wallet) => {
    setDeleteError('')
    setDeletingWallet(wallet)
  }, [])

  async function handleConfirmDelete() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteWallet(deletingWallet.id)
      setDeletingWallet(null)
      await loadWallets()
      toast.success('Billetera eliminada')
    } catch (err) {
      setDeleteError(err.message)
      toast.error('Error: ' + err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCloseForm = useCallback(() => {
    setShowForm(false)
    setEditingWallet(null)
  }, [])

  const handleOpenCreate = useCallback(() => {
    setEditingWallet(null)
    setShowForm(true)
  }, [])

  const handleCloseDelete = useCallback(() => setDeletingWallet(null), [])

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Billeteras</h1>
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

      {wallets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No tienes billeteras creadas</p>
          <button
            onClick={handleOpenCreate}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
          >
            Crear tu primera billetera
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <WalletCard
              key={wallet.id}
              wallet={wallet}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <WalletForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={editingWallet ? handleUpdate : handleCreate}
        wallet={editingWallet}
      />

      {/* Dialog confirmar eliminacion */}
      <ConfirmDialog
        isOpen={!!deletingWallet}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title="Eliminar Billetera"
        message={
          deleteError
            ? deleteError
            : `Estas seguro que quieres eliminar "${deletingWallet?.name}"? Esta accion no se puede deshacer.`
        }
        loading={deleteLoading}
      />
    </div>
  )
}
