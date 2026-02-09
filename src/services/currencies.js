import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

// Obtener todas las monedas disponibles (sistema + propias)
export async function fetchCurrencies() {
  const { data, error } = await supabase
    .from('currencies')
    .select('*')
    .order('is_system', { ascending: false })
    .order('code', { ascending: true })

  if (error) throw error
  return data || []
}

// Crear moneda personalizada
export async function createCurrency({ code, name, symbol = '' }) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('currencies')
    .insert({
      user_id: user.id,
      code: code.toUpperCase().trim(),
      name: name.trim(),
      symbol: symbol.trim(),
      is_system: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Actualizar moneda personalizada
export async function updateCurrency(id, { code, name, symbol }) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('currencies')
    .update({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      symbol: symbol.trim(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_system', false)
    .select()
    .single()

  if (error) throw error
  return data
}

// Eliminar moneda personalizada
export async function deleteCurrency(id) {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from('currencies')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_system', false)

  if (error) throw error
}
