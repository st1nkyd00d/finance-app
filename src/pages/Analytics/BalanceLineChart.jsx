import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'

export default function BalanceLineChart({ data }) {
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
    if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'k'
    }
    return value.toFixed(0)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const balance = payload[0]?.value || 0
      const change = payload[0]?.payload?.change || 0

      return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          <p className={`text-sm ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            Balance: {balance.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
          </p>
          {change !== 0 && (
            <p className={`text-xs ${change >= 0 ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              Cambio: {change >= 0 ? '+' : ''}{change.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Mostrar solo algunos labels para no saturar
  const tickInterval = Math.ceil(data.length / 6)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
          axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
          interval={tickInterval}
        />
        <YAxis
          tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
          tickFormatter={formatAmount}
          axisLine={{ stroke: isDark ? '#4b5563' : '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6, fill: '#6366f1' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
