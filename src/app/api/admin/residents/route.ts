import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('residents')
    .select('*')
    .order('full_name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function PATCH(request: Request) {
  const { residentId, duesOwed } = await request.json()
  const supabase = getServiceSupabase()

  const { error } = await supabase
    .from('residents')
    .update({ dues_owed: duesOwed })
    .eq('id', residentId)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
