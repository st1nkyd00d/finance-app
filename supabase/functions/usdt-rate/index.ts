// Supabase Edge Function para obtener tasa USDT/USD
// Usa CoinGecko como fuente principal y CryptoCompare como fallback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Fuente principal: CoinGecko (gratuita y confiable)
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()
    const price = data?.tether?.usd

    if (!price || price <= 0) {
      throw new Error('Precio inválido recibido de CoinGecko')
    }

    // Retornar la tasa
    return new Response(
      JSON.stringify({
        rate: Math.round(price * 1000000) / 1000000, // 6 decimales
        source: 'coingecko',
        pair: 'USDT/USD',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    // Fallback: CryptoCompare
    try {
      const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=USDT&tsyms=USD', {
        headers: {
          'Accept': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const price = data?.USD

        if (price && price > 0) {
          return new Response(
            JSON.stringify({
              rate: Math.round(price * 1000000) / 1000000,
              source: 'cryptocompare',
              pair: 'USDT/USD',
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          )
        }
      }
    } catch {
      // Ignorar error del fallback
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Error al obtener tasa USDT/USD' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
