import { formatAmount } from '../../utils/currency'

const PERIOD_LABELS = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

export default function BudgetCard({ budget, onEdit, onDelete, onToggle }) {
  const {
    category,
    amount,
    period,
    spent,
    percentage,
    daysRemaining,
    status,
    is_active,
    hasConversionError,
  } = budget

  // Colores segun status
  const statusColors = {
    normal: {
      bg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      bgLight: 'bg-green-50 dark:bg-green-900/30',
    },
    warning: {
      bg: 'bg-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      bgLight: 'bg-amber-50 dark:bg-amber-900/30',
    },
    exceeded: {
      bg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      bgLight: 'bg-red-50 dark:bg-red-900/30',
    },
  }

  const colors = statusColors[status] || statusColors.normal

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 ${
        !is_active ? 'opacity-60' : ''
      }`}
    >
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
              {category?.name || 'Sin categoria'}
            </h3>
            <span className="text-xs text-gray-400">
              {PERIOD_LABELS[period]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggle(budget)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={is_active ? 'Desactivar' : 'Activar'}
            aria-label={is_active ? 'Desactivar presupuesto' : 'Activar presupuesto'}
          >
            {is_active ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            )}
          </button>
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Editar"
            aria-label="Editar presupuesto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Eliminar"
            aria-label="Eliminar presupuesto"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Montos */}
      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-2xl font-bold ${colors.text}`}>
          ${formatAmount(spent)}
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          de ${formatAmount(amount)} USD
        </span>
      </div>

      {/* Advertencia de conversion */}
      {hasConversionError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
          Algunos gastos no pudieron convertirse. Verifica las tasas de cambio.
        </p>
      )}

      {/* Barra de progreso */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-3">
        <div
          className={`h-2.5 rounded-full transition-all ${colors.bg}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${colors.text}`}
          >
            {percentage}%
          </span>
          {status === 'exceeded' && (
            <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
              Excedido
            </span>
          )}
          {status === 'warning' && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
              Cerca del limite
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes
        </span>
      </div>
    </div>
  )
}
