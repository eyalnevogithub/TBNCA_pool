import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .order('product_type')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  return Response.json(data)
}
