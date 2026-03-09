import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchTransactions, createTransaction, createTransfer, deleteTransaction, updateTransaction } from '../../services/transactions'
import { useToast } from '../../contexts/ToastContext'
import useCurrencyConvert from '../../hooks/useCurrencyConvert'
import TransactionItem from './TransactionItem'
import TransactionForm from './TransactionForm'
import TransferForm from './TransferForm'
import TransactionFilters from './TransactionFilters'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { HiMagnifyingGlass } from 'react-icons/hi2'

const PAGE_SIZE = 20

function parseFiltersFromUrl(searchParams) {
  const filters = {}

  const types = searchParams.get('types')
  if (types) filters.types = types.split(',')

  const walletIds = searchParams.get('wallets')
  if (walletIds) filters.walletIds = walletIds.split(',')

  const categoryIds = searchParams.get('categories')
  if (categoryIds) filters.categoryIds = categoryIds.split(',')

  const dateFrom = searchParams.get('from')
  if (dateFrom) filters.dateFrom = dateFrom

  const dateTo = searchParams.get('to')
  if (dateTo) filters.dateTo = dateTo

  const search = searchParams.get('q')
  if (search) filters.search = search

  return filters
}

function filtersToUrl(filters) {
  const params = new URLSearchParams()

  if (filters.types?.length > 0) params.set('types', filters.types.join(','))
  if (filters.walletIds?.length > 0) params.set('wallets', filters.walletIds.join(','))
  if (filters.categoryIds?.length > 0) params.set('categories', filters.categoryIds.join(','))
  if (filters.dateFrom) params.set('from', filters.dateFrom)
  if (filters.dateTo) params.set('to', filters.dateTo)
  if (filters.search) params.set('q', filters.search)

  return params
}

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const [transactions, setTransactions] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState(() => parseFiltersFromUrl(searchParams))

  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [deletingTx, setDeletingTx] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { convert } = useCurrencyConvert()

  const loadTransactions = useCallback(async (pageNum = 0, currentFilters = {}) => {
    try {
      setError('')
      setLoading(true)
      const { data, count } = await fetchTransactions({
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE,
        types: currentFilters.types,
        walletIds: currentFilters.walletIds,
        categoryIds: currentFilters.categoryIds,
        dateFrom: currentFilters.dateFrom,
        dateTo: currentFilters.dateTo,
        search: currentFilters.search,
      })
      setTransactions(data)
      setTotalCount(count)
    } catch (err) {
      setError('Error al cargar transacciones: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar cuando cambian filtros o pagina
  useEffect(() => {
    loadTransactions(page, filters)
  }, [loadTransactions, page, filters])

  // Sincronizar filtros con URL
  useEffect(() => {
    const params = filtersToUrl(filters)
    setSearchParams(params, { replace: true })
  }, [filters, setSearchParams])

  function handleFiltersChange(newFilters) {
    setFilters(newFilters)
    setPage(0)
  }

  function handleFiltersClear() {
    setFilters({})
    setPage(0)
  }

  async function handleCreate(data) {
    await createTransaction(data)
    setPage(0)
    await loadTransactions(0, filters)
    toast.success('Transaccion creada exitosamente')
  }

  async function handleUpdate(data) {
    await updateTransaction(editingTx.id, data)
    await loadTransactions(page, filters)
    toast.success('Transaccion actualizada')
  }

  async function handleTransfer(data) {
    await createTransfer(data)
    setPage(0)
    await loadTransactions(0, filters)
    toast.success('Transferencia realizada exitosamente')
  }

  async function handleConfirmDelete() {
    setDeleteLoading(true)
    try {
      await deleteTransaction(deletingTx.id)
      setDeletingTx(null)
      await loadTransactions(page, filters)
      toast.success('Transaccion eliminada')
    } catch (err) {
      toast.error('Error al eliminar: ' + err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCloseForm = useCallback(() => setShowForm(false), [])
  const handleCloseTransfer = useCallback(() => setShowTransfer(false), [])
  const handleCloseEdit = useCallback(() => setEditingTx(null), [])
  const handleCloseDelete = useCallback(() => setDeletingTx(null), [])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transacciones</h1>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalCount} transaccion(es) encontrada(s)</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTransfer(true)}
            className="bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          >
            Transferir
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Nueva
          </button>
        </div>
      </div>

      {/* Filtros */}
      <TransactionFilters
        filters={filters}
        onChange={handleFiltersChange}
        onClear={handleFiltersClear}
      />

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : transactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <HiMagnifyingGlass className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {Object.keys(filters).length > 0
              ? 'No se encontraron transacciones con estos filtros'
              : 'No hay transacciones registradas'}
          </p>
          {Object.keys(filters).length > 0 ? (
            <button
              onClick={handleFiltersClear}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
            >
              Registrar tu primera transaccion
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onDelete={setDeletingTx}
                onEdit={setEditingTx}
                convert={convert}
              />
            ))}
          </div>

          {/* Paginacion */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Pagina {page + 1} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal nueva transaccion */}
      <TransactionForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSave={handleCreate}
      />

      {/* Modal editar transaccion */}
      <TransactionForm
        isOpen={!!editingTx}
        onClose={handleCloseEdit}
        onSave={handleUpdate}
        editingTx={editingTx}
      />

      {/* Modal transferencia */}
      <TransferForm
        isOpen={showTransfer}
        onClose={handleCloseTransfer}
        onSave={handleTransfer}
      />

      {/* Dialog confirmar eliminacion */}
      <ConfirmDialog
        isOpen={!!deletingTx}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title={deletingTx?.linked_transaction_id ? 'Eliminar Transferencia' : 'Eliminar Transaccion'}
        message={
          deletingTx?.linked_transaction_id
            ? 'Esto eliminara ambas transacciones de la transferencia. Los balances se recalcularan automaticamente.'
            : 'Estas seguro que quieres eliminar esta transaccion? El balance de la billetera se recalculara automaticamente.'
        }
        loading={deleteLoading}
      />
    </div>
  )
}
