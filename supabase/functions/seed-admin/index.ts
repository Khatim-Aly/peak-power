import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Admin credentials from environment variables - never hardcode secrets
const DEFAULT_ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')
const DEFAULT_ADMIN_PASSWORD = Deno.env.get('ADMIN_PASSWORD')
const DEFAULT_ADMIN_NAME = Deno.env.get('ADMIN_NAME') || 'Admin'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ success: false, error: 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client with service role key for user management
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if any admin exists
    const { data: existingAdmins, error: adminCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)

    // Only allow bootstrap if no admins exist
    const hasExistingAdmin = existingAdmins && existingAdmins.length > 0

    if (hasExistingAdmin) {
      // If admins exist, require authentication
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Admin already exists. This endpoint is disabled for security.',
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check if default admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUsers?.users?.some(u => u.email === DEFAULT_ADMIN_EMAIL)

    if (adminExists) {
      // Find the user and ensure they have admin role
      const existingAdmin = existingUsers?.users?.find(u => u.email === DEFAULT_ADMIN_EMAIL)
      if (existingAdmin) {
        // Ensure admin role exists
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .upsert({ 
            user_id: existingAdmin.id, 
            role: 'admin' 
          }, { 
            onConflict: 'user_id' 
          })
        
        if (!roleError) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Admin user already exists and role verified',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user already exists',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: DEFAULT_ADMIN_EMAIL,
      password: DEFAULT_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: DEFAULT_ADMIN_NAME,
      },
    })

    if (createError) {
      throw createError
    }

    // Update the user_roles table to ensure admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({ 
        user_id: newUser.user.id, 
        role: 'admin' 
      }, { 
        onConflict: 'user_id' 
      })

    if (roleError) {
      console.error('Role update error:', roleError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
