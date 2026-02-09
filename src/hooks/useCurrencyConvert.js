import { useState, useEffect, useCallback } from 'react'
import { fetchCurrentRates } from '../services/exchangeRates'

export default function useCurrencyConvert() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCurrentRates()
      .then(setRates)
      .catch(() => setRates([]))
      .finally(() => setLoading(false))
  }, [])

  const reload = useCallback(() => {
    setLoading(true)
    fetchCurrentRates()
      .then(setRates)
      .catch(() => setRates([]))
      .finally(() => setLoading(false))
  }, [])

  // Buscar tasa directa o inversa
  function getRate(from, to) {
    if (from === to) return 1

    const direct = rates.find(
      (r) => r.from_currency === from && r.to_currency === to
    )
    if (direct) return parseFloat(direct.rate)

    const inverse = rates.find(
      (r) => r.from_currency === to && r.to_currency === from
    )
    if (inverse) return 1 / parseFloat(inverse.rate)

    // Intentar conversion cruzada via USD
    if (from !== 'USD' && to !== 'USD') {
      const fromToUsd = getRate(from, 'USD')
      const usdToTo = getRate('USD', to)
      if (fromToUsd && usdToTo) return fromToUsd * usdToTo
    }

    return null
  }

  function convert(amount, from, to) {
    const rate = getRate(from, to)
    if (rate === null) return null
    return amount * rate
  }

  // Obtener la tasa mas vieja entre las actuales (para saber frescura)
  function getOldestRateDate() {
    if (rates.length === 0) return null
    const dates = rates.map((r) => new Date(r.created_at))
    return new Date(Math.min(...dates))
  }

  return { rates, loading, convert, getRate, getOldestRateDate, reload }
}
