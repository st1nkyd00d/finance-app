import { HiPencilSquare, HiTrash } from 'react-icons/hi2'

export default function CategoryItem({ category, onEdit, onDelete }) {
  return (
    <div className="flex items-center justify-between py-3 px-4">
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full shrink-0"
          style={{ backgroundColor: category.color || '#6366f1' }}
        />
        <span className="text-sm font-medium text-gray-900 dark:text-white">{category.name}</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          aria-label="Editar categoria"
          title="Editar"
        >
          <HiPencilSquare className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          aria-label="Eliminar categoria"
          title="Eliminar"
        >
          <HiTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
