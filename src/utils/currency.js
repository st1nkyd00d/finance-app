export const CURRENCY_SYMBOLS = {
  VES: 'Bs',
  USD: '$',
  USDT: 'USDT',
}

export function formatAmount(value) {
  return parseFloat(value || 0).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })
}

/**
 * Convierte un monto de cualquier moneda a USD usando las tasas disponibles.
 * La BD almacena tasas como USD → VES (ej: rate = 36.5).
 *
 * @param {number} amount - Monto a convertir
 * @param {string} currency - Moneda de origen ('VES', 'USD', 'USDT')
 * @param {Array} rates - Array de tasas de la BD (con from_currency, to_currency, rate, is_current)
 * @returns {number|null} - Monto en USD, o null si no se puede convertir
 */
export function convertToUSD(amount, currency, rates) {
  if (currency === 'USD') return amount
  if (currency === 'USDT') return amount // 1:1 con USD

  // Buscar tasa USD → currency (dirección almacenada en BD, ej: USD → VES)
  const rate = rates.find(
    (r) => r.from_currency === 'USD' && r.to_currency === currency && r.is_current
  )
  if (rate && parseFloat(rate.rate) > 0) {
    return amount / parseFloat(rate.rate)
  }

  // Buscar tasa inversa: currency → USD
  const inverse = rates.find(
    (r) => r.from_currency === currency && r.to_currency === 'USD' && r.is_current
  )
  if (inverse && parseFloat(inverse.rate) > 0) {
    return amount * parseFloat(inverse.rate)
  }

  // También buscar USDT → currency (la app usa USDT → VES)
  const usdtRate = rates.find(
    (r) => r.from_currency === 'USDT' && r.to_currency === currency && r.is_current
  )
  if (usdtRate && parseFloat(usdtRate.rate) > 0) {
    return amount / parseFloat(usdtRate.rate)
  }

  return null
}

/**
 * Obtiene el monto en USD de una transacción.
 * Usa amount_usd si existe, sino intenta convertir con tasas actuales.
 *
 * @param {object} tx - Transacción con amount, amount_usd, currency
 * @param {Array} rates - Tasas actuales (puede ser null/undefined)
 * @returns {{ amountUsd: number, converted: boolean }}
 */
export function getTxAmountUsd(tx, rates) {
  if (tx.amount_usd != null) {
    return { amountUsd: parseFloat(tx.amount_usd), converted: false }
  }
  if (tx.currency === 'USD' || tx.currency === 'USDT') {
    return { amountUsd: parseFloat(tx.amount), converted: false }
  }
  if (rates) {
    const result = convertToUSD(parseFloat(tx.amount), tx.currency, rates)
    if (result !== null) {
      return { amountUsd: result, converted: true }
    }
  }
  return { amountUsd: 0, converted: false }
}
