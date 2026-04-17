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
  const body = await request.json()
  const { orderId, status, adminEmail, action } = body
  const supabase = getServiceSupabase()

  if (action === 'invalidate_qr') {
    const { error } = await supabase
      .from('orders')
      .update({ qr_valid: false })
      .eq('id', orderId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

  if (action === 'reactivate_qr') {
    const { error } = await supabase
      .from('orders')
      .update({ qr_valid: true })
      .eq('id', orderId)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

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
