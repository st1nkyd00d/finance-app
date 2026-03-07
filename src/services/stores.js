import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

export async function fetchStores() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createStore({ name, notes }) {
  const user = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('stores')
    .insert({ user_id: user.id, name: name.trim(), notes: notes?.trim() || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateStore(id, { name, notes }) {
  const { data, error } = await supabase
    .from('stores')
    .update({ name: name.trim(), notes: notes?.trim() || null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteStore(id) {
  const { error } = await supabase
    .from('stores')
    .delete()
    .eq('id', id)

  if (error) throw error
}
