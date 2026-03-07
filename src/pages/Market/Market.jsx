import { useState } from 'react'
import { HiShoppingCart, HiTag, HiBuildingStorefront } from 'react-icons/hi2'
import ShoppingLists from './ShoppingLists'
import ProductCatalog from './ProductCatalog'
import StoreList from './StoreList'

const TABS = [
  { id: 'lists', label: 'Listas de Compra', icon: HiShoppingCart },
  { id: 'catalog', label: 'Catálogo', icon: HiTag },
  { id: 'stores', label: 'Tiendas', icon: HiBuildingStorefront },
]

export default function Market() {
  const [activeTab, setActiveTab] = useState('lists')

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <HiShoppingCart className="w-8 h-8 text-indigo-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-rpg tracking-wide">
            MERCADO
          </h1>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Controla precios de productos y organiza tus compras
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl mb-6 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'lists' && <ShoppingLists />}
      {activeTab === 'catalog' && <ProductCatalog />}
      {activeTab === 'stores' && <StoreList />}
    </div>
  )
}
