import { getServiceSupabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return Response.json({ error: 'Missing email' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, role')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !data) {
    return Response.json({ authorized: false })
  }

  return Response.json({ authorized: true, role: data.role, email: data.email })
}
