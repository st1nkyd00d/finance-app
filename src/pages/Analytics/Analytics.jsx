import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getExpensesByCategory,
  getIncomeVsExpenseByMonth,
  getBalanceEvolution,
  getWalletDistribution,
  getGeneralStats,
} from '../../services/analytics'
import ExpensesPieChart from './ExpensesPieChart'
import IncomeExpenseChart from './IncomeExpenseChart'
import BalanceLineChart from './BalanceLineChart'
import WalletDistributionChart from './WalletDistributionChart'
import { formatAmount } from '../../utils/currency'

const PERIODS = [
  { value: 'week', label: 'Esta semana', days: 7 },
  { value: 'month', label: 'Este mes', days: 30 },
  { value: '3months', label: '3 meses', days: 90 },
  { value: 'year', label: 'Este año', days: 365 },
]

export default function Analytics() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState('month')
  const [loading, setLoading] = useState(true)
  const [expensesByCategory, setExpensesByCategory] = useState([])
  const [incomeVsExpense, setIncomeVsExpense] = useState([])
  const [balanceEvolution, setBalanceEvolution] = useState([])
  const [walletDistribution, setWalletDistribution] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadData()
  }, [period])

  async function loadData() {
    setLoading(true)
    try {
      const selectedPeriod = PERIODS.find((p) => p.value === period)
      const days = selectedPeriod?.days || 30

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const [expenses, incomeExpense, balance, wallets, generalStats] = await Promise.all([
        getExpensesByCategory(startDate.toISOString(), endDate.toISOString()),
        getIncomeVsExpenseByMonth(period === 'year' ? 12 : 6),
        getBalanceEvolution(days),
        getWalletDistribution(),
        getGeneralStats(),
      ])

      setExpensesByCategory(expenses)
      setIncomeVsExpense(incomeExpense)
      setBalanceEvolution(balance)
      setWalletDistribution(wallets)
      setStats(generalStats)
    } catch (err) {
      console.error('Error cargando analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCategoryClick(category) {
    // Navegar a transacciones filtradas por categoria
    navigate(`/transactions?categories=${category.id}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="border-4 border-indigo-600 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Análisis</h1>
          <p className="mt-1 text-gray-500 text-xs dark:text-gray-400">Todos los valores en USD</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${period === p.value
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="gap-4 grid grid-cols-2 md:grid-cols-4 mb-6">
          <div className="bg-white dark:bg-gray-800 shadow-sm p-4 rounded-xl">
            <p className="mb-1 text-gray-500 text-xs dark:text-gray-400">Gasto Promedio Diario</p>
            <p className="font-bold text-gray-900 text-xl dark:text-white">
              ${formatAmount(stats.avgDailyExpense)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-sm p-4 rounded-xl">
            <p className="mb-1 text-gray-500 text-xs dark:text-gray-400">Proyeccion Mes</p>
            <p className="font-bold text-gray-900 text-xl dark:text-white">
              ${formatAmount(stats.projectedExpense)}
            </p>
            <p className="text-gray-400 text-xs">{stats.daysRemaining} dias restantes</p>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-sm p-4 rounded-xl">
            <p className="mb-1 text-gray-500 text-xs dark:text-gray-400">Categoria Top</p>
            {stats.topCategory ? (
              <>
                <p className="font-bold text-gray-900 text-lg dark:text-white truncate">
                  {stats.topCategory.name}
                </p>
                <p className="text-gray-400 text-xs">
                  ${formatAmount(stats.topCategory.total)}
                </p>
              </>
            ) : (
              <p className="text-gray-400">-</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 shadow-sm p-4 rounded-xl">
            <p className="mb-1 text-gray-500 text-xs dark:text-gray-400">vs Mes Anterior</p>
            <p
              className={`text-xl font-bold ${stats.expenseChange > 0
                ? 'text-red-600 dark:text-red-400'
                : stats.expenseChange < 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-900 dark:text-white'
                }`}
            >
              {stats.expenseChange > 0 ? '+' : ''}
              {stats.expenseChange}%
            </p>
            <p className="text-gray-400 text-xs">en gastos</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {/* Gastos por Categoria */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-5 rounded-xl">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Gastos por Categoría
          </h2>
          <ExpensesPieChart
            data={expensesByCategory}
            onCategoryClick={handleCategoryClick}
          />
          {expensesByCategory.length > 0 && (
            <p className="mt-2 text-center text-gray-400 text-xs">
              Click en una categoria para ver transacciones
            </p>
          )}
        </div>

        {/* Ingresos vs Gastos */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-5 rounded-xl">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Ingresos vs Gastos
          </h2>
          <IncomeExpenseChart data={incomeVsExpense} />
        </div>

        {/* Evolucion del Balance */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-5 rounded-xl">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Evolución del Balance
          </h2>
          <BalanceLineChart data={balanceEvolution} />
          <p className="mt-2 text-center text-gray-400 text-xs">
            Balance real incluyendo historial anterior
          </p>
        </div>

        {/* Distribucion por Billetera */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-5 rounded-xl">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Distribución por Billetera
          </h2>
          <WalletDistributionChart data={walletDistribution} />
        </div>
      </div>

      {/* Resumen del Mes */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 shadow-sm mt-6 p-5 rounded-xl">
          <h2 className="mb-4 font-semibold text-gray-900 text-lg dark:text-white">
            Resumen del Mes <span className="font-normal text-gray-400 text-sm">(USD)</span>
          </h2>
          <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
            <div>
              <p className="mb-1 text-gray-500 text-sm dark:text-gray-400">Ingresos</p>
              <p className="font-bold text-2xl text-green-600 dark:text-green-400">
                +${formatAmount(stats.currentIncome)}
              </p>
              {stats.lastIncome > 0 && (
                <p className="text-gray-400 text-xs">
                  Mes anterior: ${formatAmount(stats.lastIncome)}
                </p>
              )}
            </div>
            <div>
              <p className="mb-1 text-gray-500 text-sm dark:text-gray-400">Gastos</p>
              <p className="font-bold text-2xl text-red-600 dark:text-red-400">
                -${formatAmount(stats.currentExpense)}
              </p>
              {stats.lastExpense > 0 && (
                <p className="text-gray-400 text-xs">
                  Mes anterior: ${formatAmount(stats.lastExpense)}
                </p>
              )}
            </div>
            <div>
              <p className="mb-1 text-gray-500 text-sm dark:text-gray-400">Balance Neto</p>
              <p
                className={`text-2xl font-bold ${stats.currentIncome - stats.currentExpense >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
                  }`}
              >
                {stats.currentIncome - stats.currentExpense >= 0 ? '+$' : '-$'}
                {formatAmount(Math.abs(stats.currentIncome - stats.currentExpense))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
