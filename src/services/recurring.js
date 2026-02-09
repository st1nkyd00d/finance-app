import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'
import { addMonths } from '../utils/date'

const RECURRING_SELECT = `
  *,
  wallet:wallets(id, name, currency),
  category:categories(id, name, type, color)
`

export async function fetchRecurringTransactions() {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select(RECURRING_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createRecurringTransaction({
  wallet_id,
  category_id,
  type,
  amount,
  frequency,
  start_date,
  end_date,
  description,
}) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert({
      user_id: user.id,
      wallet_id,
      category_id,
      type,
      amount,
      frequency,
      start_date,
      end_date: end_date || null,
      last_processed: null,
      is_active: true,
      description: description || null,
    })
    .select(RECURRING_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function updateRecurringTransaction(id, updates) {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .update(updates)
    .eq('id', id)
    .select(RECURRING_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function deleteRecurringTransaction(id) {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Calcular la proxima fecha de ejecucion basada en frecuencia
export function getNextDate(lastDate, frequency) {
  const date = new Date(lastDate)

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      return date
    case 'weekly':
      date.setDate(date.getDate() + 7)
      return date
    case 'biweekly':
      date.setDate(date.getDate() + 14)
      return date
    case 'monthly':
      return addMonths(date, 1)
    case 'yearly':
      return addMonths(date, 12)
    default:
      return date
  }
}

// Calcular proxima ejecucion desde start_date o last_processed
export function calculateNextExecution(recurring) {
  const { start_date, last_processed, frequency, end_date, is_active } = recurring

  if (!is_active) return null

  const baseDate = last_processed || start_date
  let nextDate = last_processed
    ? getNextDate(last_processed, frequency)
    : new Date(start_date)

  // Si ya paso la fecha de fin, no hay proxima
  if (end_date && nextDate > new Date(end_date)) {
    return null
  }

  return nextDate
}

// Procesar transacciones recurrentes pendientes
export async function processRecurringTransactions() {
  let user
  try {
    user = await getAuthenticatedUser()
  } catch {
    return { processed: 0, transactions: [] }
  }

  const recurrings = await fetchRecurringTransactions()
  const today = new Date()
  today.setHours(23, 59, 59, 999) // Fin del dia

  const MAX_BATCH = 30
  const processed = []

  for (const recurring of recurrings) {
    if (!recurring.is_active) continue

    // Si tiene fecha de fin y ya paso, desactivar
    if (recurring.end_date && new Date(recurring.end_date) < new Date()) {
      await updateRecurringTransaction(recurring.id, { is_active: false })
      continue
    }

    // Calcular desde cuando procesar
    let currentDate = recurring.last_processed
      ? getNextDate(recurring.last_processed, recurring.frequency)
      : new Date(recurring.start_date)

    // Crear transacciones para cada periodo que haya pasado (maximo MAX_BATCH por ejecucion)
    let count = 0
    while (currentDate <= today && count < MAX_BATCH) {
      // Verificar fecha de fin
      if (recurring.end_date && currentDate > new Date(recurring.end_date)) {
        break
      }

      // Crear la transaccion
      const { data: tx, error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          wallet_id: recurring.wallet_id,
          category_id: recurring.category_id,
          type: recurring.type,
          amount: recurring.amount,
          currency: recurring.wallet?.currency || 'USD',
          description: recurring.description
            ? `${recurring.description} (Recurrente)`
            : 'Transaccion recurrente',
          date: currentDate.toISOString(),
        })
        .select()
        .single()

      if (!error) {
        processed.push(tx)
      }

      // Actualizar last_processed
      await supabase
        .from('recurring_transactions')
        .update({ last_processed: currentDate.toISOString().split('T')[0] })
        .eq('id', recurring.id)

      // Siguiente fecha
      currentDate = getNextDate(currentDate, recurring.frequency)
      count++
    }
  }

  return { processed: processed.length, transactions: processed }
}

// Obtener recurrentes con info de proxima ejecucion
export async function fetchRecurringWithNextDate() {
  const recurrings = await fetchRecurringTransactions()

  return recurrings.map((r) => ({
    ...r,
    nextExecution: calculateNextExecution(r),
  }))
}

// Formatear frecuencia para mostrar
export function formatFrequency(frequency) {
  const labels = {
    daily: 'Diaria',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    yearly: 'Anual',
  }
  return labels[frequency] || frequency
}
