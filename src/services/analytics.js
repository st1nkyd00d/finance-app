import { supabase } from './supabase'
import { fetchCurrentRates } from './exchangeRates'
import { convertToUSD, getTxAmountUsd } from '../utils/currency'

// Obtener gastos agrupados por categoria en un periodo (todo en USD)
export async function getExpensesByCategory(dateFrom, dateTo, rates = null) {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      amount_usd,
      currency,
      category:categories(id, name, color)
    `)
    .eq('type', 'expense')
    .gte('date', dateFrom)
    .lte('date', dateTo)

  if (error) throw error

  if (!rates) {
    rates = await fetchCurrentRates()
  }

  // Agrupar por categoria (usando amount_usd o conversion con tasas actuales)
  const grouped = {}
  for (const tx of data) {
    const catId = tx.category?.id || 'sin-categoria'
    const catName = tx.category?.name || 'Sin categoria'
    const catColor = tx.category?.color || '#6b7280'

    if (!grouped[catId]) {
      grouped[catId] = {
        id: catId,
        name: catName,
        color: catColor,
        total: 0,
        count: 0,
      }
    }
    const { amountUsd } = getTxAmountUsd(tx, rates)
    grouped[catId].total += amountUsd
    grouped[catId].count += 1
  }

  return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// Obtener ingresos vs gastos por mes (ultimos N meses) - todo en USD
export async function getIncomeVsExpenseByMonth(months = 6) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months + 1)
  startDate.setDate(1)

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, amount_usd, currency, type, date')
    .in('type', ['income', 'expense'])
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())

  if (error) throw error

  const rates = await fetchCurrentRates()

  // Agrupar por mes
  const grouped = {}

  for (let i = 0; i < months; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthName = d.toLocaleDateString('es-VE', { month: 'short' })
    grouped[key] = {
      month: key,
      label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      income: 0,
      expense: 0,
      balance: 0,
    }
  }

  for (const tx of data) {
    const date = new Date(tx.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (grouped[key]) {
      const { amountUsd } = getTxAmountUsd(tx, rates)
      if (tx.type === 'income') {
        grouped[key].income += amountUsd
      } else {
        grouped[key].expense += amountUsd
      }
    }
  }

  // Calcular balance y ordenar cronologicamente
  const result = Object.values(grouped)
    .map((m) => ({
      ...m,
      balance: m.income - m.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))

  return result
}

// Obtener evolucion del balance a lo largo del tiempo (en USD)
export async function getBalanceEvolution(days = 30) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const rates = await fetchCurrentRates()

  // Balance acumulado ANTES del inicio del periodo (para arrancar desde el balance real)
  const { data: prevData, error: prevError } = await supabase
    .from('transactions')
    .select('amount, amount_usd, currency, type')
    .in('type', ['income', 'expense'])
    .lt('date', startDate.toISOString())

  if (prevError) throw prevError

  let openingBalance = 0
  for (const tx of prevData || []) {
    const { amountUsd } = getTxAmountUsd(tx, rates)
    if (tx.type === 'income') openingBalance += amountUsd
    else openingBalance -= amountUsd
  }

  // Transacciones dentro del periodo
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, amount_usd, currency, type, date')
    .in('type', ['income', 'expense'])
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .order('date', { ascending: true })

  if (error) throw error

  // Crear array de dias
  const dailyData = {}
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const key = d.toISOString().split('T')[0]
    dailyData[key] = {
      date: key,
      label: d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
      change: 0,
    }
  }

  // Calcular cambios diarios (en USD) - solo ingresos y gastos.
  // Las transferencias internas se excluyen porque no cambian el patrimonio total.
  for (const tx of data) {
    const key = tx.date.split('T')[0]
    if (dailyData[key]) {
      const { amountUsd } = getTxAmountUsd(tx, rates)
      if (tx.type === 'income') {
        dailyData[key].change += amountUsd
      } else if (tx.type === 'expense') {
        dailyData[key].change -= amountUsd
      }
    }
  }

  // Calcular balance acumulado arrancando desde el balance previo al periodo
  const result = Object.values(dailyData)
  let cumulative = openingBalance
  for (const day of result) {
    cumulative += day.change
    day.balance = cumulative
  }

  return result
}

// Obtener distribucion por billetera (con conversion a USD)
export async function getWalletDistribution() {
  const [walletsResult, rates] = await Promise.all([
    supabase.from('wallet_balances').select('*'),
    fetchCurrentRates(),
  ])

  if (walletsResult.error) throw walletsResult.error

  const wallets = walletsResult.data.filter((w) => w.include_in_total)

  const result = wallets.map((w) => {
    const balance = parseFloat(w.balance || 0)
    const converted = convertToUSD(balance, w.currency, rates)
    const balanceUSD = converted !== null ? converted : 0

    return {
      id: w.id,
      name: w.name,
      currency: w.currency,
      balance,
      balanceUSD,
    }
  })

  // Calcular porcentajes
  const total = result.reduce((sum, w) => sum + w.balanceUSD, 0)
  for (const w of result) {
    w.percentage = total > 0 ? Math.round((w.balanceUSD / total) * 100) : 0
  }

  return result.sort((a, b) => b.balanceUSD - a.balanceUSD)
}

// Estadisticas generales (todo en USD)
export async function getGeneralStats() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const rates = await fetchCurrentRates()

  // Transacciones del mes actual
  const { data: currentMonth } = await supabase
    .from('transactions')
    .select('amount, amount_usd, currency, type, date')
    .in('type', ['income', 'expense'])
    .gte('date', startOfMonth.toISOString())

  // Transacciones del mes pasado
  const { data: lastMonth } = await supabase
    .from('transactions')
    .select('amount, amount_usd, currency, type')
    .in('type', ['income', 'expense'])
    .gte('date', startOfLastMonth.toISOString())
    .lte('date', endOfLastMonth.toISOString())

  // Calcular totales mes actual (en USD)
  let currentIncome = 0
  let currentExpense = 0
  for (const tx of currentMonth || []) {
    const { amountUsd } = getTxAmountUsd(tx, rates)
    if (tx.type === 'income') currentIncome += amountUsd
    else currentExpense += amountUsd
  }

  // Calcular totales mes pasado (en USD)
  let lastIncome = 0
  let lastExpense = 0
  for (const tx of lastMonth || []) {
    const { amountUsd } = getTxAmountUsd(tx, rates)
    if (tx.type === 'income') lastIncome += amountUsd
    else lastExpense += amountUsd
  }

  // Dias transcurridos del mes
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysPassed = now.getDate()

  // Promedio diario de gasto (en USD)
  const avgDailyExpense = daysPassed > 0 ? currentExpense / daysPassed : 0

  // Proyeccion de fin de mes
  const projectedExpense = avgDailyExpense * daysInMonth

  // Categoria mas gastada (ya usa USD internamente)
  const expensesByCategory = await getExpensesByCategory(
    startOfMonth.toISOString(),
    now.toISOString(),
    rates
  )
  const topCategory = expensesByCategory[0] || null

  // Variacion vs mes anterior
  const expenseChange = lastExpense > 0
    ? Math.round(((currentExpense - lastExpense) / lastExpense) * 100)
    : 0

  return {
    currentIncome,
    currentExpense,
    lastIncome,
    lastExpense,
    avgDailyExpense,
    projectedExpense,
    topCategory,
    expenseChange,
    daysRemaining: daysInMonth - daysPassed,
  }
}
