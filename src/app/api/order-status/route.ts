import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return Response.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const supabase = getServiceSupabase()

    if (session.payment_status === 'paid' && session.metadata?.order_number) {
      await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .eq('order_number', session.metadata.order_number)

      if (session.metadata.resident_id) {
        await supabase
          .from('residents')
          .update({ dues_owed: 0 })
          .eq('id', session.metadata.resident_id)
      }
    }

    const { data: order } = await supabase
      .from('orders')
      .select('order_number, total, customer_name, customer_email')
      .eq('stripe_session_id', sessionId)
      .single()

    const mapped = order ? {
      orderNumber: order.order_number,
      total: order.total,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
    } : null

    return Response.json({ order: mapped })
  } catch (err) {
    console.error('Order status error:', err)
    return Response.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
