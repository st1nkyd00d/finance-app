import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  HiArrowLeft,
  HiPlus,
  HiCheckCircle,
  HiTrash,
  HiPencil,
  HiShoppingCart,
} from 'react-icons/hi2'
import AddItemModal from './AddItemModal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { useToast } from '../../contexts/ToastContext'
import { usePrivacy } from '../../contexts/PrivacyContext'
import { formatAmount, convertToUSD, CURRENCY_SYMBOLS } from '../../utils/currency'
import { fetchCurrentRates } from '../../services/exchangeRates'
import {
  fetchShoppingListById,
  fetchListItems,
  updateShoppingList,
  addListItem,
  updateListItem,
  toggleItemChecked,
  deleteListItem,
} from '../../services/shoppingLists'

export default function ShoppingListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()
  const { balancesHidden } = usePrivacy()

  const [list, setList] = useState(null)
  const [items, setItems] = useState([])
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: '' })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const [listData, itemsData, ratesData] = await Promise.all([
        fetchShoppingListById(id),
        fetchListItems(id),
        fetchCurrentRates().catch(() => []),
      ])
      setList(listData)
      setItems(itemsData)
      setRates(ratesData)
    } catch (err) {
      setError(err.message || 'Error al cargar la lista')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleToggle = async (item) => {
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: !i.is_checked } : i))
    try {
      await toggleItemChecked(item.id, !item.is_checked)
    } catch (err) {
      // Revert
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_checked: item.is_checked } : i))
      toastError('Error al actualizar ítem')
    }
  }

  const handleAdd = async (data) => {
    await addListItem(data)
    success('Ítem agregado')
    await load()
  }

  const handleToggleListComplete = async () => {
    try {
      const updated = await updateShoppingList(id, { is_completed: !list.is_completed })
      setList(updated)
      success(list.is_completed ? 'Lista reactivada' : 'Lista completada')
    } catch (err) {
      toastError(err.message || 'Error al actualizar lista')
    }
  }

  const openDeleteItem = (item) => {
    setDeleteConfirm({ isOpen: true, id: item.id, name: item.name })
  }
  const closeDeleteItem = () => setDeleteConfirm({ isOpen: false, id: null, name: '' })

  const handleDeleteItem = async () => {
    setDeleteLoading(true)
    try {
      await deleteListItem(deleteConfirm.id)
      success('Ítem eliminado')
      closeDeleteItem()
      await load()
    } catch (err) {
      toastError(err.message || 'Error al eliminar')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Computed totals
  const checkedCount = items.filter((i) => i.is_checked).length
  const totalCount = items.length
  const progress = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0

  const totalVes = items.reduce((sum, item) => {
    if (!item.price || item.currency !== 'VES') return sum
    return sum + parseFloat(item.price) * parseFloat(item.quantity || 1)
  }, 0)

  const totalUsd = items.reduce((sum, item) => {
    if (!item.price || !item.currency) return sum
    const qty = parseFloat(item.quantity || 1)
    if (item.currency === 'USD' || item.currency === 'USDT') {
      return sum + parseFloat(item.price) * qty
    }
    if (item.price_usd != null) {
      return sum + parseFloat(item.price_usd) * qty
    }
    const converted = convertToUSD(parseFloat(item.price), item.currency, rates)
    return converted != null ? sum + converted * qty : sum
  }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/market')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 mb-6 text-sm">
          <HiArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
          {error || 'Lista no encontrada'}
        </div>
      </div>
    )
  }

  const pendingItems = items.filter((i) => !i.is_checked)
  const checkedItems = items.filter((i) => i.is_checked)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/market')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 text-sm transition-colors"
      >
        <HiArrowLeft className="w-4 h-4" />
        Volver al Mercado
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <HiShoppingCart className="w-6 h-6 text-indigo-500 shrink-0" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{list.name}</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              list.is_completed
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
            }`}>
              {list.is_completed ? 'Completada' : 'Activa'}
            </span>
            <button
              onClick={handleToggleListComplete}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline transition-colors"
            >
              {list.is_completed ? 'Reactivar' : 'Completar'}
            </button>
          </div>
        </div>

        {list.notes && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{list.notes}</p>
        )}

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>{checkedCount} de {totalCount} ítems</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Totals */}
        <div className="flex gap-4 text-sm">
          {totalVes > 0 && (
            <span className="text-gray-600 dark:text-gray-300">
              Total VES: <span className="font-semibold text-gray-900 dark:text-white">
                {balancesHidden ? '••••••' : `Bs ${formatAmount(totalVes)}`}
              </span>
            </span>
          )}
          {totalUsd > 0 && (
            <span className="text-gray-600 dark:text-gray-300">
              Total USD: <span className="font-semibold text-gray-900 dark:text-white">
                {balancesHidden ? '••••••' : `$${formatAmount(totalUsd)}`}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
        >
          <HiPlus className="w-4 h-4" />
          Agregar Ítem
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <HiShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Sin ítems. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Pending items */}
          {pendingItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              rates={rates}
              balancesHidden={balancesHidden}
              onToggle={handleToggle}
              onDelete={openDeleteItem}
            />
          ))}

          {/* Checked items */}
          {checkedItems.length > 0 && pendingItems.length > 0 && (
            <div className="flex items-center gap-2 my-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">Completados</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>
          )}

          {checkedItems.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              rates={rates}
              balancesHidden={balancesHidden}
              onToggle={handleToggle}
              onDelete={openDeleteItem}
            />
          ))}
        </div>
      )}

      <AddItemModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        listId={id}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteItem}
        onConfirm={handleDeleteItem}
        title="Eliminar Ítem"
        message={`¿Eliminar "${deleteConfirm.name}" de la lista?`}
        confirmText="Eliminar"
        loading={deleteLoading}
      />
    </div>
  )
}

function ItemRow({ item, rates, balancesHidden, onToggle, onDelete }) {
  // Calcular USD equivalente para mostrar junto al precio
  const itemUsd = (() => {
    if (!item.price || !item.currency) return null
    if (item.currency === 'USD' || item.currency === 'USDT') return null // ya es USD, no hace falta doble
    if (item.price_usd != null) return parseFloat(item.price_usd)
    if (rates?.length) return convertToUSD(parseFloat(item.price), item.currency, rates)
    return null
  })()

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      item.is_checked
        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item)}
        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.is_checked
            ? 'border-indigo-600 bg-indigo-600'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
        }`}
      >
        {item.is_checked && <HiCheckCircle className="w-4 h-4 text-white" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${item.is_checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
          {item.quantity !== 1 && <span className="text-gray-500 dark:text-gray-400 mr-1">{item.quantity}{item.unit ? ` ${item.unit}` : ''}</span>}
          {item.name}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {item.store_name && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{item.store_name}</span>
          )}
          {item.notes && (
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">{item.notes}</span>
          )}
        </div>
      </div>

      {/* Price */}
      {item.price != null && item.currency && (
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {balancesHidden
              ? '••••'
              : `${CURRENCY_SYMBOLS[item.currency] || item.currency} ${formatAmount(item.price)}`}
          </p>
          {!balancesHidden && itemUsd != null && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">≈ ${formatAmount(itemUsd)}</p>
          )}
        </div>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(item)}
        className="shrink-0 p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <HiTrash className="w-4 h-4" />
      </button>
    </div>
  )
}
