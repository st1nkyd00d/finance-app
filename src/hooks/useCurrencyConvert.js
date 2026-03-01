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

  // Buscar tasa usando normalización
  const getRate = useCallback((from, to) => {
    if (from === to) return 1

    // Normalizar búsqueda
    const normalizedFrom = from <= to ? from : to
    const normalizedTo = from <= to ? to : from
    const invert = from > to

    const rate = rates.find(
      (r) => r.normalized_from === normalizedFrom && r.normalized_to === normalizedTo
    )

    if (rate) {
      const value = parseFloat(rate.rate)
      return invert ? (1 / value) : value
    }

    // Intentar conversion cruzada via USD
    if (from !== 'USD' && to !== 'USD') {
      const fromToUsd = getRate(from, 'USD')
      const usdToTo = getRate('USD', to)
      if (fromToUsd && usdToTo) return fromToUsd * usdToTo
    }

    return null
  }, [rates])

  const convert = useCallback((amount, from, to) => {
    const rate = getRate(from, to)
    if (rate === null) return null
    return amount * rate
  }, [getRate])

  // Obtener la tasa mas vieja entre las actuales (para saber frescura)
  const getOldestRateDate = useCallback(() => {
    if (rates.length === 0) return null
    const dates = rates.map((r) => new Date(r.created_at))
    return new Date(Math.min(...dates))
  }, [rates])

  return { rates, loading, convert, getRate, getOldestRateDate, reload }
}
