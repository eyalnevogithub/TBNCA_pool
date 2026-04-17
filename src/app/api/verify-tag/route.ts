import { getServiceSupabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: order, error } = await supabase
    .from('orders')
    .select('order_number, customer_name, customer_address, customer_email, is_resident, total, status, qr_valid, created_at, order_items(product_name, quantity, pass_date)')
    .eq('qr_token', token)
    .single()

  if (error || !order) {
    return Response.json({ valid: false, error: 'QR code not found' })
  }

  const tagCount = (order.order_items || [])
    .filter((i: { product_name: string }) => i.product_name === 'Pool Tag')
    .reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0)

  const dayPasses = (order.order_items || [])
    .filter((i: { product_name: string }) => i.product_name === 'Day Pass')
    .map((i: { quantity: number; pass_date: string | null }) => ({
      quantity: i.quantity,
      date: i.pass_date,
    }))

  const isValid = order.qr_valid && (order.status === 'paid' || order.status === 'fulfilled')

  return Response.json({
    valid: isValid,
    invalidated: !order.qr_valid,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerAddress: order.customer_address,
    customerEmail: order.customer_email,
    isResident: order.is_resident,
    status: order.status,
    tagCount,
    dayPasses,
    total: order.total,
    createdAt: order.created_at,
  })
}
