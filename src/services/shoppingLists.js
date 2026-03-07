import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'
import { fetchCurrentRates } from './exchangeRates'
import { convertToUSD } from '../utils/currency'

async function calcPriceUsd(price, currency) {
  if (price == null) return null
  try {
    if (currency === 'USD' || currency === 'USDT') return parseFloat(price)
    const rates = await fetchCurrentRates()
    const result = convertToUSD(parseFloat(price), currency, rates)
    return result ?? null
  } catch {
    return null
  }
}

export async function fetchShoppingLists() {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`*, items:shopping_list_items(id, is_checked, price, currency, price_usd, quantity)`)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchShoppingListById(id) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createShoppingList({ name, notes }) {
  const user = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({ user_id: user.id, name, notes: notes || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateShoppingList(id, updates) {
  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteShoppingList(id) {
  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function fetchListItems(listId) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select(`*, product:product_catalog(id, name, unit)`)
    .eq('list_id', listId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addListItem({
  list_id,
  name,
  quantity = 1,
  unit,
  price,
  currency,
  store_name,
  notes,
  product_id,
}) {
  const user = await getAuthenticatedUser()
  const price_usd = price != null && currency ? await calcPriceUsd(price, currency) : null

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      user_id: user.id,
      list_id,
      product_id: product_id || null,
      name,
      quantity: parseFloat(quantity),
      unit: unit || null,
      price: price != null ? parseFloat(price) : null,
      currency: currency || null,
      price_usd,
      store_name: store_name || null,
      notes: notes || null,
    })
    .select(`*, product:product_catalog(id, name, unit)`)
    .single()

  if (error) throw error
  return data
}

export async function updateListItem(id, updates) {
  const patch = { ...updates }

  // Recalculate price_usd if price or currency changed
  if ((patch.price !== undefined || patch.currency !== undefined) && patch.price != null && patch.currency) {
    patch.price_usd = await calcPriceUsd(patch.price, patch.currency)
  } else if (patch.price == null) {
    patch.price_usd = null
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update(patch)
    .eq('id', id)
    .select(`*, product:product_catalog(id, name, unit)`)
    .single()

  if (error) throw error
  return data
}

export async function toggleItemChecked(id, is_checked) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteListItem(id) {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
