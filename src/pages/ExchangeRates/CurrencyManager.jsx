import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { fetchCurrencies, createCurrency, deleteCurrency } from '../../services/currencies'

export default function CurrencyManager({ isOpen, onClose }) {
  const [currencies, setCurrencies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '' })

  useEffect(() => {
    if (isOpen) {
      loadCurrencies()
    }
  }, [isOpen])

  async function loadCurrencies() {
    try {
      const data = await fetchCurrencies()
      setCurrencies(data)
    } catch (err) {
      setError('Error al cargar monedas: ' + err.message)
    }
  }

  async function handleAddCurrency(e) {
    e.preventDefault()
    setError('')

    if (!newCurrency.code || !newCurrency.name) {
      setError('Código y nombre son requeridos')
      return
    }

    setLoading(true)
    try {
      await createCurrency(newCurrency)
      setNewCurrency({ code: '', name: '', symbol: '' })
      setShowAddForm(false)
      await loadCurrencies()
    } catch (err) {
      setError('Error al crear moneda: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteCurrency(id, code) {
    if (!confirm(`¿Eliminar la moneda ${code}? Esta acción no se puede deshacer.`)) {
      return
    }

    setLoading(true)
    setError('')
    try {
      await deleteCurrency(id)
      await loadCurrencies()
    } catch (err) {
      setError('Error al eliminar moneda: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestionar Monedas">
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Lista de monedas */}
        <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Símbolo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currencies.map((currency) => (
                <tr key={currency.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {currency.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {currency.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {currency.symbol || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {currency.is_system ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        Sistema
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                        Personal
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {!currency.is_system && (
                      <button
                        onClick={() => handleDeleteCurrency(currency.id, currency.code)}
                        disabled={loading}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Formulario de agregar */}
        {showAddForm ? (
          <form onSubmit={handleAddCurrency} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                  placeholder="EUR"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({ ...newCurrency, name: e.target.value })}
                  placeholder="Euro"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Símbolo
                </label>
                <input
                  type="text"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({ ...newCurrency, symbol: e.target.value })}
                  maxLength={5}
                  placeholder="€"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewCurrency({ code: '', name: '', symbol: '' })
                  setError('')
                }}
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Agregar'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            + Agregar Moneda Personalizada
          </button>
        )}
      </div>
    </Modal>
  )
}
