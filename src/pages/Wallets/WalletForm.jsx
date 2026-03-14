import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { validateTextLength, VALIDATION_LIMITS } from '../../utils/validation'

const CURRENCIES = [
  { value: 'VES', label: 'VES - Bolivares' },
  { value: 'USD', label: 'USD - Dolares' },
  { value: 'USDT', label: 'USDT - Tether' },
]

export default function WalletForm({ isOpen, onClose, onSave, wallet = null }) {
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('VES')
  const [includeInTotal, setIncludeInTotal] = useState(true)
  const [newBalance, setNewBalance] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!wallet

  useEffect(() => {
    if (wallet) {
      setName(wallet.name)
      setCurrency(wallet.currency)
      setIncludeInTotal(wallet.include_in_total)
      setNewBalance(String(wallet.balance ?? ''))
    } else {
      setName('')
      setCurrency('VES')
      setIncludeInTotal(true)
      setNewBalance('')
    }
    setError('')
  }, [wallet, isOpen])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const nameValidation = validateTextLength(name, VALIDATION_LIMITS.NAME_MAX_LENGTH, 'El nombre')
    if (!nameValidation.valid) {
      setError(nameValidation.error)
      return
    }

    setLoading(true)
    try {
      const parsedBalance = isEditing ? parseFloat(newBalance) : undefined
      if (isEditing && (isNaN(parsedBalance))) {
        setError('El balance debe ser un número válido')
        setLoading(false)
        return
      }
      await onSave({
        name: name.trim(),
        currency,
        include_in_total: includeInTotal,
        newBalance: isEditing ? parsedBalance : undefined,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Billetera' : 'Nueva Billetera'}
    >
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="wallet-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre
          </label>
          <input
            id="wallet-name"
            type="text"
            maxLength={VALIDATION_LIMITS.NAME_MAX_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Efectivo, Binance, Banco..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length}/{VALIDATION_LIMITS.NAME_MAX_LENGTH} caracteres
          </p>
        </div>

        <div>
          <label htmlFor="wallet-currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Moneda
          </label>
          <select
            id="wallet-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={isEditing}
            className={`w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {isEditing && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              La moneda no se puede cambiar después de crear la billetera
            </p>
          )}
        </div>

        {isEditing && (
          <div>
            <label htmlFor="wallet-balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Balance actual
            </label>
            <input
              id="wallet-balance"
              type="number"
              step="any"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Se creará una transacción de ajuste por la diferencia.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            id="wallet-include"
            type="checkbox"
            checked={includeInTotal}
            onChange={(e) => setIncludeInTotal(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
          />
          <label htmlFor="wallet-include" className="text-sm text-gray-700 dark:text-gray-300">
            Incluir en balance general
          </label>
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
            {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Billetera')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
