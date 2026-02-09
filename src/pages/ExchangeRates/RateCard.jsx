import { getTimeAgo } from '../../utils/date'

const SOURCE_LABELS = {
  manual: 'Manual',
  bcv: 'BCV',
  binance: 'Binance',
}

const SOURCE_COLORS = {
  manual: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
  bcv: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
  binance: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
}

export default function RateCard({ rate, onUpdate }) {
  const timeAgo = getTimeAgo(rate.created_at)
  const isStale = (new Date() - new Date(rate.created_at)) > 24 * 60 * 60 * 1000

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {rate.from_currency} / {rate.to_currency}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {parseFloat(rate.rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            1 {rate.from_currency} = {parseFloat(rate.rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {rate.to_currency}
          </p>
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
        <button
          onClick={() => onUpdate({ from: rate.from_currency, to: rate.to_currency })}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
        >
          Actualizar
        </button>
      </div>
    </div>
  )
}
