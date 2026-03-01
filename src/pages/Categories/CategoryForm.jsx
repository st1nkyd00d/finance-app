import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { validateTextLength, VALIDATION_LIMITS } from '../../utils/validation'

// Colores agrupados por familia (max 8 por fila para evitar wraps parciales)
const COLOR_GROUPS = [
  // Rojos y rosas
  ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#fda4af', '#fb7185', '#f43f5e', '#e11d48'],
  // Naranjas
  ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'],
  // Amarillos y ambar
  ['#fef08a', '#fde047', '#facc15', '#eab308', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
  // Lima y verde
  ['#d9f99d', '#bef264', '#a3e635', '#84cc16', '#65a30d', '#4ade80', '#22c55e', '#16a34a'],
  // Esmeralda y teal
  ['#6ee7b7', '#34d399', '#10b981', '#059669', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488'],
  // Cian y azul cielo
  ['#a5f3fc', '#67e8f9', '#22d3ee', '#06b6d4', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7'],
  // Azul
  ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
  // Indigo y violeta
  ['#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#a78bfa', '#8b5cf6', '#7c3aed'],
  // Purpura y fucsia
  ['#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#f0abfc', '#e879f9', '#d946ef', '#9333ea'],
  // Rosa caliente
  ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d'],
  // Tierra y marron
  ['#fef3c7', '#fde68a', '#fbbf24', '#d97706', '#a16207', '#92400e', '#78350f', '#713f12'],
  // Neutros
  ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937'],
]

export default function CategoryForm({ isOpen, onClose, onSave, category = null, defaultType = 'expense' }) {
  const [name, setName] = useState('')
  const [type, setType] = useState(defaultType)
  const [color, setColor] = useState('#6366f1')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!category

  useEffect(() => {
    if (category) {
      setName(category.name)
      setType(category.type)
      setColor(category.color || '#6366f1')
    } else {
      setName('')
      setType(defaultType)
      setColor('#6366f1')
    }
    setError('')
  }, [category, isOpen, defaultType])

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
      const data = { name: name.trim(), color }
      if (!isEditing) {
        data.type = type
      }
      await onSave(data)
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
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
    >
      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cat-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre
          </label>
          <input
            id="cat-name"
            type="text"
            maxLength={VALIDATION_LIMITS.NAME_MAX_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Ej: Comida, Transporte..."
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {name.length}/{VALIDATION_LIMITS.NAME_MAX_LENGTH} caracteres
          </p>
        </div>

        {!isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo
            </label>
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
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Color
          </label>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {COLOR_GROUPS.map((group, i) => (
              <div key={i} className="flex flex-wrap gap-1.5">
                {group.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setColor(hex)}
                    aria-label={hex}
                    aria-pressed={color === hex}
                    className={`w-7 h-7 rounded-full transition-transform shrink-0 ${
                      color === hex ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            ))}
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
            {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Categoría')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
