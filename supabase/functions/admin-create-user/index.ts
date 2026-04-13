import { corsHeaders } from '@supabase/supabase-js/cors'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Verify the caller is an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Create client with user's token to verify identity
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user: caller } } = await userClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check admin role using service role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem criar contas' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, senha e nome são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create user with admin API (auto-confirms email)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Mark must_change_password
    await adminClient
      .from('profiles')
      .update({ must_change_password: true })
      .eq('user_id', newUser.user.id)

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: newUser.user.id, email: newUser.user.email } 
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
