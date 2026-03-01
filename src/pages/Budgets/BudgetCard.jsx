import { memo } from 'react'
import { formatAmount } from '../../utils/currency'
import { HiEye, HiEyeSlash, HiPencilSquare, HiTrash } from 'react-icons/hi2'
import { usePrivacy } from '../../contexts/PrivacyContext'

const PERIOD_LABELS = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

export default memo(function BudgetCard({ budget, onEdit, onDelete, onToggle }) {
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
  const { balancesHidden } = usePrivacy()
  const mask = '••••••'

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
              <HiEye className="w-4 h-4" />
            ) : (
              <HiEyeSlash className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(budget)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Editar"
            aria-label="Editar presupuesto"
          >
            <HiPencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(budget)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title="Eliminar"
            aria-label="Eliminar presupuesto"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Montos */}
      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-2xl font-bold ${colors.text}`}>
          {balancesHidden ? mask : `$${formatAmount(spent)}`}
        </span>
        <span className="text-gray-400 dark:text-gray-500">
          de {balancesHidden ? mask : `$${formatAmount(amount)} USD`}
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
})
