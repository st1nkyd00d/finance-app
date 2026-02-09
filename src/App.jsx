import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import AppLayout from './components/layout/AppLayout'
import PWAPrompt from './components/PWAPrompt'

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Auth/Login'))
const Register = lazy(() => import('./pages/Auth/Register'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'))
const Wallets = lazy(() => import('./pages/Wallets/Wallets'))
const Transactions = lazy(() => import('./pages/Transactions/Transactions'))
const Categories = lazy(() => import('./pages/Categories/Categories'))
const ExchangeRates = lazy(() => import('./pages/ExchangeRates/ExchangeRates'))
const Budgets = lazy(() => import('./pages/Budgets/Budgets'))
const Goals = lazy(() => import('./pages/Goals/Goals'))
const Recurring = lazy(() => import('./pages/Recurring/Recurring'))
const Analytics = lazy(() => import('./pages/Analytics/Analytics'))
const Settings = lazy(() => import('./pages/Settings/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PWAPrompt />
            <Suspense fallback={<PageLoader />}>
              <Routes>
            {/* Rutas publicas - redirige a / si ya esta autenticado */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Rutas protegidas - redirige a /login si no esta autenticado */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/wallets" element={<Wallets />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/exchange-rates" element={<ExchangeRates />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/recurring" element={<Recurring />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
            </Suspense>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
