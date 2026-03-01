import { memo } from 'react'
import { CURRENCY_SYMBOLS, formatAmount } from '../../utils/currency'
import { HiArrowsRightLeft, HiTrash } from 'react-icons/hi2'
import { usePrivacy } from '../../contexts/PrivacyContext'

export default memo(function TransactionItem({ transaction, onDelete }) {
  const isIncome = transaction.type === 'income'
  const isTransferIn = transaction.type === 'transfer_in'
  const isTransferOut = transaction.type === 'transfer_out'
  const isTransfer = isTransferIn || isTransferOut
  const isPositive = isIncome || isTransferIn

  const dateStr = new Date(transaction.date).toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const symbol = CURRENCY_SYMBOLS[transaction.currency] || transaction.currency
  const { balancesHidden } = usePrivacy()

  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Icono */}
        {isTransfer ? (
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <HiArrowsRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
        ) : (
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: transaction.category?.color || '#6b7280' }}
          />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {isTransfer
                ? (isTransferOut ? 'Transferencia enviada' : 'Transferencia recibida')
                : (transaction.category?.name || 'Sin categoria')
              }
            </span>
            {isTransfer && (
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                {transaction.wallet?.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{dateStr}</span>
            {!isTransfer && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs text-gray-400">{transaction.wallet?.name}</span>
              </>
            )}
            {transaction.conversion_rate && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs text-blue-500 dark:text-blue-400">Tasa: {parseFloat(transaction.conversion_rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
              </>
            )}
            {transaction.fee && transaction.type === 'transfer_out' && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs text-amber-500 dark:text-amber-400">Comisión: {parseFloat(transaction.fee).toLocaleString('es-VE', { minimumFractionDigits: 2 })} {symbol}</span>
              </>
            )}
            {transaction.description && (
              <>
                <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                <span className="text-xs text-gray-400 truncate">{transaction.description}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <span className={`text-sm font-semibold ${
          isTransfer
            ? (isPositive ? 'text-cyan-600 dark:text-cyan-400' : 'text-blue-600 dark:text-blue-400')
            : (isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')
        }`}>
          {balancesHidden ? '••••••' : `${isPositive ? '+' : '-'}${formatAmount(transaction.amount)} ${symbol}`}
        </span>

        {/* Solo mostrar boton eliminar en transfer_out (elimina ambas) o en income/expense */}
        {(!isTransfer || isTransferOut) && (
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title={isTransfer ? 'Eliminar transferencia' : 'Eliminar'}
          >
            <HiTrash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
})
