// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const TRUSTED_ORIGIN = 'app://Theta-desktop'
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 30
const requestCounters = new Map<string, { count: number; windowStart: number }>()

const corsHeaders = {
  'Access-Control-Allow-Origin': TRUSTED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-Theta-client-id, x-Theta-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const isRateLimited = (clientId: string) => {
  const now = Date.now()
  const existing = requestCounters.get(clientId)

  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounters.set(clientId, { count: 1, windowStart: now })
    return false
  }

  existing.count += 1
  requestCounters.set(clientId, existing)
  return existing.count > RATE_LIMIT_MAX_REQUESTS
}

console.log("OpenAI Proxy Function Initialized")

Deno.serve(async (req) => {
  // 1. Handle CORS (Browser security) - Allow requests from your app
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestOrigin = req.headers.get('origin') || ''
  if (requestOrigin && requestOrigin !== TRUSTED_ORIGIN) {
    return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const token = authHeader.replace('Bearer ', '').trim()
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Supabase auth not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data: authData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const clientId = req.headers.get('x-Theta-client-id')
  const requestTsHeader = req.headers.get('x-Theta-timestamp')
  const requestTs = requestTsHeader ? Number(requestTsHeader) : NaN
  if (!clientId || !Number.isFinite(requestTs) || Math.abs(Date.now() - requestTs) > 5 * 60 * 1000) {
    return new Response(JSON.stringify({ error: 'Missing or invalid rate-limit headers' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (isRateLimited(clientId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    })
  }

  try {
    // 2. Get the OpenAI Key from Supabase Secrets (Secure Vault)
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) {
      throw new Error('OpenAI API Key not configured in Supabase Secrets')
    }

    // 3. Get the data sent from your Desktop App
    const { messages, model = 'gpt-4o-mini' } = await req.json()

    // 4. Call OpenAI API securely from the server side
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
      }),
    })

    const data = await openAIResponse.json()

    // 5. Return the result to your Desktop App
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
