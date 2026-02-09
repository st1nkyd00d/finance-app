import { HiPencil, HiTrash, HiCheck, HiXMark, HiCalendar } from 'react-icons/hi2'
import { formatAmount } from '../../utils/currency'

export default function GoalCard({ goal, onEdit, onDelete, onToggleActive }) {
  const {
    id,
    name,
    description,
    target_amount,
    deadline,
    is_active,
    current,
    percentage,
    daysRemaining,
    status,
    hasConversionError,
  } = goal

  // Progress bar color
  const progressColor = {
    normal: 'bg-indigo-500',
    warning: 'bg-yellow-500',
    completed: 'bg-green-500',
  }[status]

  // Status badge
  const statusBadge = {
    warning: { text: 'Cerca del objetivo', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    completed: { text: 'Completada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  }[status]

  // Days remaining display
  const daysDisplay = () => {
    if (!deadline) return null
    if (daysRemaining === null) return null
    if (daysRemaining < 0) return <span className="text-red-600 dark:text-red-400">Vencida</span>
    if (daysRemaining === 0) return <span className="text-yellow-600 dark:text-yellow-400">Hoy</span>
    return (
      <span className={daysRemaining <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-600 dark:text-gray-400'}>
        {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
      </span>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${!is_active ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {name}
            {!is_active && <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Inactiva)</span>}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{description}</p>
          )}
        </div>
        {statusBadge && (
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
        )}
      </div>

      {/* Amount Display */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            ${formatAmount(current)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            de ${formatAmount(target_amount)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${progressColor} transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {percentage}%
          </span>
          {hasConversionError && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              Algunas transacciones sin conversión
            </span>
          )}
        </div>
      </div>

      {/* Deadline */}
      {deadline && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <HiCalendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">Fecha límite:</span>
          <span className="font-medium">{new Date(deadline).toLocaleDateString('es-VE')}</span>
          {daysDisplay() && (
            <>
              <span className="text-gray-400">•</span>
              {daysDisplay()}
            </>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onToggleActive(id, !is_active)}
          className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            is_active
              ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              : 'text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
          aria-label={is_active ? 'Desactivar meta' : 'Activar meta'}
        >
          {is_active ? (
            <>
              <HiXMark className="w-4 h-4" />
              Desactivar
            </>
          ) : (
            <>
              <HiCheck className="w-4 h-4" />
              Activar
            </>
          )}
        </button>

        <button
          onClick={() => onEdit(goal)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
          aria-label="Editar meta"
        >
          <HiPencil className="w-4 h-4" />
          Editar
        </button>

        <button
          onClick={() => onDelete(id, name)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto"
          aria-label="Eliminar meta"
        >
          <HiTrash className="w-4 h-4" />
          Eliminar
        </button>
      </div>
    </div>
  )
}
