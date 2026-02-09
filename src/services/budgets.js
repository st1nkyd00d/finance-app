import { supabase } from './supabase'
import { fetchCurrentRates } from './exchangeRates'
import { getAuthenticatedUser } from '../utils/auth'
import { convertToUSD } from '../utils/currency'
import { safeDate } from '../utils/date'

export async function fetchBudgets() {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      category:categories(id, name, color, icon)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createBudget({ category_id, amount, period, start_date }) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      category_id,
      amount,
      period,
      start_date,
      is_active: true,
    })
    .select(`
      *,
      category:categories(id, name, color, icon)
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateBudget(id, updates) {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      category:categories(id, name, color, icon)
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteBudget(id) {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Calcula el rango de fechas del periodo actual
export function getCurrentPeriodRange(period, startDate) {
  const start = new Date(startDate)
  const now = new Date()

  let periodStart, periodEnd

  if (period === 'weekly') {
    // Usar Math.round para compensar DST (un dia puede tener 23 o 25 horas)
    const daysSinceStart = Math.round((now - start) / (1000 * 60 * 60 * 24))
    const weeksElapsed = Math.floor(daysSinceStart / 7)
    periodStart = new Date(start)
    periodStart.setDate(start.getDate() + weeksElapsed * 7)
    periodEnd = new Date(periodStart)
    periodEnd.setDate(periodStart.getDate() + 6)
  } else if (period === 'monthly') {
    // Mes actual basado en el dia de start_date, clampeado al ultimo dia del mes
    const startDay = start.getDate()
    periodStart = safeDate(now.getFullYear(), now.getMonth(), startDay)
    if (periodStart > now) {
      periodStart = safeDate(now.getFullYear(), now.getMonth() - 1, startDay)
    }
    periodEnd = safeDate(periodStart.getFullYear(), periodStart.getMonth() + 1, startDay)
    periodEnd.setDate(periodEnd.getDate() - 1)
  } else if (period === 'yearly') {
    // Anno actual basado en start_date, clampeado para feb 29 en annos no bisiestos
    const startMonth = start.getMonth()
    const startDay = start.getDate()
    periodStart = safeDate(now.getFullYear(), startMonth, startDay)
    if (periodStart > now) {
      periodStart = safeDate(now.getFullYear() - 1, startMonth, startDay)
    }
    periodEnd = safeDate(periodStart.getFullYear() + 1, startMonth, startDay)
    periodEnd.setDate(periodEnd.getDate() - 1)
  } else {
    throw new Error(`Periodo de presupuesto desconocido: ${period}`)
  }

  return { periodStart, periodEnd }
}

// Calcula dias restantes en el periodo
export function getDaysRemaining(periodEnd) {
  const now = new Date()
  const end = new Date(periodEnd)
  const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

// Obtiene el total gastado por categoria en un rango de fechas, convertido a USD
export async function getCategorySpendingInUSD(categoryId, dateFrom, dateTo, rates) {
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, currency')
    .eq('category_id', categoryId)
    .eq('type', 'expense')
    .gte('date', dateFrom.toISOString())
    .lte('date', dateTo.toISOString())

  if (error) throw error

  let total = 0
  let hasConversionError = false

  for (const tx of data) {
    const amountUSD = convertToUSD(parseFloat(tx.amount), tx.currency, rates)
    if (amountUSD !== null) {
      total += amountUSD
    } else {
      hasConversionError = true
    }
  }

  return { total, hasConversionError }
}

// Obtiene todos los presupuestos con su gasto actual calculado (en USD)
export async function fetchBudgetsWithSpending() {
  const [budgets, rates] = await Promise.all([
    fetchBudgets(),
    fetchCurrentRates(),
  ])

  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const { periodStart, periodEnd } = getCurrentPeriodRange(
        budget.period,
        budget.start_date
      )

      const { total: spent, hasConversionError } = await getCategorySpendingInUSD(
        budget.category_id,
        periodStart,
        periodEnd,
        rates
      )

      const percentage = budget.amount > 0
        ? Math.round((spent / budget.amount) * 100)
        : 0

      const daysRemaining = getDaysRemaining(periodEnd)

      let status = 'normal'
      if (percentage >= 100) {
        status = 'exceeded'
      } else if (percentage >= 70) {
        status = 'warning'
      }

      return {
        ...budget,
        spent,
        percentage,
        daysRemaining,
        status,
        periodStart,
        periodEnd,
        hasConversionError,
      }
    })
  )

  return budgetsWithSpending
}
