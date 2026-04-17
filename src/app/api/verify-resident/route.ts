import { getServiceSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { name, address } = await request.json()

  if (!name || !address) {
    return Response.json({ verified: false, error: 'Name and address required' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { data, error } = await supabase
    .from('residents')
    .select('id, full_name, address, dues_owed')
    .ilike('full_name', name.trim())
    .ilike('address', address.trim())
    .limit(1)
    .single()

  if (error || !data) {
    return Response.json({ verified: false })
  }

  return Response.json({
    verified: true,
    residentId: data.id,
    duesOwed: data.dues_owed || 0,
  })
}
