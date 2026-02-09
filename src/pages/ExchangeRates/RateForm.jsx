import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { fetchCurrencies } from '../../services/currencies'

export default function RateForm({ isOpen, onClose, onSave, defaultPair = null }) {
  const [currencies, setCurrencies] = useState([])
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('VES')
  const [rate, setRate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchCurrencies()
        .then((data) => {
          setCurrencies(data)
          if (data.length > 0 && !fromCurrency) {
            setFromCurrency(data[0].code)
          }
          if (data.length > 1 && !toCurrency) {
            setToCurrency(data[1].code)
          }
        })
        .catch(() => setCurrencies([]))
    }
  }, [isOpen])

  useEffect(() => {
    if (defaultPair) {
      setFromCurrency(defaultPair.from)
      setToCurrency(defaultPair.to)
    }
    setRate('')
    setError('')
  }, [isOpen, defaultPair])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const rateNum = parseFloat(rate)
    if (!rate || isNaN(rateNum) || rateNum <= 0) {
      setError('Ingresa una tasa valida mayor a 0')
      return
    }

    setLoading(true)
    try {
      await onSave({
        from_currency: fromCurrency,
        to_currency: toCurrency,
        rate: rateNum,
        source: 'manual',
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Actualizar Tasa de Cambio">
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              De
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              A
            </label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="rate-value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tasa (1 {fromCurrency} = ? {toCurrency})
          </label>
          <input
            id="rate-value"
            type="number"
            step="any"
            min="0"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={`Ej: ${fromCurrency === 'USD' && toCurrency === 'VES' ? '95.50' : '92.00'}`}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Tasa'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
