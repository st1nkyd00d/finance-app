import { memo } from 'react'
import { HiShoppingCart, HiCheckCircle, HiClock } from 'react-icons/hi2'
import { usePrivacy } from '../../contexts/PrivacyContext'
import { formatAmount } from '../../utils/currency'

const ShoppingListCard = memo(function ShoppingListCard({ list, onOpen, onEdit, onDelete, onToggleComplete }) {
  const { balancesHidden } = usePrivacy()

  const items = list.items || []
  const itemCount = items.length
  const checkedCount = items.filter((i) => i.is_checked).length
  const pendingCount = itemCount - checkedCount
  const progress = itemCount > 0 ? Math.round((checkedCount / itemCount) * 100) : 0
  const estimatedUsd = items.reduce((sum, i) => {
    if (i.price_usd != null) return sum + parseFloat(i.price_usd) * parseFloat(i.quantity || 1)
    return sum
  }, 0)

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpen(list)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <HiShoppingCart className="w-5 h-5 text-indigo-500 shrink-0" />
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
          list.is_completed
            ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
            : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
        }`}>
          {list.is_completed ? 'Completada' : 'Activa'}
        </span>
      </div>

      {list.notes && (
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{list.notes}</p>
      )}

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{checkedCount}/{itemCount} ítems</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <HiClock className="w-4 h-4" />
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
        </span>
        {estimatedUsd > 0 && (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            ~${balancesHidden ? '••••' : formatAmount(estimatedUsd)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onEdit(list)}
          className="flex-1 text-xs py-1.5 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Editar
        </button>
        <button
          onClick={() => onToggleComplete(list)}
          className="flex-1 text-xs py-1.5 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          {list.is_completed ? 'Reactivar' : 'Completar'}
        </button>
        <button
          onClick={() => onDelete(list)}
          className="flex-1 text-xs py-1.5 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
        >
          Eliminar
        </button>
      </div>
    </div>
  )
})

export default ShoppingListCard
