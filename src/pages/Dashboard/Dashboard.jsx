import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchWallets } from '../../services/wallets'
import { fetchTransactions } from '../../services/transactions'
import { fetchBudgetsWithSpending } from '../../services/budgets'
import { processRecurringTransactions } from '../../services/recurring'
import { fetchCurrentRates } from '../../services/exchangeRates'
import useCurrencyConvert from '../../hooks/useCurrencyConvert'
import { getTxAmountUsd, CURRENCY_SYMBOLS, formatAmount } from '../../utils/currency'
import { HiArrowPath, HiExclamationTriangle, HiCheckCircle } from 'react-icons/hi2'

const DISPLAY_CURRENCIES = ['USD', 'VES', 'USDT']

export default function Dashboard() {
  const [wallets, setWallets] = useState([])
  const [recentTx, setRecentTx] = useState([])
  const [monthStats, setMonthStats] = useState({ income: 0, expense: 0 })
  const [budgetAlerts, setBudgetAlerts] = useState([])
  const [recurringProcessed, setRecurringProcessed] = useState(0)
  const [displayCurrency, setDisplayCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)

  const { rates, convert, getOldestRateDate, reload: reloadRates } = useCurrencyConvert()

  const recurringRan = useRef(false)

  useEffect(() => {
    async function load() {
      try {
        // Procesar transacciones recurrentes pendientes (una sola vez, evita doble ejecucion en StrictMode)
        if (!recurringRan.current) {
          recurringRan.current = true
          const recurringResult = await processRecurringTransactions()
          setRecurringProcessed(recurringResult.processed)
        }

        // Cargar datos (despues de procesar recurrentes para incluir las nuevas)
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthStr = startOfMonth.toISOString().split('T')[0]

        const [walletsData, recentData, monthData, budgetsData, currentRates] = await Promise.all([
          fetchWallets(),
          fetchTransactions({ limit: 5, types: ['income', 'expense'] }),
          fetchTransactions({ limit: 500, dateFrom: monthStr }),
          fetchBudgetsWithSpending(),
          fetchCurrentRates().catch(() => []),
        ])
        setWallets(walletsData)

        // Recientes (solo income/expense, ya filtrado)
        setRecentTx(recentData.data || [])

        // Stats del mes actual (en USD)
        const thisMonth = (monthData.data || []).filter((t) => t.type === 'income' || t.type === 'expense')

        let income = 0
        let expense = 0
        for (const tx of thisMonth) {
          const { amountUsd } = getTxAmountUsd(tx, currentRates)
          if (tx.type === 'income') income += amountUsd
          if (tx.type === 'expense') expense += amountUsd
        }
        setMonthStats({ income, expense })

        // Presupuestos con alertas (solo activos con warning o exceeded)
        const alerts = budgetsData.filter(
          (b) => b.is_active && (b.status === 'warning' || b.status === 'exceeded')
        )
        setBudgetAlerts(alerts)
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Calcular balance total convertido
  const includedWallets = wallets.filter((w) => w.include_in_total)
  let totalBalance = 0
  let hasConversionError = false

  for (const w of includedWallets) {
    const balance = parseFloat(w.balance || 0)
    if (w.currency === displayCurrency) {
      totalBalance += balance
    } else {
      const converted = convert(balance, w.currency, displayCurrency)
      if (converted !== null) {
        totalBalance += converted
      } else {
        hasConversionError = true
      }
    }
  }

  // Frescura de tasas
  const oldestDate = getOldestRateDate()
  const hoursStale = oldestDate ? Math.floor((new Date() - oldestDate) / 3600000) : null
  const isStale = hoursStale !== null && hoursStale > 24

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

      {/* Notificacion de recurrentes procesadas */}
      {recurringProcessed > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HiArrowPath className="w-5 h-5 text-indigo-500" />
            <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
              Se procesaron {recurringProcessed} transaccion{recurringProcessed !== 1 ? 'es' : ''} recurrente{recurringProcessed !== 1 ? 's' : ''}
            </span>
          </div>
          <Link to="/recurring" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
            Ver recurrentes
          </Link>
        </div>
      )}

      {/* Balance Total */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">Balance Total Aproximado</p>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
            {DISPLAY_CURRENCIES.map((cur) => (
              <button
                key={cur}
                onClick={() => setDisplayCurrency(cur)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  displayCurrency === cur
                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>
        <p className="text-4xl font-bold text-gray-900 dark:text-white">
          {formatAmount(totalBalance)} <span className="text-xl font-normal text-gray-400">{CURRENCY_SYMBOLS[displayCurrency]}</span>
        </p>

        {hasConversionError && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            Algunas billeteras no pudieron convertirse. Agrega las tasas de cambio faltantes.
          </p>
        )}

        {/* Frescura de tasas */}
        {oldestDate && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {isStale ? (
              <HiExclamationTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <HiCheckCircle className="w-3.5 h-3.5 text-green-500" />
            )}
            <span className={`text-xs ${isStale ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
              Tasas actualizadas hace {hoursStale < 1 ? 'menos de 1 hora' : `${hoursStale}h`}
            </span>
            {isStale && (
              <Link to="/exchange-rates" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium ml-1">
                Actualizar
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Desglose por billetera */}
      {includedWallets.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Desglose por Billetera</h2>
          <div className="space-y-3">
            {includedWallets.map((w) => {
              const balance = parseFloat(w.balance || 0)
              const converted = w.currency === displayCurrency
                ? balance
                : convert(balance, w.currency, displayCurrency)
              const percentage = totalBalance > 0 && converted !== null
                ? Math.round((converted / totalBalance) * 100)
                : 0

              return (
                <div key={w.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 text-right">
                      <span className="text-xs text-gray-400">{percentage}%</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{w.name}</span>
                        <span className="text-xs text-gray-400">{w.currency}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatAmount(balance)} {CURRENCY_SYMBOLS[w.currency]}
                    </p>
                    {w.currency !== displayCurrency && converted !== null && (
                      <p className="text-xs text-gray-400">
                        ≈ {formatAmount(converted)} {CURRENCY_SYMBOLS[displayCurrency]}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Widget de Presupuestos */}
      {budgetAlerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Alertas de Presupuestos</h2>
            <Link to="/budgets" className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {budgetAlerts.slice(0, 3).map((budget) => {
              const isExceeded = budget.status === 'exceeded'
              return (
                <div key={budget.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: budget.category?.color + '20' }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: budget.category?.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {budget.category?.name}
                      </span>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          isExceeded
                            ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                            : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {budget.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          isExceeded ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {budgetAlerts.length > 3 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              +{budgetAlerts.length - 3} mas
            </p>
          )}
        </div>
      )}

      {/* Stats del mes (en USD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos del Mes <span className="text-xs">(USD)</span></p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            +${formatAmount(monthStats.income)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Gastos del Mes <span className="text-xs">(USD)</span></p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            -${formatAmount(monthStats.expense)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Balance del Mes <span className="text-xs">(USD)</span></p>
          <p className={`text-2xl font-bold mt-1 ${
            monthStats.income - monthStats.expense >= 0
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {monthStats.income - monthStats.expense >= 0 ? '+' : ''}${formatAmount(monthStats.income - monthStats.expense)}
          </p>
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transacciones Recientes</h2>
          {recentTx.length > 0 && (
            <Link to="/transactions" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium">
              Ver todas
            </Link>
          )}
        </div>
        {recentTx.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay transacciones registradas.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentTx.map((tx) => {
              const isPositive = tx.type === 'income'
              const dateStr = new Date(tx.date).toLocaleDateString('es-VE', {
                day: '2-digit',
                month: 'short',
              })
              return (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: tx.category?.color || '#6b7280' }}
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.category?.name || 'Sin categoria'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{dateStr}</span>
                        <span className="text-xs text-gray-400">{tx.wallet?.name}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? '+' : '-'}{formatAmount(tx.amount)} {CURRENCY_SYMBOLS[tx.currency] || tx.currency}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
