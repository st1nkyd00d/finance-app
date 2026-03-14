import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { getCurrentRate, fetchBinanceRate, fetchBCVRate } from '../../services/exchangeRates'

const FREQUENCIES = [
  { value: 'daily', label: 'Diaria' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

export default function RecurringForm({
  isOpen,
  onClose,
  onSubmit,
  wallets,
  categories,
  recurring = null,
}) {
  const [formData, setFormData] = useState({
    type: 'expense',
    wallet_id: '',
    category_id: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estado para tasa de cambio (cuando es VES)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [rateType, setRateType] = useState('binance') // 'binance', 'bcv', 'libre'
  const [loadingRate, setLoadingRate] = useState(false)
  const [rateError, setRateError] = useState('')

  const isEditing = !!recurring

  useEffect(() => {
    if (recurring) {
      setFormData({
        type: recurring.type,
        wallet_id: recurring.wallet_id,
        category_id: recurring.category_id,
        amount: recurring.amount.toString(),
        frequency: recurring.frequency,
        start_date: recurring.start_date,
        end_date: recurring.end_date || '',
        description: recurring.description || '',
      })
      // Cargar la tasa de cambio guardada si existe
      if (recurring.exchange_rate) {
        setExchangeRate(recurring.exchange_rate)
        setRateType('libre')
      }
    } else {
      setFormData({
        type: 'expense',
        wallet_id: wallets[0]?.id || '',
        category_id: '',
        amount: '',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: '',
      })
      setExchangeRate(null)
      setRateType('binance')
    }
    setError('')
    setRateError('')
  }, [recurring, isOpen, wallets])

  // Cargar tasa de cambio según el tipo seleccionado (binance, bcv, libre)
  useEffect(() => {
    async function loadRate() {
      const wallet = wallets.find((w) => w.id === formData.wallet_id)

      // Solo cargar si es VES y no es tipo libre
      if (!wallet || wallet.currency !== 'VES' || rateType === 'libre') {
        if (wallet?.currency !== 'VES') {
          setExchangeRate(null)
          setRateError('')
        }
        return
      }

      setLoadingRate(true)
      setRateError('')

      try {
        let rate = null

        if (rateType === 'binance') {
          rate = await fetchBinanceRate()
        } else if (rateType === 'bcv') {
          rate = await fetchBCVRate()
        }

        if (rate) {
          setExchangeRate(rate)
        } else {
          setRateError('No se pudo obtener la tasa')
        }
      } catch (err) {
        console.error('Error cargando tasa:', err)
        setRateError(err.message || 'Error al cargar tasa')
      } finally {
        setLoadingRate(false)
      }
    }

    if (formData.wallet_id && wallets.length > 0 && isOpen) {
      loadRate()
    }
  }, [formData.wallet_id, wallets, isOpen, rateType])

  // Filtrar categorias segun tipo
  const filteredCategories = categories.filter((c) => c.type === formData.type)

  // Limpiar category_id si cambia el tipo
  useEffect(() => {
    const currentCat = categories.find((c) => c.id === formData.category_id)
    if (currentCat && currentCat.type !== formData.type) {
      setFormData((prev) => ({ ...prev, category_id: '' }))
    }
  }, [formData.type, formData.category_id, categories])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.wallet_id) {
      setError('Selecciona una billetera')
      return
    }

    if (!formData.category_id) {
      setError('Selecciona una categoria')
      return
    }

    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    if (!formData.start_date) {
      setError('Selecciona una fecha de inicio')
      return
    }

    if (selectedWallet?.currency === 'VES') {
      if (!exchangeRate || exchangeRate <= 0) {
        setError('La tasa de cambio debe ser mayor a 0 para billeteras VES')
        return
      }
      if (rateType === 'libre' && !exchangeRate) {
        setError('Ingresa una tasa de cambio personalizada')
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit({
        wallet_id: formData.wallet_id,
        category_id: formData.category_id,
        type: formData.type,
        amount,
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description,
        exchange_rate: selectedWallet?.currency === 'VES' ? exchangeRate : null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  const selectedWallet = wallets.find((w) => w.id === formData.wallet_id)

  // Calcular equivalente en USD
  const amountNum = parseFloat(formData.amount) || 0
  const amountUsd = selectedWallet?.currency === 'VES' && exchangeRate > 0
    ? (amountNum / exchangeRate).toFixed(3)
    : null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Recurrente' : 'Nueva Transaccion Recurrente'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'expense' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.type === 'expense'
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'income' })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formData.type === 'income'
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent'
              }`}
            >
              Ingreso
            </button>
          </div>
        </div>

        {/* Billetera */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Billetera
          </label>
          <select
            value={formData.wallet_id}
            onChange={(e) =>
              setFormData({ ...formData, wallet_id: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Seleccionar...</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoria
          </label>
          <select
            value={formData.category_id}
            onChange={(e) =>
              setFormData({ ...formData, category_id: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Seleccionar...</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto {selectedWallet && `(${selectedWallet.currency})`}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) =>
              setFormData({ ...formData, amount: e.target.value })
            }
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Conversión a USD (solo para VES) */}
        {selectedWallet?.currency === 'VES' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
            {/* Selector de tipo de tasa */}
            <div>
              <label className="block text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                Tipo de tasa
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRateType('binance')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                    rateType === 'binance'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                  }`}
                >
                  Binance
                </button>
                <button
                  type="button"
                  onClick={() => setRateType('bcv')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                    rateType === 'bcv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                  }`}
                >
                  BCV
                </button>
                <button
                  type="button"
                  onClick={() => setRateType('libre')}
                  className={`flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                    rateType === 'libre'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-gray-600'
                  }`}
                >
                  Personalizada
                </button>
              </div>
            </div>

            {/* Tasa de cambio */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-blue-600 dark:text-blue-400">
                  Tasa de cambio (Bs/USD):
                </span>
                {loadingRate && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">Cargando...</span>
                )}
              </div>

              {rateType === 'libre' ? (
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={exchangeRate || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setExchangeRate(val > 0 ? val : null)
                    setRateError('')
                  }}
                  placeholder="Ej: 45.50"
                  className="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded">
                  <span className="text-base font-semibold text-blue-900 dark:text-blue-100">
                    {exchangeRate ? exchangeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '—'}
                  </span>
                </div>
              )}

              {rateError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {rateError}
                </p>
              )}
            </div>

            {/* Equivalente en USD */}
            <div className="pt-2 border-t border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Equivalente en USD</span>
                <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  ${amountUsd || '0.00'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Frecuencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Frecuencia
          </label>
          <select
            value={formData.frequency}
            onChange={(e) =>
              setFormData({ ...formData, frequency: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha Fin <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Descripcion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripcion <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Ej: Pago de Netflix"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
