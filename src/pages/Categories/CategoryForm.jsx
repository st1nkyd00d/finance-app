import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import { validateTextLength, VALIDATION_LIMITS } from '../../utils/validation'

const COLORS = [
  { hex: '#ef4444', name: 'Rojo' },
  { hex: '#f97316', name: 'Naranja' },
  { hex: '#f59e0b', name: 'Ambar' },
  { hex: '#eab308', name: 'Amarillo' },
  { hex: '#84cc16', name: 'Lima' },
  { hex: '#22c55e', name: 'Verde' },
  { hex: '#10b981', name: 'Esmeralda' },
  { hex: '#14b8a6', name: 'Turquesa' },
  { hex: '#06b6d4', name: 'Celeste' },
  { hex: '#3b82f6', name: 'Azul' },
  { hex: '#6366f1', name: 'Indigo' },
  { hex: '#8b5cf6', name: 'Violeta' },
  { hex: '#a855f7', name: 'Purpura' },
  { hex: '#d946ef', name: 'Fucsia' },
  { hex: '#ec4899', name: 'Rosa' },
  { hex: '#6b7280', name: 'Gris' },
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
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(c.hex)}
                aria-label={c.name}
                aria-pressed={color === c.hex}
                className={`w-8 h-8 rounded-full transition-transform ${
                  color === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex }}
              />
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
