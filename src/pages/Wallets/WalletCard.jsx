import { memo } from 'react'
import { CURRENCY_SYMBOLS, formatAmount } from '../../utils/currency'

const CURRENCY_COLORS = {
  VES: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  USD: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
  USDT: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300',
}

export default memo(function WalletCard({ wallet, onEdit, onDelete }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${CURRENCY_COLORS[wallet.currency] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
          {CURRENCY_SYMBOLS[wallet.currency] || wallet.currency}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-medium text-gray-900 dark:text-white">{wallet.name}</h3>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {formatAmount(wallet.balance)} {CURRENCY_SYMBOLS[wallet.currency] || wallet.currency}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{wallet.currency}</span>
            {!wallet.include_in_total && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded">
                Excluida del total
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(wallet)}
          className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          title="Editar"
          aria-label="Editar billetera"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(wallet)}
          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          title="Eliminar"
          aria-label="Eliminar billetera"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  )
})
