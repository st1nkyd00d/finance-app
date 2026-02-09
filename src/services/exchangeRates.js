import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

export async function fetchCurrentRates() {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('is_current', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchRateHistory(fromCurrency, toCurrency) {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data
}

export async function setRate({ from_currency, to_currency, rate, source = 'manual' }) {
  if (!rate || rate <= 0 || !isFinite(rate)) {
    throw new Error('La tasa de cambio debe ser un número positivo')
  }

  const user = await getAuthenticatedUser()

  // Marcar tasas anteriores del mismo par como no actuales
  await supabase
    .from('exchange_rates')
    .update({ is_current: false })
    .eq('user_id', user.id)
    .eq('from_currency', from_currency)
    .eq('to_currency', to_currency)
    .eq('is_current', true)

  // Insertar nueva tasa
  const { data, error } = await supabase
    .from('exchange_rates')
    .insert({
      user_id: user.id,
      from_currency,
      to_currency,
      rate,
      source,
      is_current: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function fetchBinanceRate() {
  // Usar Supabase Edge Function para evitar CORS
  const { data, error } = await supabase.functions.invoke('binance-rate', {
    body: { tradeType: 'SELL' },
  })

  if (error) {
    throw new Error('No se pudo obtener tasa de Binance: ' + error.message)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data.rate
}

export async function fetchBCVRate() {
  // Usar Supabase Edge Function para obtener tasa del BCV
  const { data, error } = await supabase.functions.invoke('bcv-rate')

  if (error) {
    throw new Error('No se pudo obtener tasa del BCV: ' + error.message)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data.rate
}

export async function getCurrentRate(fromCurrency, toCurrency) {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate, source, created_at')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

