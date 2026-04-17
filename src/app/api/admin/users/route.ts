import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  const { email, role } = await request.json()
  if (!email || !role) {
    return Response.json({ error: 'Email and role required' }, { status: 400 })
  }
  if (!['editor', 'validator'].includes(role)) {
    return Response.json({ error: 'Role must be editor or validator' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('admin_users')
    .insert({ email: email.toLowerCase().trim(), role })

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'This email is already an admin user' }, { status: 400 })
    }
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json({ success: true })
}

export async function PATCH(request: Request) {
  const { id, role } = await request.json()
  if (!id || !role) {
    return Response.json({ error: 'ID and role required' }, { status: 400 })
  }
  if (!['editor', 'validator'].includes(role)) {
    return Response.json({ error: 'Role must be editor or validator' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('admin_users')
    .update({ role })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function DELETE(request: Request) {
  const { id } = await request.json()
  if (!id) {
    return Response.json({ error: 'ID required' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('admin_users')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
