import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { fetchCurrencies } from '../../services/currencies'
import useCurrencyConvert from '../../hooks/useCurrencyConvert'

export default function CurrencyCalculator({ isOpen, onClose }) {
  const [currencies, setCurrencies] = useState([])
  const [amount, setAmount] = useState('100')
  const [baseCurrency, setBaseCurrency] = useState('USD')
  const { convert, loading: ratesLoading } = useCurrencyConvert()

  useEffect(() => {
    if (isOpen) {
      fetchCurrencies()
        .then((data) => {
          setCurrencies(data)
          if (data.length > 0 && !baseCurrency) {
            setBaseCurrency(data[0].code)
          }
        })
        .catch(() => setCurrencies([]))
    }
  }, [isOpen])

  const numAmount = parseFloat(amount) || 0

  // Calcular conversiones a todas las monedas
  const conversions = currencies
    .filter((c) => c.code !== baseCurrency)
    .map((c) => {
      const value = convert(numAmount, baseCurrency, c.code)
      return {
        code: c.code,
        name: c.name,
        symbol: c.symbol || c.code,
        value,
        available: value !== null,
      }
    })
    .sort((a, b) => {
      // Monedas con tasa disponible primero
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      return a.code.localeCompare(b.code)
    })

  const availableCount = conversions.filter((c) => c.available).length
  const totalCount = conversions.length

  function handleCopy(value) {
    navigator.clipboard.writeText(value.toString())
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Calculadora de Conversión">
      <div className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Moneda Base
            </label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {currencies.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info */}
        {totalCount > 0 && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Mostrando {availableCount} de {totalCount} conversiones disponibles
          </div>
        )}

        {/* Tabla de conversiones */}
        {conversions.length > 0 ? (
          <div className="border dark:border-gray-600 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Moneda
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {conversions.map((c) => (
                  <tr
                    key={c.code}
                    className={!c.available ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 dark:text-white">{c.code}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{c.name}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {c.available ? (
                        <span className="text-gray-900 dark:text-white">
                          {c.symbol}{' '}
                          {c.value.toLocaleString('es-VE', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm">
                          Sin tasa
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.available && (
                        <button
                          onClick={() => handleCopy(c.value)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm"
                          title="Copiar al portapapeles"
                        >
                          Copiar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {ratesLoading ? 'Cargando tasas...' : 'No hay monedas para mostrar'}
          </div>
        )}

        {/* Advertencia si faltan tasas */}
        {availableCount < totalCount && totalCount > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-300 text-sm">
              <strong>Nota:</strong> Algunas conversiones no están disponibles. Agrega más tasas de
              cambio para ver todas las conversiones posibles.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
