import { getTimeAgo } from '../../utils/date'

const SOURCE_LABELS = {
  manual: 'Manual',
  bcv: 'BCV',
  binance: 'Binance',
  coingecko: 'CoinGecko',
}

const SOURCE_COLORS = {
  manual: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  bcv: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  binance: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
  coingecko: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
}

export default function RateCard({ rate, onUpdate, onDelete }) {
  const timeAgo = getTimeAgo(rate.created_at)
  const isStale = (new Date() - new Date(rate.created_at)) > 24 * 60 * 60 * 1000
  const numRate = parseFloat(rate.rate)
  const inverseRate = 1 / numRate

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {rate.from_currency} / {rate.to_currency}
          </p>
          <div className="space-y-1.5">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {numRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </p>
              <p className="text-xs text-gray-400">
                1 {rate.from_currency} = {numRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {rate.to_currency}
              </p>
            </div>
            <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {inverseRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </p>
              <p className="text-xs text-gray-400">
                1 {rate.to_currency} = {inverseRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {rate.from_currency}
              </p>
            </div>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${SOURCE_COLORS[rate.source] || SOURCE_COLORS.manual}`}>
          {SOURCE_LABELS[rate.source] || rate.source}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          {isStale && (
            <svg className="w-3.5 h-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          )}
          <span className={`text-xs ${isStale ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdate({ from: rate.from_currency, to: rate.to_currency })}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition-colors"
          >
            Actualizar
          </button>
          <button
            onClick={() => onDelete(rate)}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
            title="Eliminar tasa"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
