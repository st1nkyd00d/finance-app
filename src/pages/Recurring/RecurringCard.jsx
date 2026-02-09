import { formatFrequency } from '../../services/recurring'
import { CURRENCY_SYMBOLS, formatAmount } from '../../utils/currency'

export default function RecurringCard({ recurring, onEdit, onDelete, onToggle }) {
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => onEdit(recurring)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Editar"
            aria-label="Editar recurrente"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(recurring)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Eliminar"
            aria-label="Eliminar recurrente"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>

      {/* Amount and Frequency */}
      <div className="flex items-baseline justify-between mb-3">
        <span className={`text-2xl font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isIncome ? '+' : '-'}{formatAmount(amount)} {CURRENCY_SYMBOLS[wallet?.currency] || wallet?.currency}
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
}
