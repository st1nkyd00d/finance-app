import { useState, useEffect, useMemo } from 'react'
import Modal from '../../components/ui/Modal'
import { fetchWallets } from '../../services/wallets'
import { fetchCategories } from '../../services/categories'
import { getCurrentRate } from '../../services/exchangeRates'

export default function TransactionForm({ isOpen, onClose, onSave }) {
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

  // Estado para tasa de cambio (cuando es VES)
  const [exchangeRate, setExchangeRate] = useState(null)
  const [editingRate, setEditingRate] = useState(false)
  const [rateSource, setRateSource] = useState(null)

  useEffect(() => {
    if (isOpen) {
      Promise.all([fetchWallets(), fetchCategories()])
        .then(([w, c]) => {
          setWallets(w)
          setCategories(c)
          if (w.length > 0 && !walletId) setWalletId(w[0].id)
        })
        .catch((err) => console.error('Error cargando datos del formulario:', err))

      setAmount('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setError('')
      setExchangeRate(null)
      setEditingRate(false)
      setRateSource(null)
    }
  }, [isOpen])

  // Cargar tasa de cambio cuando la billetera es VES
  useEffect(() => {
    async function loadRate() {
      const wallet = wallets.find((w) => w.id === walletId)
      if (wallet?.currency === 'VES') {
        const rateData = await getCurrentRate('USDT', 'VES')
        if (rateData) {
          setExchangeRate(rateData.rate)
          setRateSource(rateData.source)
        }
      } else {
        setExchangeRate(null)
        setRateSource(null)
      }
      setEditingRate(false)
    }
    if (walletId && wallets.length > 0) {
      loadRate()
    }
  }, [walletId, wallets])

  // Billetera seleccionada
  const selectedWallet = wallets.find((w) => w.id === walletId)

  // Filtrar categorias por tipo seleccionado (memoizado para evitar re-renders infinitos)
  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
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

    const amountNum = parseFloat(amount)
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Ingresa un monto valido mayor a 0')
      return
    }
    if (!walletId) {
      setError('Selecciona una billetera')
      return
    }
    if (!categoryId) {
      setError('Selecciona una categoria')
      return
    }
    if (selectedWallet?.currency === 'VES' && (!exchangeRate || exchangeRate <= 0)) {
      setError('La tasa de cambio debe ser mayor a 0 para billeteras VES')
      return
    }

    setLoading(true)
    try {
      await onSave({
        wallet_id: walletId,
        category_id: categoryId,
        type,
        amount: amountNum,
        description,
        date: new Date(date + 'T12:00:00').toISOString(),
        exchange_rate: selectedWallet?.currency === 'VES' ? exchangeRate : null,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva Transaccion">
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
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
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                type === 'income'
                  ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              Ingreso
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
            step="any"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>

        {/* Conversión a USD (solo para VES) */}
        {selectedWallet?.currency === 'VES' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 dark:text-blue-300">Equivalente en USD</span>
              {amountUsd && (
                <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  ${amountUsd}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-600 dark:text-blue-400">
                Tasa {rateSource === 'binance' ? 'Binance' : rateSource === 'bcv' ? 'BCV' : 'manual'}:
              </span>
              {editingRate ? (
                <input
                  type="number"
                  step="any"
                  value={exchangeRate || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    setExchangeRate(val > 0 ? val : null)
                  }}
                  className="w-24 px-2 py-1 text-sm border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {exchangeRate ? exchangeRate.toLocaleString('es-VE') : 'No disponible'}
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditingRate(!editingRate)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
              >
                {editingRate ? 'Listo' : 'Editar'}
              </button>
            </div>

            {!exchangeRate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No hay tasa registrada. Ve a Tasas de Cambio para agregar una.
              </p>
            )}
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

        {/* Categoria */}
        <div>
          <label htmlFor="tx-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Categoria
          </label>
          {filteredCategories.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              No hay categorias de {type === 'expense' ? 'gastos' : 'ingresos'}
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

        {/* Descripcion */}
        <div>
          <label htmlFor="tx-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripcion <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="tx-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Almuerzo, Pago de luz..."
          />
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
            disabled={loading || wallets.length === 0 || filteredCategories.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
