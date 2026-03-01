import { useState, useEffect, useMemo } from 'react'
import Modal from '../../components/ui/Modal'
import { fetchWallets } from '../../services/wallets'
import { fetchCategories } from '../../services/categories'
import { fetchGoals } from '../../services/goals'
import { getCurrentRate, fetchBinanceRate, fetchBCVRate } from '../../services/exchangeRates'
import { validateAmount, formatAmountInput, VALIDATION_LIMITS } from '../../utils/validation'
import { formatAmount } from '../../utils/currency'

export default function TransactionForm({ isOpen, onClose, onSave, editingTx = null }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [walletId, setWalletId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [goals, setGoals] = useState([])
  const [goalId, setGoalId] = useState('')

  // Estado para tasa de cambio (cuando es VES)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [rateType, setRateType] = useState('binance') // 'binance', 'bcv', 'libre'
  const [loadingRate, setLoadingRate] = useState(false)
  const [rateError, setRateError] = useState('')

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchWallets(), fetchCategories(), fetchGoals()])
        .then(([w, c, g]) => {
          setWallets(w)
          setCategories(c)
          setGoals(g.filter(goal => goal.is_active))
          if (!editingTx && w.length > 0) setWalletId(w[0].id)
        })
        .catch((err) => console.error('Error cargando datos del formulario:', err))

      if (editingTx) {
        setType(editingTx.type)
        setAmount(String(editingTx.amount))
        setWalletId(editingTx.wallet_id)
        setCategoryId(editingTx.category_id || '')
        setGoalId(editingTx.goal_id || '')
        setDescription(editingTx.description || '')
        setDate(editingTx.date.split('T')[0])
        if (editingTx.exchange_rate) {
          setExchangeRate(editingTx.exchange_rate)
          setRateType('libre')
        } else {
          setExchangeRate(null)
          setRateType('binance')
        }
      } else {
        setAmount('')
        setDescription('')
        setDate(new Date().toISOString().split('T')[0])
        setGoalId('')
        setExchangeRate(null)
        setRateType('binance')
      }
      setError('')
      setRateError('')
    }
  }, [isOpen])

  // Cargar tasa de cambio según el tipo seleccionado (binance, bcv, libre)
  useEffect(() => {
    async function loadRate() {
      const wallet = wallets.find((w) => w.id === walletId)

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

    if (walletId && wallets.length > 0) {
      loadRate()
    }
  }, [walletId, wallets, rateType])

  // Billetera seleccionada
  const selectedWallet = wallets.find((w) => w.id === walletId)

  // Filtrar categorias por tipo seleccionado (memoizado para evitar re-renders infinitos)
  // Para 'savings', usamos categorías de 'expense' ya que técnicamente es dinero que sale
  const filteredCategories = useMemo(
    () => {
      const targetType = type === 'savings' ? 'expense' : type
      return categories.filter((c) => c.type === targetType)
    },
    [categories, type]
  )

  // Reset categoria cuando cambia el tipo
  useEffect(() => {
    const valid = filteredCategories.find((c) => c.id === categoryId)
    if (!valid && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id)
    }
  }, [type, filteredCategories])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validar monto
    const amountValidation = validateAmount(amount)
    if (!amountValidation.valid) {
      setError(amountValidation.error)
      return
    }

    if (!walletId) {
      setError('Selecciona una billetera')
      return
    }
    if (!categoryId) {
      setError('Selecciona una categoría')
      return
    }

    // Validar descripción (opcional pero con límite)
    if (description.trim().length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      setError(`La descripción no puede tener más de ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} caracteres`)
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
      await onSave({
        wallet_id: walletId,
        category_id: type === 'savings' ? null : categoryId,
        type,
        amount: amountValidation.value,
        description: description.trim(),
        date: new Date(date + 'T12:00:00').toISOString(),
        exchange_rate: selectedWallet?.currency === 'VES' ? exchangeRate : null,
        goal_id: type === 'savings' ? (goalId || null) : null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular equivalente en USD
  const amountNum = parseFloat(amount) || 0
  const amountUsd = selectedWallet?.currency === 'VES' && exchangeRate > 0
    ? (amountNum / exchangeRate).toFixed(2)
    : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTx ? 'Editar Transacción' : 'Nueva Transacción'}>
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                type === 'expense'
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType('savings')}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                type === 'savings'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-300 dark:border-indigo-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Ahorro
            </button>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label htmlFor="tx-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto {selectedWallet ? `(${selectedWallet.currency})` : ''}
          </label>
          <input
            id="tx-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            max={VALIDATION_LIMITS.AMOUNT_MAX_VALUE}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Máximo: {VALIDATION_LIMITS.AMOUNT_MAX_VALUE.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
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
                  inputMode="decimal"
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

        {/* Billetera */}
        <div>
          <label htmlFor="tx-wallet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Billetera
          </label>
          {wallets.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">Debes crear al menos una billetera primero</p>
          ) : (
            <select
              id="tx-wallet"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.currency})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Categoría (no aplica para ahorros) */}
        {type !== 'savings' && (
          <div>
            <label htmlFor="tx-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No hay categorías de {type === 'expense' ? 'gastos' : 'ingresos'}
              </p>
            ) : (
              <select
                id="tx-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Meta de Ahorro (solo para ahorros) */}
        {type === 'savings' && (
          <div>
            <label htmlFor="tx-goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meta de Ahorro <span className="text-red-500">*</span>
            </label>
            {goals.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                No tienes metas activas. Crea una meta primero en la sección de Metas de Ahorro.
              </p>
            ) : (
              <>
                <select
                  id="tx-goal"
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una meta</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (${formatAmount(g.target_amount)})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  El monto será apartado de tu billetera y sumado al progreso de esta meta
                </p>
              </>
            )}
          </div>
        )}

        {/* Descripción */}
        <div>
          <label htmlFor="tx-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="tx-desc"
            type="text"
            maxLength={VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Almuerzo, Pago de luz..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {description.length}/{VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} caracteres
          </p>
        </div>

        {/* Fecha */}
        <div>
          <label htmlFor="tx-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha
          </label>
          <input
            id="tx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
            disabled={
              loading ||
              wallets.length === 0 ||
              (type !== 'savings' && filteredCategories.length === 0) ||
              (type === 'savings' && goals.length === 0)
            }
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : editingTx ? 'Guardar cambios' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
