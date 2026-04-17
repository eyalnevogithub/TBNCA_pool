import { getServiceSupabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key')
  if (!key) {
    return Response.json({ error: 'Missing key parameter' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    return Response.json({ value: null })
  }

  return Response.json({ value: data.value })
}

export async function PUT(request: Request) {
  const { key, value } = await request.json()

  if (!key || value === undefined) {
    return Response.json({ error: 'Missing key or value' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
