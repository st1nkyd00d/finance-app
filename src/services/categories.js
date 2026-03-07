import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createCategory({ name, type, color, icon }) {
  const user = await getAuthenticatedUser()

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      type,
      color: color || '#6366f1',
      icon: icon || 'tag',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', id)

  if (countError) throw countError

  if (count > 0) {
    throw new Error(`No se puede eliminar: tiene ${count} transaccion(es) asociada(s)`)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCategoryTransactionCount(categoryId) {
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId)

  if (error) throw error
  return count
}
