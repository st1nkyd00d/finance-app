// Supabase Edge Function para obtener la tasa del Dólar BCV
// Usa la API de pydolarve como fuente (datos del BCV)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Usar API de pydolarve que obtiene datos del BCV
    const response = await fetch('https://pydolarve.org/api/v1/dollar?page=bcv', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error en API: ${response.status}`)
    }

    const data = await response.json()

    // La API devuelve { monitors: { usd: { price: X.XX, ... } } }
    const usdRate = data?.monitors?.usd?.price

    if (!usdRate || usdRate <= 0) {
      throw new Error('No se pudo obtener la tasa del BCV')
    }

    return new Response(
      JSON.stringify({
        rate: Math.round(usdRate * 100) / 100,
        source: 'BCV',
        currency: 'USD/VES',
        last_update: data?.monitors?.usd?.last_update || null,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // Fallback: intentar con API alternativa
    try {
      const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
        headers: { 'Accept': 'application/json' },
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.promedio) {
          return new Response(
            JSON.stringify({
              rate: Math.round(data.promedio * 100) / 100,
              source: 'BCV',
              currency: 'USD/VES',
              timestamp: new Date().toISOString(),
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } catch {
      // Ignorar error del fallback
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Error al obtener tasa del BCV' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
