import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import StoreSelector from './StoreSelector'

const CURRENCIES = ['VES', 'USD', 'USDT']

export default function PriceForm({ isOpen, onClose, onSave, initialData, productName }) {
  const [storeName, setStoreName] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('VES')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStoreName(initialData?.store_name || '')
      setPrice(initialData?.price != null ? String(initialData.price) : '')
      setCurrency(initialData?.currency || 'VES')
      setError('')
    }
  }, [isOpen, initialData])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!storeName.trim()) { setError('Selecciona o crea una tienda'); return }
    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum < 0) { setError('El precio debe ser un número válido'); return }
    setLoading(true)
    setError('')
    try {
      await onSave({ store_name: storeName.trim(), price: priceNum, currency })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Editar Precio' : 'Agregar Precio'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {productName && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Producto: <span className="font-medium text-gray-800 dark:text-gray-200">{productName}</span>
          </p>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tienda <span className="text-red-500">*</span>
          </label>
          <StoreSelector
            value={storeName}
            onChange={setStoreName}
            required
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Precio <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="any"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="0.00"
            />
          </div>
          <div className="w-28">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
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
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
