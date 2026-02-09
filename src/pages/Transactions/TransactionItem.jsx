import { CURRENCY_SYMBOLS, formatAmount } from '../../utils/currency'

export default function TransactionItem({ transaction, onDelete }) {
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

  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3 min-w-0">
        {/* Icono */}
        {isTransfer ? (
          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
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
          {isPositive ? '+' : '-'}{formatAmount(transaction.amount)} {symbol}
        </span>

        {/* Solo mostrar boton eliminar en transfer_out (elimina ambas) o en income/expense */}
        {(!isTransfer || isTransferOut) && (
          <button
            onClick={() => onDelete(transaction)}
            className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            title={isTransfer ? 'Eliminar transferencia' : 'Eliminar'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
