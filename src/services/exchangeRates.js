import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

let _ratesCache = null
let _ratesCacheTime = 0
const RATES_TTL = 60_000 // 60s

export async function fetchCurrentRates() {
  if (_ratesCache && Date.now() - _ratesCacheTime < RATES_TTL) {
    return _ratesCache
  }

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .eq('is_current', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  _ratesCache = data
  _ratesCacheTime = Date.now()
  return data
}

export function invalidateRatesCache() {
  _ratesCache = null
  _ratesCacheTime = 0
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

  // Normalizar par (orden alfabético)
  let normalizedFrom, normalizedTo, normalizedRate
  if (from_currency <= to_currency) {
    normalizedFrom = from_currency
    normalizedTo = to_currency
    normalizedRate = rate
  } else {
    normalizedFrom = to_currency
    normalizedTo = from_currency
    normalizedRate = 1 / rate
  }

  const user = await getAuthenticatedUser()

  // Marcar tasas anteriores del mismo par normalizado como no actuales
  await supabase
    .from('exchange_rates')
    .update({ is_current: false })
    .eq('user_id', user.id)
    .eq('normalized_from', normalizedFrom)
    .eq('normalized_to', normalizedTo)
    .eq('is_current', true)

  // Insertar nueva tasa normalizada
  const { data, error } = await supabase
    .from('exchange_rates')
    .insert({
      user_id: user.id,
      from_currency: normalizedFrom,
      to_currency: normalizedTo,
      normalized_from: normalizedFrom,
      normalized_to: normalizedTo,
      rate: normalizedRate,
      source,
      is_current: true,
    })
    .select()
    .single()

  if (error) throw error
  invalidateRatesCache()
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

export async function fetchUSDTRate() {
  // Usar Supabase Edge Function para obtener tasa USDT/USD
  const { data, error } = await supabase.functions.invoke('usdt-rate')

  if (error) {
    throw new Error('No se pudo obtener tasa USDT/USD: ' + error.message)
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data.rate
}

export async function getCurrentRate(fromCurrency, toCurrency) {
  // Normalizar búsqueda
  const normalizedFrom = fromCurrency <= toCurrency ? fromCurrency : toCurrency
  const normalizedTo = fromCurrency <= toCurrency ? toCurrency : fromCurrency
  const invert = fromCurrency > toCurrency

  const { data, error } = await supabase
    .from('exchange_rates')
    .select('rate, source, created_at, from_currency, to_currency')
    .eq('normalized_from', normalizedFrom)
    .eq('normalized_to', normalizedTo)
    .eq('is_current', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return {
    ...data,
    rate: invert ? (1 / parseFloat(data.rate)) : parseFloat(data.rate),
  }
}

export async function deleteRate(rateId) {
  const user = await getAuthenticatedUser()

  const { error } = await supabase
    .from('exchange_rates')
    .delete()
    .eq('id', rateId)
    .eq('user_id', user.id)

  if (error) throw error
  invalidateRatesCache()
}

