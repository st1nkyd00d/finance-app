import { useState, useEffect, useCallback } from 'react'
import { fetchCurrentRates, setRate, fetchBinanceRate, fetchBCVRate, fetchUSDTRate, deleteRate } from '../../services/exchangeRates'
import RateCard from './RateCard'
import RateForm from './RateForm'
import RateHistory from './RateHistory'
import CurrencyManager from './CurrencyManager'
import CurrencyCalculator from './CurrencyCalculator'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function ExchangeRates() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formPair, setFormPair] = useState(null)
  const [historyPair, setHistoryPair] = useState(null)
  const [showCurrencyManager, setShowCurrencyManager] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [rateToDelete, setRateToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [binanceLoading, setBinanceLoading] = useState(false)
  const [bcvLoading, setBcvLoading] = useState(false)
  const [usdtLoading, setUsdtLoading] = useState(false)

  const loadRates = useCallback(async () => {
    try {
      setError('')
      const data = await fetchCurrentRates()
      setRates(data)
    } catch (err) {
      setError('Error al cargar tasas: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRates()
  }, [loadRates])

  async function handleSaveRate(rateData) {
    await setRate(rateData)
    await loadRates()
  }

  function handleUpdateClick(pair) {
    setFormPair(pair)
    setShowForm(true)
  }

  function handleOpenCreate() {
    setFormPair(null)
    setShowForm(true)
  }

  function handleDeleteRate(rate) {
    setRateToDelete(rate)
    setShowDeleteConfirm(true)
  }

  async function confirmDeleteRate() {
    if (!rateToDelete) return

    setDeleteLoading(true)
    setError('')
    try {
      await deleteRate(rateToDelete.id)
      setShowDeleteConfirm(false)
      setRateToDelete(null)
      await loadRates()
    } catch (err) {
      setError('Error al eliminar tasa: ' + err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  function cancelDeleteRate() {
    setShowDeleteConfirm(false)
    setRateToDelete(null)
  }

  async function handleBinanceUpdate() {
    setBinanceLoading(true)
    setError('')
    try {
      const binanceRate = await fetchBinanceRate()
      await setRate({
        from_currency: 'USDT',
        to_currency: 'VES',
        rate: binanceRate,
        source: 'binance',
      })
      await loadRates()
    } catch (err) {
      setError(err.message)
    } finally {
      setBinanceLoading(false)
    }
  }

  async function handleBCVUpdate() {
    setBcvLoading(true)
    setError('')
    try {
      const bcvRate = await fetchBCVRate()
      await setRate({
        from_currency: 'USD',
        to_currency: 'VES',
        rate: bcvRate,
        source: 'bcv',
      })
      await loadRates()
    } catch (err) {
      setError(err.message)
    } finally {
      setBcvLoading(false)
    }
  }

  async function handleUSDTUpdate() {
    setUsdtLoading(true)
    setError('')
    try {
      const usdtRate = await fetchUSDTRate()
      await setRate({
        from_currency: 'USDT',
        to_currency: 'USD',
        rate: usdtRate,
        source: 'coingecko',
      })
      await loadRates()
    } catch (err) {
      setError(err.message)
    } finally {
      setUsdtLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasas de Cambio</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCurrencyManager(true)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            title="Gestionar monedas disponibles"
          >
            Monedas
          </button>
          <button
            onClick={() => setShowCalculator(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            title="Calculadora de conversión"
          >
            Calculadora
          </button>
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Nueva Tasa
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Tasas actuales */}
      {rates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No hay tasas registradas</p>
          <button
            onClick={handleOpenCreate}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium text-sm"
          >
            Agregar tu primera tasa
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {rates.map((rate) => (
              <RateCard
                key={rate.id}
                rate={rate}
                onUpdate={handleUpdateClick}
                onDelete={handleDeleteRate}
              />
            ))}
          </div>

          {/* Historial links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Historial</h2>
            <div className="flex flex-wrap gap-2">
              {rates.map((rate) => (
                <button
                  key={rate.id}
                  onClick={() => setHistoryPair({ from: rate.from_currency, to: rate.to_currency })}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg font-medium transition-colors"
                >
                  {rate.from_currency}/{rate.to_currency}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Acciones rapidas */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Actualizar desde fuentes externas</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleBCVUpdate}
            disabled={bcvLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
          >
            {bcvLoading ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
              </svg>
            )}
            {bcvLoading ? 'Consultando...' : 'USD/VES desde BCV'}
          </button>
          <button
            onClick={handleBinanceUpdate}
            disabled={binanceLoading}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors disabled:opacity-50"
          >
            {binanceLoading ? (
              <div className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            )}
            {binanceLoading ? 'Consultando...' : 'USDT/VES desde Binance P2P'}
          </button>
          <button
            onClick={handleUSDTUpdate}
            disabled={usdtLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
          >
            {usdtLoading ? (
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {usdtLoading ? 'Consultando...' : 'USDT/USD desde Binance'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          BCV: Tasa oficial del Banco Central de Venezuela. Binance P2P: Promedio de ofertas. Binance Spot: Precio del mercado.
        </p>
      </div>

      {/* Modal formulario */}
      <RateForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSaveRate}
        defaultPair={formPair}
      />

      {/* Modal historial */}
      <RateHistory
        isOpen={!!historyPair}
        onClose={() => setHistoryPair(null)}
        pair={historyPair}
      />

      {/* Modal gestión de monedas */}
      <CurrencyManager
        isOpen={showCurrencyManager}
        onClose={() => setShowCurrencyManager(false)}
      />

      {/* Modal calculadora */}
      <CurrencyCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
      />

      {/* Modal confirmación de eliminación */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={cancelDeleteRate}
        onConfirm={confirmDeleteRate}
        title="Eliminar Tasa de Cambio"
        message={rateToDelete ? `¿Estás seguro de que deseas eliminar la tasa ${rateToDelete.from_currency}/${rateToDelete.to_currency}? Esta acción no se puede deshacer.` : ''}
        confirmText="Eliminar"
        loading={deleteLoading}
      />
    </div>
  )
}
