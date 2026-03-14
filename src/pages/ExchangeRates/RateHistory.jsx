import { useState, useEffect } from 'react'
import { fetchRateHistory } from '../../services/exchangeRates'
import { getTimeAgo } from '../../utils/date'
import Modal from '../../components/ui/Modal'

const SOURCE_LABELS = {
  manual: 'Manual',
  bcv: 'BCV',
  binance: 'Binance',
}

export default function RateHistory({ isOpen, onClose, pair }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && pair) {
      setLoading(true)
      fetchRateHistory(pair.from, pair.to)
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoading(false))
    }
  }, [isOpen, pair])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pair ? `Historial ${pair.from} / ${pair.to}` : 'Historial'}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : history.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No hay historial disponible</p>
      ) : (
        <div className="max-h-80 overflow-y-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 px-2 font-medium">Tasa</th>
                <th className="pb-2 px-2 font-medium">Fuente</th>
                <th className="pb-2 px-2 font-medium text-right">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-50 dark:border-gray-700/50">
                  <td className="py-2.5 px-2">
                    <span className={`font-medium ${entry.is_current ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                      {parseFloat(entry.rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
                    </span>
                    {entry.is_current && (
                      <span className="ml-1.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                        Actual
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-gray-500 dark:text-gray-400">
                    {SOURCE_LABELS[entry.source] || entry.source}
                  </td>
                  <td className="py-2.5 px-2 text-gray-400 text-right">
                    {getTimeAgo(entry.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
