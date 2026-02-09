import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { fetchWallets } from '../../services/wallets'
import { fetchCurrentRates } from '../../services/exchangeRates'
import { validateAmount, VALIDATION_LIMITS } from '../../utils/validation'

export default function TransferForm({ isOpen, onClose, onSave }) {
  const [fromWalletId, setFromWalletId] = useState('')
  const [toWalletId, setToWalletId] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [amountIn, setAmountIn] = useState('')
  const [conversionRate, setConversionRate] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [wallets, setWallets] = useState([])
  const [rates, setRates] = useState([])

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchWallets(), fetchCurrentRates()])
        .then(([w, r]) => {
          setWallets(w)
          setRates(r)
          if (w.length >= 2) {
            setFromWalletId(w[0].id)
            setToWalletId(w[1].id)
          }
        })
        .catch((err) => console.error('Error cargando datos de transferencia:', err))

      setAmountOut('')
      setAmountIn('')
      setConversionRate('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setError('')
    }
  }, [isOpen])

  const fromWallet = wallets.find((w) => w.id === fromWalletId)
  const toWallet = wallets.find((w) => w.id === toWalletId)
  const isSameCurrency = fromWallet && toWallet && fromWallet.currency === toWallet.currency

  // Buscar tasa actual para el par seleccionado
  useEffect(() => {
    if (fromWallet && toWallet && !isSameCurrency) {
      const rate = rates.find(
        (r) => r.from_currency === fromWallet.currency && r.to_currency === toWallet.currency
      ) || rates.find(
        (r) => r.from_currency === toWallet.currency && r.to_currency === fromWallet.currency
      )

      if (rate) {
        if (rate.from_currency === fromWallet.currency) {
          setConversionRate(String(rate.rate))
        } else {
          setConversionRate(String(Math.round((1 / rate.rate) * 1000000) / 1000000))
        }
      } else {
        setConversionRate('')
      }
    }
  }, [fromWalletId, toWalletId, rates])

  // Auto-calcular monto destino cuando cambian monto origen o tasa
  useEffect(() => {
    if (isSameCurrency) {
      setAmountIn(amountOut)
    } else if (amountOut && conversionRate) {
      const result = parseFloat(amountOut) * parseFloat(conversionRate)
      if (!isNaN(result)) {
        setAmountIn(String(Math.round(result * 100) / 100))
      }
    }
  }, [amountOut, conversionRate, isSameCurrency])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (fromWalletId === toWalletId) {
      setError('Las billeteras deben ser diferentes')
      return
    }

    const outValidation = validateAmount(amountOut)
    if (!outValidation.valid) {
      setError(`Monto de salida: ${outValidation.error}`)
      return
    }

    const inValidation = validateAmount(amountIn)
    if (!inValidation.valid) {
      setError(`Monto de entrada: ${inValidation.error}`)
      return
    }

    if (isSameCurrency && outValidation.value !== inValidation.value) {
      setError('Los montos deben ser iguales para billeteras de la misma moneda')
      return
    }

    // Validar descripción (opcional pero con límite)
    if (description.trim().length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      setError(`La descripción no puede tener más de ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} caracteres`)
      return
    }

    setLoading(true)
    try {
      await onSave({
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount_out: outValidation.value,
        amount_in: inValidation.value,
        conversion_rate: !isSameCurrency && conversionRate ? parseFloat(conversionRate) : null,
        description: description.trim(),
        date: new Date(date + 'T12:00:00').toISOString(),
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transferencia entre Billeteras">
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {wallets.length < 2 ? (
        <p className="text-amber-600 dark:text-amber-400 text-sm">Necesitas al menos 2 billeteras para hacer una transferencia.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Billetera origen */}
          <div>
            <label htmlFor="tf-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Desde
            </label>
            <select
              id="tf-from"
              value={fromWalletId}
              onChange={(e) => setFromWalletId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
              ))}
            </select>
          </div>

          {/* Monto salida */}
          <div>
            <label htmlFor="tf-amount-out" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto que sale {fromWallet ? `(${fromWallet.currency})` : ''}
            </label>
            <input
              id="tf-amount-out"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={VALIDATION_LIMITS.AMOUNT_MAX_VALUE}
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Flecha */}
          <div className="flex justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
            </svg>
          </div>

          {/* Billetera destino */}
          <div>
            <label htmlFor="tf-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Hacia
            </label>
            <select
              id="tf-to"
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
              ))}
            </select>
          </div>

          {/* Tasa de conversion (solo si monedas diferentes) */}
          {!isSameCurrency && fromWallet && toWallet && (
            <div>
              <label htmlFor="tf-rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tasa (1 {fromWallet.currency} = ? {toWallet.currency})
              </label>
              <input
                id="tf-rate"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                value={conversionRate}
                onChange={(e) => setConversionRate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Tasa de conversión"
              />
              {conversionRate && (
                <p className="text-xs text-gray-400 mt-1">
                  Tasa cargada automáticamente. Puedes editarla.
                </p>
              )}
            </div>
          )}

          {/* Monto entrada */}
          <div>
            <label htmlFor="tf-amount-in" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto que entra {toWallet ? `(${toWallet.currency})` : ''}
            </label>
            <input
              id="tf-amount-in"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max={VALIDATION_LIMITS.AMOUNT_MAX_VALUE}
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              disabled={isSameCurrency}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400"
              placeholder="0.00"
            />
            {isSameCurrency && (
              <p className="text-xs text-gray-400 mt-1">Misma moneda: el monto es igual.</p>
            )}
          </div>

          {/* Descripcion */}
          <div>
            <label htmlFor="tf-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripcion <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="tf-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Ej: Cambio de USDT a Bs"
            />
          </div>

          {/* Fecha */}
          <div>
            <label htmlFor="tf-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha
            </label>
            <input
              id="tf-date"
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
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Transfiriendo...' : 'Transferir'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
