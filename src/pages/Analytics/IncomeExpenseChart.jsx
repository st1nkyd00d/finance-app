import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'

export default function IncomeExpenseChart({ data }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No hay datos para mostrar
      </div>
    )
  }

  function formatAmount(value) {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k'
    }
    return value.toFixed(0)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const income = payload.find((p) => p.dataKey === 'income')?.value || 0
      const expense = payload.find((p) => p.dataKey === 'expense')?.value || 0
      const balance = income - expense

      return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-green-600 dark:text-green-400">
              Ingresos: {income.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-red-600 dark:text-red-400">
              Gastos: {expense.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
            <p className={`font-medium ${balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
              Balance: {balance >= 0 ? '+' : ''}{balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
          axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
          tickFormatter={formatAmount}
          axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: 10 }}
          formatter={(value) => (
            <span className="text-sm text-gray-600">
              {value === 'income' ? 'Ingresos' : 'Gastos'}
            </span>
          )}
        />
        <ReferenceLine y={0} stroke="#9ca3af" />
        <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
