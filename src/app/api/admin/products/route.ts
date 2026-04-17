import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('product_type')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ...updates } = body
  const supabase = getServiceSupabase()

  const { error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
