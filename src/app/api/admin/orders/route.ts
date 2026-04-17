import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  const { orderId, status, adminEmail } = await request.json()
  const supabase = getServiceSupabase()

  const updates: Record<string, unknown> = { status }

  if (status === 'fulfilled') {
    updates.fulfilled_by = adminEmail || 'unknown'
    updates.fulfilled_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
