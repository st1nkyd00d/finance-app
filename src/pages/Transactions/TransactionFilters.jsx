import { useState, useEffect } from 'react'
import { fetchWallets } from '../../services/wallets'
import { fetchCategories } from '../../services/categories'
import { HiMagnifyingGlass, HiAdjustmentsHorizontal } from 'react-icons/hi2'

const TYPE_OPTIONS = [
  { value: 'expense', label: 'Gastos' },
  { value: 'income', label: 'Ingresos' },
  { value: 'transfer_out', label: 'Transferencias enviadas' },
  { value: 'transfer_in', label: 'Transferencias recibidas' },
]

const PRESETS = [
  { label: 'Hoy', getValue: () => {
    const today = new Date().toISOString().split('T')[0]
    return { dateFrom: today, dateTo: today }
  }},
  { label: 'Esta semana', getValue: () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const start = new Date(today)
    start.setDate(today.getDate() - dayOfWeek)
    return { dateFrom: start.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] }
  }},
  { label: 'Este mes', getValue: () => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    return { dateFrom: start.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] }
  }},
  { label: 'Últimos 30 días', getValue: () => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - 30)
    return { dateFrom: start.toISOString().split('T')[0], dateTo: today.toISOString().split('T')[0] }
  }},
]

export default function TransactionFilters({ filters, onChange, onClear }) {
  const [wallets, setWallets] = useState([])
  const [categories, setCategories] = useState([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(filters.search || '')

  // Debounce: propagar búsqueda después de 300ms sin teclear
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchInput.trim() || null
      if (value !== (filters.search || null)) {
        onChange({ ...filters, search: value })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Sincronizar si se limpia externamente (botón "Limpiar")
  useEffect(() => {
    if (!filters.search && searchInput) {
      setSearchInput('')
    }
  }, [filters.search])

  useEffect(() => {
    Promise.all([fetchWallets(), fetchCategories()])
      .then(([w, c]) => {
        setWallets(w)
        setCategories(c)
      })
      .catch((err) => console.error('Error cargando filtros:', err))
  }, [])

  const activeFilterCount = [
    filters.types?.length > 0,
    filters.walletIds?.length > 0,
    filters.categoryIds?.length > 0,
    filters.dateFrom,
    filters.dateTo,
    filters.search,
  ].filter(Boolean).length

  function handleTypeToggle(type) {
    const current = filters.types || []
    const updated = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type]
    onChange({ ...filters, types: updated.length > 0 ? updated : null })
  }

  function handleWalletToggle(walletId) {
    const current = filters.walletIds || []
    const updated = current.includes(walletId)
      ? current.filter((id) => id !== walletId)
      : [...current, walletId]
    onChange({ ...filters, walletIds: updated.length > 0 ? updated : null })
  }

  function handleCategoryToggle(categoryId) {
    const current = filters.categoryIds || []
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId]
    onChange({ ...filters, categoryIds: updated.length > 0 ? updated : null })
  }

  function handlePreset(preset) {
    const { dateFrom, dateTo } = preset.getValue()
    onChange({ ...filters, dateFrom, dateTo })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-4">
      {/* Search bar always visible */}
      <div className="p-4 flex items-center gap-3">
        <div className="flex-1 relative">
          <HiMagnifyingGlass className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por descripción..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            activeFilterCount > 0
              ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <HiAdjustmentsHorizontal className="w-4 h-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
          {/* Presets */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Rapido</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Desde</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Hasta</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => onChange({ ...filters, dateTo: e.target.value || null })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Types */}
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const isSelected = (filters.types || []).includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleTypeToggle(opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Wallets */}
          {wallets.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Billetera</p>
              <div className="flex flex-wrap gap-2">
                {wallets.map((w) => {
                  const isSelected = (filters.walletIds || []).includes(w.id)
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleWalletToggle(w.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {w.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Categories */}
          {categories.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Categoria</p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {categories.map((c) => {
                  const isSelected = (filters.categoryIds || []).includes(c.id)
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleCategoryToggle(c.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      {c.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
