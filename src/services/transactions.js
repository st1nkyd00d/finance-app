import { supabase } from './supabase'
import { getAuthenticatedUser } from '../utils/auth'

const TX_SELECT = `
  *,
  wallet:wallets(id, name, currency),
  category:categories(id, name, type, color),
  goal:savings_goals(id, name, target_amount)
`

export async function fetchTransactions({
  limit = 20,
  offset = 0,
  types = null,
  walletIds = null,
  categoryIds = null,
  dateFrom = null,
  dateTo = null,
  search = null,
} = {}) {
  let query = supabase
    .from('transactions')
    .select(TX_SELECT, { count: 'exact' })

  // Filtro por tipos
  if (types && types.length > 0) {
    query = query.in('type', types)
  }

  // Filtro por billeteras
  if (walletIds && walletIds.length > 0) {
    query = query.in('wallet_id', walletIds)
  }

  // Filtro por categorias
  if (categoryIds && categoryIds.length > 0) {
    query = query.in('category_id', categoryIds)
  }

  // Filtro por fecha desde
  if (dateFrom) {
    query = query.gte('date', dateFrom)
  }

  // Filtro por fecha hasta
  if (dateTo) {
    query = query.lte('date', dateTo + 'T23:59:59')
  }

  // Busqueda por texto en descripcion
  if (search && search.trim()) {
    query = query.ilike('description', `%${search.trim()}%`)
  }

  query = query
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) throw error
  return { data, count }
}

export async function createTransaction({ wallet_id, category_id, type, amount, description, date, exchange_rate: customRate, goal_id }) {
  const user = await getAuthenticatedUser()

  // Validación: goal_id solo para savings
  if (goal_id && type !== 'savings') {
    throw new Error('Las metas solo se pueden asignar a transacciones de ahorro')
  }

  // Validación: savings requiere goal_id
  if (type === 'savings' && !goal_id) {
    throw new Error('Las transacciones de ahorro requieren una meta asignada')
  }

  // Validación: income/expense requieren category_id, savings no
  if (type !== 'savings' && !category_id) {
    throw new Error('Las transacciones de ingreso y gasto requieren una categoría')
  }

  // Obtener moneda de la billetera
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('currency')
    .eq('id', wallet_id)
    .single()

  if (walletError) throw walletError

  // Determinar tasa de cambio y calcular amount_usd
  let exchangeRate = customRate || null
  let amountUsd = null

  if (wallet.currency === 'USD' || wallet.currency === 'USDT') {
    // USD y USDT se tratan como equivalentes 1:1
    amountUsd = parseFloat(amount)
  } else if (wallet.currency === 'VES') {
    // Para VES, necesitamos la tasa USDT/VES
    if (!exchangeRate) {
      const { data: rateData } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USDT')
        .eq('to_currency', 'VES')
        .eq('is_current', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (rateData) {
        exchangeRate = rateData.rate
      }
    }

    if (exchangeRate && exchangeRate > 0) {
      amountUsd = Math.round((parseFloat(amount) / exchangeRate) * 100) / 100
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      wallet_id,
      category_id: type === 'savings' ? null : category_id,
      type,
      amount,
      currency: wallet.currency,
      exchange_rate: exchangeRate,
      amount_usd: amountUsd,
      description: description || null,
      date: date || new Date().toISOString(),
      goal_id: goal_id || null,
    })
    .select(TX_SELECT)
    .single()

  if (error) throw error
  return data
}

export async function createTransfer({
  from_wallet_id,
  to_wallet_id,
  amount_out,
  amount_in,
  conversion_rate,
  description,
  date,
}) {
  const user = await getAuthenticatedUser()

  // Obtener monedas de las billeteras
  const { data: fromWallet } = await supabase
    .from('wallets')
    .select('currency')
    .eq('id', from_wallet_id)
    .single()

  const { data: toWallet } = await supabase
    .from('wallets')
    .select('currency')
    .eq('id', to_wallet_id)
    .single()

  const txDate = date || new Date().toISOString()
  const desc = description || null

  // Calcular amount_usd para ambas transacciones
  function calculateAmountUsd(amount, currency, rate) {
    if (currency === 'USD' || currency === 'USDT') {
      return parseFloat(amount)
    } else if (currency === 'VES' && rate && rate > 0) {
      return Math.round((parseFloat(amount) / rate) * 100) / 100
    }
    return null
  }

  const amountUsdOut = calculateAmountUsd(amount_out, fromWallet.currency, conversion_rate)
  const amountUsdIn = calculateAmountUsd(amount_in, toWallet.currency, conversion_rate)

  // Llamar RPC atómico (stored procedure) — débito, crédito y vinculación
  // se ejecutan en una sola transacción de BD, evitando estados parciales
  const { data, error } = await supabase.rpc('create_transfer', {
    p_user_id: user.id,
    p_from_wallet_id: from_wallet_id,
    p_to_wallet_id: to_wallet_id,
    p_amount_out: amount_out,
    p_amount_in: amount_in,
    p_currency_out: fromWallet.currency,
    p_currency_in: toWallet.currency,
    p_description: desc,
    p_date: txDate,
    p_conversion_rate: conversion_rate || null,
    p_amount_usd_out: amountUsdOut,
    p_amount_usd_in: amountUsdIn,
  })

  if (error) throw error

  return { txOut: { id: data.out_id }, txIn: { id: data.in_id } }
}

export async function deleteTransaction(id) {
  // Verificar si tiene transaccion vinculada
  const { data: tx } = await supabase
    .from('transactions')
    .select('id, linked_transaction_id')
    .eq('id', id)
    .single()

  if (tx?.linked_transaction_id) {
    // Desvincular primero para evitar constraint issues
    const { error: e1 } = await supabase
      .from('transactions')
      .update({ linked_transaction_id: null })
      .eq('id', tx.linked_transaction_id)

    if (e1) throw new Error('Error al desvincular transacción vinculada')

    const { error: e2 } = await supabase
      .from('transactions')
      .update({ linked_transaction_id: null })
      .eq('id', id)

    if (e2) throw new Error('Error al desvincular transacción principal')

    // Eliminar la vinculada
    const { error: e3 } = await supabase
      .from('transactions')
      .delete()
      .eq('id', tx.linked_transaction_id)

    if (e3) throw new Error('Error al eliminar transacción vinculada')
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function fetchWalletBalances() {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('*')

  if (error) throw error
  return data
}
