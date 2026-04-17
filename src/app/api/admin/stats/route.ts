import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()

  const [orders, residents] = await Promise.all([
    supabase.from('orders').select('status, total'),
    supabase.from('residents').select('id, dues_owed'),
  ])

  const allOrders = orders.data || []
  const allResidents = residents.data || []

  return Response.json({
    totalOrders: allOrders.length,
    paidOrders: allOrders.filter(o => o.status === 'paid').length,
    fulfilledOrders: allOrders.filter(o => o.status === 'fulfilled').length,
    totalRevenue: allOrders
      .filter(o => o.status === 'paid' || o.status === 'fulfilled')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    totalResidents: allResidents.length,
    residentsWithDues: allResidents.filter(r => (r.dues_owed || 0) > 0).length,
  })
}
