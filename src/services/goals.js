import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

/**
 * Fetch all savings goals for the authenticated user
 */
export async function fetchGoals() {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Create a new savings goal
 */
export async function createGoal({ name, target_amount, description, deadline }) {
  const user = await getAuthenticatedUser()

  // Validations
  if (!name || name.trim().length === 0) {
    throw new Error('El nombre es requerido')
  }
  if (name.length > 100) {
    throw new Error('El nombre no puede exceder 100 caracteres')
  }
  if (!target_amount || target_amount <= 0) {
    throw new Error('El monto objetivo debe ser mayor a 0')
  }
  if (description && description.length > 500) {
    throw new Error('La descripción no puede exceder 500 caracteres')
  }
  if (deadline) {
    const deadlineDate = new Date(deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (deadlineDate < today) {
      throw new Error('La fecha límite debe ser hoy o en el futuro')
    }
  }

  const { data, error } = await supabase
    .from('savings_goals')
    .insert({
      user_id: user.id,
      name: name.trim(),
      target_amount: parseFloat(target_amount),
      description: description?.trim() || null,
      deadline: deadline || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing savings goal
 */
export async function updateGoal(id, updates) {
  const user = await getAuthenticatedUser()

  // Validations
  if (updates.name !== undefined) {
    if (!updates.name || updates.name.trim().length === 0) {
      throw new Error('El nombre es requerido')
    }
    if (updates.name.length > 100) {
      throw new Error('El nombre no puede exceder 100 caracteres')
    }
  }
  if (updates.target_amount !== undefined) {
    if (!updates.target_amount || updates.target_amount <= 0) {
      throw new Error('El monto objetivo debe ser mayor a 0')
    }
  }
  if (updates.description !== undefined && updates.description && updates.description.length > 500) {
    throw new Error('La descripción no puede exceder 500 caracteres')
  }
  if (updates.deadline !== undefined && updates.deadline) {
    const deadlineDate = new Date(updates.deadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (deadlineDate < today) {
      throw new Error('La fecha límite debe ser hoy o en el futuro')
    }
  }

  const payload = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.target_amount !== undefined) payload.target_amount = parseFloat(updates.target_amount)
  if (updates.description !== undefined) payload.description = updates.description?.trim() || null
  if (updates.deadline !== undefined) payload.deadline = updates.deadline || null
  if (updates.is_active !== undefined) payload.is_active = updates.is_active

  const { data, error } = await supabase
    .from('savings_goals')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a savings goal
 */
export async function deleteGoal(id) {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from('savings_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

/**
 * Calculate progress for a specific goal
 * Returns the sum of all savings transactions assigned to this goal (in USD)
 */
export async function calculateGoalProgress(goalId) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('transactions')
    .select('amount, amount_usd, wallet:wallets(currency)')
    .eq('user_id', user.id)
    .eq('goal_id', goalId)
    .eq('type', 'savings')

  if (error) throw error

  let total = 0
  let hasConversionError = false

  for (const tx of data || []) {
    if (tx.amount_usd) {
      total += parseFloat(tx.amount_usd)
    } else {
      // Fallback: if amount_usd is null but currency is USD/USDT, use amount
      const currency = tx.wallet?.currency
      if (currency === 'USD' || currency === 'USDT') {
        total += parseFloat(tx.amount)
      } else {
        // VES transaction without conversion rate
        hasConversionError = true
      }
    }
  }

  return { current: total, hasConversionError }
}

/**
 * Calculate days remaining until deadline
 * Returns null if no deadline
 */
export function getDaysRemaining(deadline) {
  if (!deadline) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)

  const diffTime = deadlineDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Calculate progress percentage
 */
export function getProgressPercentage(current, target) {
  if (!target || target <= 0) return 0
  return Math.round((current / target) * 100)
}

/**
 * Get goal status based on percentage
 */
export function getGoalStatus(percentage) {
  if (percentage >= 100) return 'completed'
  if (percentage >= 70) return 'warning'
  return 'normal'
}

/**
 * Fetch all goals with calculated progress
 * This is the main function to use in the UI
 */
export async function fetchGoalsWithProgress() {
  const user = await getAuthenticatedUser()
  const goals = await fetchGoals()

  if (goals.length === 0) return []

  // Una sola query para todas las transacciones de savings
  const goalIds = goals.map((g) => g.id)
  const { data: allTx, error } = await supabase
    .from('transactions')
    .select('amount, amount_usd, goal_id, wallet:wallets(currency)')
    .eq('user_id', user.id)
    .in('goal_id', goalIds)
    .eq('type', 'savings')

  if (error) throw error

  // Agrupar transacciones por goal_id
  const txByGoal = {}
  for (const tx of allTx || []) {
    if (!txByGoal[tx.goal_id]) txByGoal[tx.goal_id] = []
    txByGoal[tx.goal_id].push(tx)
  }

  const goalsWithProgress = goals.map((goal) => {
    const goalTx = txByGoal[goal.id] || []
    let current = 0
    let hasConversionError = false

    for (const tx of goalTx) {
      if (tx.amount_usd) {
        current += parseFloat(tx.amount_usd)
      } else {
        const currency = tx.wallet?.currency
        if (currency === 'USD' || currency === 'USDT') {
          current += parseFloat(tx.amount)
        } else {
          hasConversionError = true
        }
      }
    }

    const percentage = getProgressPercentage(current, goal.target_amount)
    const daysRemaining = getDaysRemaining(goal.deadline)
    const status = getGoalStatus(percentage)

    return {
      ...goal,
      current,
      percentage,
      daysRemaining,
      status,
      hasConversionError,
    }
  })

  return goalsWithProgress
}
