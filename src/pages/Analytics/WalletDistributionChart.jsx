import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatAmount } from '../../utils/currency'

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#a855f7', '#0ea5e9',
]

export default function WalletDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No hay datos para mostrar
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {formatAmount(item.balance)} {item.currency}
          </p>
          <p className="text-sm text-indigo-600 dark:text-indigo-400">
            ≈ ${formatAmount(item.balanceUSD)} USD ({item.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:w-1/2">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="balanceUSD"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-full md:w-1/2 space-y-2">
        {data.map((wallet, index) => (
          <div key={wallet.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{wallet.name}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {wallet.percentage}%
              </span>
              <span className="text-xs text-gray-400 ml-2">
                ${formatAmount(wallet.balanceUSD)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
