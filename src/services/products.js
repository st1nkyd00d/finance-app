import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'
import { fetchCurrentRates } from './exchangeRates'
import { convertToUSD } from '../utils/currency'

const DEFAULT_PRODUCTS = [
  { name: 'Harina',                        unit: 'paquete' },
  { name: 'Pollo',                          unit: 'kg'      },
  { name: 'Huevos',                         unit: 'cartón'  },
  { name: 'Carne de res',                   unit: 'kg'      },
  { name: 'Cochino',                        unit: 'kg'      },
  { name: 'Pasta 500gr',                    unit: 'paquete' },
  { name: 'Pasta 1kg',                      unit: 'paquete' },
  { name: 'Arroz 1kg',                      unit: 'paquete' },
  { name: 'Tomates',                        unit: 'kg'      },
  { name: 'Cebollas',                       unit: 'kg'      },
  { name: 'Ketchup',                        unit: 'unidad'  },
  { name: 'Mayonesa 500gr',                 unit: 'unidad'  },
  { name: 'Mayonesa 175gr',                 unit: 'unidad'  },
  { name: 'Aceite 500ml',                   unit: 'unidad'  },
  { name: 'Aceite 1lt',                     unit: 'unidad'  },
  { name: 'Azúcar 1kg',                     unit: 'unidad'  },
  { name: 'Sal 1kg',                        unit: 'unidad'  },
  { name: 'Queso',                          unit: 'kg'      },
  { name: 'Papel sanitario pack 4 rollos',  unit: 'unidad'  },
]

async function calcPriceUsd(price, currency) {
  try {
    if (currency === 'USD' || currency === 'USDT') return parseFloat(price)
    const rates = await fetchCurrentRates()
    const result = convertToUSD(parseFloat(price), currency, rates)
    return result ?? null
  } catch {
    return null
  }
}

export async function fetchProducts() {
  const { data, error } = await supabase
    .from('product_catalog')
    .select(`*, prices:product_prices(*)`)
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function searchProducts(query) {
  if (!query || !query.trim()) return []
  const { data, error } = await supabase
    .from('product_catalog')
    .select(`*, prices:product_prices(*)`)
    .or(`name.ilike.%${query.trim()}%,brand.ilike.%${query.trim()}%`)
    .limit(20)

  if (error) throw error
  return data
}

export async function createProduct({ name, brand, unit, notes }) {
  const user = await getAuthenticatedUser()
  const { data, error } = await supabase
    .from('product_catalog')
    .insert({
      user_id: user.id,
      name,
      brand: brand || null,
      unit: unit || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProduct(id, { name, brand, unit, notes }) {
  const { data, error } = await supabase
    .from('product_catalog')
    .update({ name, brand: brand || null, unit: unit || null, notes: notes || null })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('product_catalog')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function seedDefaultProducts() {
  const user = await getAuthenticatedUser()

  // Obtener nombres existentes para evitar duplicados (comparación case-insensitive)
  const { data: existing, error: fetchError } = await supabase
    .from('product_catalog')
    .select('name')
    .eq('user_id', user.id)

  if (fetchError) throw fetchError

  const existingNames = new Set(
    (existing || []).map((p) => p.name.toLowerCase().trim())
  )

  const rows = DEFAULT_PRODUCTS
    .filter((p) => !existingNames.has(p.name.toLowerCase().trim()))
    .map((p) => ({
      user_id: user.id,
      name: p.name,
      brand: null,
      unit: p.unit || null,
      notes: null,
    }))

  if (rows.length === 0) return []

  const { data, error } = await supabase
    .from('product_catalog')
    .insert(rows)
    .select()

  if (error) throw error
  return data
}

export async function deleteAllProducts() {
  const user = await getAuthenticatedUser()
  const { error } = await supabase
    .from('product_catalog')
    .delete()
    .eq('user_id', user.id)

  if (error) throw error
}

export async function createProductPrice({ product_id, store_name, price, currency }) {
  const user = await getAuthenticatedUser()
  const price_usd = await calcPriceUsd(price, currency)
  const { data, error } = await supabase
    .from('product_prices')
    .insert({
      user_id: user.id,
      product_id,
      store_name,
      price: parseFloat(price),
      currency,
      price_usd,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProductPrice(id, { store_name, price, currency }) {
  const price_usd = await calcPriceUsd(price, currency)
  const { data, error } = await supabase
    .from('product_prices')
    .update({ store_name, price: parseFloat(price), currency, price_usd })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProductPrice(id) {
  const { error } = await supabase
    .from('product_prices')
    .delete()
    .eq('id', id)

  if (error) throw error
}
