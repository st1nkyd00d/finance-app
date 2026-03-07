import { useState, useEffect } from 'react'
import { HiPlus, HiXMark, HiCheck } from 'react-icons/hi2'
import { fetchStores, createStore } from '../../services/stores'

const NEW_STORE_VALUE = '__new__'

/**
 * Selector de tienda reutilizable.
 * Props:
 *   value       — nombre de tienda seleccionado (string)
 *   onChange    — callback(name: string)
 *   required    — boolean
 *   placeholder — string
 */
export default function StoreSelector({ value, onChange, required = false, placeholder = 'Seleccionar tienda...' }) {
  const [stores, setStores] = useState([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoadingStores(true)
    fetchStores()
      .then((data) => { if (!cancelled) setStores(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingStores(false) })
    return () => { cancelled = true }
  }, [])

  function handleSelectChange(e) {
    const val = e.target.value
    if (val === NEW_STORE_VALUE) {
      setCreatingNew(true)
      setNewName('')
      setCreateError('')
    } else {
      onChange(val)
    }
  }

  async function handleCreateStore() {
    if (!newName.trim()) { setCreateError('Escribe un nombre'); return }
    setCreating(true)
    setCreateError('')
    try {
      const store = await createStore({ name: newName.trim() })
      setStores((prev) => [...prev, store].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(store.name)
      setCreatingNew(false)
      setNewName('')
    } catch (err) {
      setCreateError(err.message || 'Error al crear tienda')
    } finally {
      setCreating(false)
    }
  }

  function cancelNew() {
    setCreatingNew(false)
    setNewName('')
    setCreateError('')
  }

  // ── Inline create mode ──
  if (creatingNew) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateStore() } }}
            maxLength={200}
            placeholder="Nombre de la tienda..."
            autoFocus
            className="flex-1 px-3 py-2 border border-indigo-400 dark:border-indigo-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          />
          <button
            type="button"
            onClick={handleCreateStore}
            disabled={creating}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <HiCheck className="w-4 h-4" />
            {creating ? '...' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={cancelNew}
            className="px-2 py-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <HiXMark className="w-4 h-4" />
          </button>
        </div>
        {createError && <p className="text-xs text-red-500">{createError}</p>}
      </div>
    )
  }

  // ── Normal select mode ──
  return (
    <select
      value={value || ''}
      onChange={handleSelectChange}
      required={required}
      disabled={loadingStores}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
    >
      <option value="" disabled>
        {loadingStores ? 'Cargando...' : placeholder}
      </option>

      {stores.map((s) => (
        <option key={s.id} value={s.name}>{s.name}</option>
      ))}

      {stores.length > 0 && <option disabled>──────────────</option>}

      <option value={NEW_STORE_VALUE}>+ Nueva tienda...</option>
    </select>
  )
}
