import { memo } from 'react'
import { HiTag, HiPlus, HiPencil, HiTrash, HiDocumentDuplicate } from 'react-icons/hi2'
import { usePrivacy } from '../../contexts/PrivacyContext'
import { formatAmount, CURRENCY_SYMBOLS } from '../../utils/currency'
import { getTimeAgo } from '../../utils/date'

const ProductCard = memo(function ProductCard({ product, onEdit, onDelete, onDuplicate, onAddPrice, onEditPrice, onDeletePrice }) {
  const { balancesHidden } = usePrivacy()
  const prices = [...(product.prices || [])].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
  )

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <HiTag className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{product.name}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              {product.brand && (
                <span className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded font-medium">
                  {product.brand}
                </span>
              )}
              {product.unit && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{product.unit}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onDuplicate(product)}
            className="p-1.5 text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
            title="Duplicar con otra marca"
          >
            <HiDocumentDuplicate className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            title="Editar producto"
          >
            <HiPencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Eliminar producto"
          >
            <HiTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {product.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">{product.notes}</p>
      )}

      {/* Prices list */}
      <div className="flex flex-col gap-2">
        {prices.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Sin precios registrados</p>
        ) : (
          prices.map((p) => (
            <div
              key={p.id}
              className="bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 flex flex-col gap-1"
            >
              {/* Store name + actions */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{p.store_name}</p>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => onEditPrice(product, p)}
                    className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    title="Editar precio"
                  >
                    <HiPencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePrice(product, p)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Eliminar precio"
                  >
                    <HiTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {/* Prices row */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {balancesHidden
                    ? '••••'
                    : `${CURRENCY_SYMBOLS[p.currency] || p.currency} ${formatAmount(p.price)}`}
                </span>
                {!balancesHidden && p.price_usd != null && p.currency !== 'USD' && p.currency !== 'USDT' && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    ≈ ${formatAmount(p.price_usd)}
                  </span>
                )}
              </div>
              {/* Timestamp */}
              <p className="text-xs text-gray-400 dark:text-gray-500">Act. {getTimeAgo(p.updated_at)}</p>
            </div>
          ))
        )}
      </div>

      {/* Add price */}
      <button
        onClick={() => onAddPrice(product)}
        className="flex items-center justify-center gap-1.5 w-full py-2 text-sm text-indigo-600 dark:text-indigo-400 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
      >
        <HiPlus className="w-4 h-4" />
        Agregar precio
      </button>
    </div>
  )
})

export default ProductCard
