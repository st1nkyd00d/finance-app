import { memo } from 'react'
import { formatFrequency } from '../../services/recurring'
import { CURRENCY_SYMBOLS, formatAmount } from '../../utils/currency'
import { HiPause, HiPlay, HiPencilSquare, HiTrash } from 'react-icons/hi2'
import { usePrivacy } from '../../contexts/PrivacyContext'

export default memo(function RecurringCard({ recurring, onEdit, onDelete, onToggle }) {
  const {
    category,
    wallet,
    type,
    amount,
    frequency,
    description,
    start_date,
    end_date,
    is_active,
    nextExecution,
  } = recurring

  const isIncome = type === 'income'
  const { balancesHidden } = usePrivacy()

  function formatDate(dateStr) {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const nextDateStr = nextExecution
    ? new Date(nextExecution).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
      })
    : null

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 ${
        !is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: category?.color + '20' }}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category?.color }}
            />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {description || category?.name || 'Sin descripcion'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{category?.name}</span>
              <span>•</span>
              <span>{wallet?.name}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(recurring)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={is_active ? 'Pausar' : 'Activar'}
            aria-label={is_active ? 'Pausar recurrente' : 'Activar recurrente'}
          >
            {is_active ? (
              <HiPause className="w-4 h-4" />
            ) : (
              <HiPlay className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(recurring)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Editar"
            aria-label="Editar recurrente"
          >
            <HiPencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(recurring)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Eliminar"
            aria-label="Eliminar recurrente"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Amount and Frequency */}
      <div className="flex items-baseline justify-between mb-3">
        <span className={`text-2xl font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {balancesHidden ? '••••••' : `${isIncome ? '+' : '-'}${formatAmount(amount)} ${CURRENCY_SYMBOLS[wallet?.currency] || wallet?.currency}`}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {formatFrequency(frequency)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <span>Desde: {formatDate(start_date)}</span>
          {end_date && <span>Hasta: {formatDate(end_date)}</span>}
        </div>
        {is_active && nextDateStr && (
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            Proxima: {nextDateStr}
          </span>
        )}
        {!is_active && (
          <span className="text-amber-600 dark:text-amber-400 font-medium">Pausada</span>
        )}
      </div>
    </div>
  )
})
