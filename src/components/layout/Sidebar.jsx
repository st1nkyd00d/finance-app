import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  HiHome,
  HiWallet,
  HiCurrencyDollar,
  HiTag,
  HiArrowsRightLeft,
  HiChartBar,
  HiTrophy,
  HiArrowPath,
  HiChartPie,
  HiCog6Tooth,
  HiArrowRightOnRectangle,
  HiXMark,
  HiShoppingCart,
} from 'react-icons/hi2'

const navigation = [
  { name: 'Dashboard', path: '/', icon: HiHome },
  { name: 'Billeteras', path: '/wallets', icon: HiWallet },
  { name: 'Transacciones', path: '/transactions', icon: HiCurrencyDollar },
  { name: 'Categorías', path: '/categories', icon: HiTag },
  { name: 'Tasas de Cambio', path: '/exchange-rates', icon: HiArrowsRightLeft },
  { name: 'Presupuestos', path: '/budgets', icon: HiChartBar },
  { name: 'Metas de Ahorro', path: '/goals', icon: HiTrophy },
  { name: 'Recurrentes', path: '/recurring', icon: HiArrowPath },
  { name: 'Análisis', path: '/analytics', icon: HiChartPie },
  { name: 'Mercado', path: '/market', icon: HiShoppingCart },
]

export default function Sidebar({ onClose }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Error al cerrar sesion:', err)
    }
  }

  function handleNavClick() {
    // Cerrar sidebar en móvil
    onClose?.()
  }

  return (
    <aside className="flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 border-r w-64 min-h-screen">
      <div className="flex justify-between items-center p-6">
        <h1 className="font-bold text-gray-800 text-xl dark:text-white">Finance App</h1>
        {/* Botón cerrar en móvil */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <HiXMark className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.name}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-2 p-4 border-gray-200 dark:border-gray-700 border-t">
        <NavLink
          to="/settings"
          onClick={handleNavClick}
          className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-2 rounded-lg font-medium text-gray-600 text-sm hover:text-gray-900 dark:hover:text-white dark:text-gray-300 transition-colors"
        >
          <HiCog6Tooth className="w-5 h-5 shrink-0" />
          Configuración
        </NavLink>

        <div className="px-3 py-2">
          <p className="text-gray-400 text-xs dark:text-gray-500 truncate">{user?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg w-full font-medium text-red-600 text-sm dark:text-red-400 transition-colors"
        >
          <HiArrowRightOnRectangle className="w-5 h-5 shrink-0" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  )
}
