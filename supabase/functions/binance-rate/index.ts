// Supabase Edge Function para obtener tasa USDT/VES de Binance P2P
// Esto evita el problema de CORS al hacer la petición desde el servidor

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
    // Obtener parámetros opcionales del query string
    const url = new URL(req.url)
    const tradeType = url.searchParams.get('tradeType') || 'SELL'
    const rows = parseInt(url.searchParams.get('rows') || '10')

    // Llamar a la API de Binance P2P (servidor a servidor, sin CORS)
    const response = await fetch('https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        asset: 'USDT',
        fiat: 'VES',
        merchantCheck: true,
        page: 1,
        payTypes: [],
        rows: rows,
        tradeType: tradeType,
      }),
    })

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`)
    }

    const data = await response.json()
    const ads = data.data || []

    if (ads.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No se encontraron ofertas en Binance P2P' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Calcular estadísticas de las ofertas
    const prices = ads.map((ad: any) => parseFloat(ad.adv.price))
    const average = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length
    const min = Math.min(...prices)
    const max = Math.max(...prices)

    // Retornar la tasa promedio y estadísticas
    return new Response(
      JSON.stringify({
        rate: Math.round(average * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        count: ads.length,
        tradeType: tradeType,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || 'Error al obtener tasa de Binance' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
