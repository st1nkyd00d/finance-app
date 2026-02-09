import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import CurrencyCalculator from '../../pages/ExchangeRates/CurrencyCalculator'
import { HiBars3, HiCalculator } from 'react-icons/hi2'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:block`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Header móvil */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <HiBars3 className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Finance App</h1>
            <div className="w-10" /> {/* Spacer para centrar título */}
          </div>
        </header>

        {/* Content */}
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Botón flotante de calculadora */}
      <button
        onClick={() => setShowCalculator(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        title="Calculadora de conversión"
      >
        <HiCalculator className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      {/* Modal de calculadora */}
      <CurrencyCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />
    </div>
  )
}
