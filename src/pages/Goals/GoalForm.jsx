import { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal'

export default function GoalForm({ isOpen, onClose, onSave, initialData }) {
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEdit = !!initialData

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '')
        setTargetAmount(initialData.target_amount?.toString() || '')
        setDescription(initialData.description || '')
        setDeadline(initialData.deadline || '')
      } else {
        setName('')
        setTargetAmount('')
        setDescription('')
        setDeadline('')
      }
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validations
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    if (name.length > 100) {
      setError('El nombre no puede exceder 100 caracteres')
      return
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('El monto objetivo debe ser mayor a 0')
      return
    }
    if (description && description.length > 500) {
      setError('La descripción no puede exceder 500 caracteres')
      return
    }
    if (deadline) {
      const deadlineDate = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (deadlineDate < today) {
        setError('La fecha límite debe ser hoy o en el futuro')
        return
      }
    }

    setIsSubmitting(true)

    try {
      await onSave({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        description: description.trim() || null,
        deadline: deadline || null,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Error al guardar la meta')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="goal-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="Ej: Vacaciones, Auto nuevo, Fondo de emergencia"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{name.length}/100 caracteres</p>
        </div>

        {/* Target Amount */}
        <div>
          <label htmlFor="goal-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Monto Objetivo (USD) <span className="text-red-500">*</span>
          </label>
          <input
            id="goal-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Todas las metas se manejan en USD</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción (Opcional)
          </label>
          <textarea
            id="goal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Agrega detalles sobre esta meta..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description.length}/500 caracteres</p>
        </div>

        {/* Deadline */}
        <div>
          <label htmlFor="goal-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Límite (Opcional)
          </label>
          <input
            id="goal-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={today}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Opcional: establece una fecha objetivo</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Meta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
