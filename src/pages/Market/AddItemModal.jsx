import { useState, useEffect, useRef, useCallback } from 'react'
import Modal from '../../components/ui/Modal'
import StoreSelector from './StoreSelector'
import { searchProducts } from '../../services/products'
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/currency'

const CURRENCIES = ['VES', 'USD', 'USDT']

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function AddItemModal({ isOpen, onClose, onAdd, listId }) {
  const [mode, setMode] = useState('catalog') // 'catalog' | 'adhoc'

  // Catalog search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedPrice, setSelectedPrice] = useState(null)

  // Form fields (shared between both modes)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('VES')
  const [storeName, setStoreName] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const debouncedQuery = useDebounce(query, 300)
  const searchRef = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  useEffect(() => {
    if (mode !== 'catalog' || !debouncedQuery.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    searchProducts(debouncedQuery).then((data) => {
      if (!cancelled) {
        setResults(data)
        setSearching(false)
      }
    }).catch(() => {
      if (!cancelled) setSearching(false)
    })
    return () => { cancelled = true }
  }, [debouncedQuery, mode])

  function resetForm() {
    setMode('catalog')
    setQuery('')
    setResults([])
    setSelectedProduct(null)
    setSelectedPrice(null)
    setName('')
    setQuantity('1')
    setUnit('')
    setPrice('')
    setCurrency('VES')
    setStoreName('')
    setNotes('')
    setError('')
  }

  function selectPrice(product, priceObj) {
    setSelectedProduct(product)
    setSelectedPrice(priceObj)
    // Pre-fill name including brand for clarity in the list (e.g. "Harina PAN")
    setName(product.brand ? `${product.name} ${product.brand}` : product.name)
    setUnit(product.unit || '')
    if (priceObj) {
      setPrice(String(priceObj.price))
      setCurrency(priceObj.currency)
      setStoreName(priceObj.store_name)
    }
    setQuery('')
    setResults([])
  }

  function clearSelection() {
    setSelectedProduct(null)
    setSelectedPrice(null)
    setName('')
    setUnit('')
    setPrice('')
    setCurrency('VES')
    setStoreName('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const itemName = name.trim()
    if (!itemName) { setError('El nombre del ítem es obligatorio'); return }
    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) { setError('La cantidad debe ser mayor a 0'); return }

    setLoading(true)
    setError('')
    try {
      const priceNum = price !== '' ? parseFloat(price) : null
      await onAdd({
        list_id: listId,
        name: itemName,
        quantity: qty,
        unit: unit.trim() || null,
        price: priceNum != null && !isNaN(priceNum) ? priceNum : null,
        currency: priceNum != null ? currency : null,
        store_name: storeName.trim() || null,
        notes: notes.trim() || null,
        product_id: selectedProduct?.id || null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al agregar ítem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar Ítem">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
        {[['catalog', 'Buscar en Catálogo'], ['adhoc', 'Ítem Libre']].map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); clearSelection(); setQuery(''); setResults([]) }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === m
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {/* Catalog search */}
        {mode === 'catalog' && !selectedProduct && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Buscar producto
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Escribe para buscar..."
              autoFocus
            />
            {searching && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
            {results.length > 0 && (
              <div className="mt-2 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                {results.map((product) => (
                  <div key={product.id}>
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">
                        {product.name}
                        {product.unit && <span className="text-xs text-gray-400 ml-1">({product.unit})</span>}
                      </p>
                      {product.brand && (
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium shrink-0">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    {(product.prices || []).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPrice(product, p)}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center justify-between border-t border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">{p.store_name}</span>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          {CURRENCY_SYMBOLS[p.currency] || p.currency} {formatAmount(p.price)}
                        </span>
                      </button>
                    ))}
                    {(product.prices || []).length === 0 && (
                      <button
                        type="button"
                        onClick={() => selectPrice(product, null)}
                        className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-t border-gray-100 dark:border-gray-700"
                      >
                        <span className="text-sm text-gray-500 dark:text-gray-400 italic">Sin precios — agregar sin precio</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!searching && query.trim() && results.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">Sin resultados. Prueba "Ítem Libre".</p>
            )}
          </div>
        )}

        {/* Selected product banner */}
        {mode === 'catalog' && selectedProduct && (
          <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">{selectedProduct.name}</p>
                {selectedProduct.brand && (
                  <span className="text-xs bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                    {selectedProduct.brand}
                  </span>
                )}
              </div>
              {selectedPrice && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400">{selectedPrice.store_name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Cambiar
            </button>
          </div>
        )}

        {/* Shared fields — always visible once product selected or in adhoc mode */}
        {(mode === 'adhoc' || selectedProduct) && (
          <>
            {mode === 'adhoc' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: Arroz, Leche..."
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-3">
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.001"
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="kg, lt, unid..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="any"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Opcional"
                />
              </div>
              <div className="w-24">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tienda</label>
              <StoreSelector
                value={storeName}
                onChange={setStoreName}
                placeholder="Seleccionar tienda (opcional)..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Opcional"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {(mode === 'adhoc' || selectedProduct) && (
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Agregando...' : 'Agregar'}
            </button>
          )}
        </div>
      </form>
    </Modal>
  )
}
