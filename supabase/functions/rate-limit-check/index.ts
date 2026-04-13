/**
 * Edge Function: Rate Limit Check
 * 
 * SECURITY: Server-side rate limiting for auth endpoints.
 * Records auth attempts and checks if the user is rate-limited.
 * Implements exponential backoff for repeated failures.
 * 
 * Endpoints:
 * POST /check  — Check if an identifier is rate-limited
 * POST /record — Record an auth attempt (success or failure)
 * POST /cleanup — Remove old entries (called periodically)
 */

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Use service role to access rate_limits table (no RLS policies)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const { action, identifier, attempt_type, success } = body

    // Validate input
    if (!identifier || typeof identifier !== 'string' || identifier.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Invalid identifier' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!attempt_type || !['login', 'signup', 'reset', 'contact'].includes(attempt_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid attempt type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'check') {
      // Check rate limit using the database function
      const { data, error } = await supabase.rpc('check_rate_limit', {
        _identifier: identifier.toLowerCase().trim(),
        _attempt_type: attempt_type,
        _max_attempts: attempt_type === 'login' ? 5 : 3,
        _window_minutes: 15,
      })

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          rate_limited: data === true,
          message: data ? 'Too many attempts. Please try again later.' : 'OK',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'record') {
      // Record the attempt
      const { error } = await supabase
        .from('auth_rate_limits')
        .insert({
          identifier: identifier.toLowerCase().trim(),
          attempt_type,
          success: success === true,
        })

      if (error) throw error

      return new Response(
        JSON.stringify({ recorded: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'cleanup') {
      // Cleanup old entries
      const { error } = await supabase.rpc('cleanup_old_rate_limits')
      if (error) throw error

      return new Response(
        JSON.stringify({ cleaned: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    // SECURITY: Never expose internal error details
    console.error('Rate limit error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
