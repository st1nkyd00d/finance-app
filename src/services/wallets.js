import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

export async function fetchWallets() {
  const [{ data, error }, { data: balances, error: balError }] = await Promise.all([
    supabase.from('wallets').select('*').order('created_at', { ascending: true }),
    supabase.from('wallet_balances').select('id, balance'),
  ])

  if (error) throw error

  if (!balError && balances) {
    const balanceMap = Object.fromEntries(balances.map((b) => [b.id, b.balance]))
    return data.map((w) => ({ ...w, balance: balanceMap[w.id] || 0 }))
  }

  return data
}

export async function createWallet({ name, currency, include_in_total = true }) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: user.id,
      name,
      currency,
      include_in_total,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateWallet(id, updates) {
  const { data, error } = await supabase
    .from('wallets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteWallet(id) {
  // Verificar si tiene transacciones
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('wallet_id', id)

  if (countError) throw countError

  if (count > 0) {
    throw new Error(`No se puede eliminar: tiene ${count} transaccion(es) asociada(s)`)
  }

  const { error } = await supabase
    .from('wallets')
    .delete()
    .eq('id', id)

  if (error) throw error
}
