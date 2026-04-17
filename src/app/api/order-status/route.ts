import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { sendOrderConfirmation } from '@/lib/email'
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
      const { data: existing } = await supabase
        .from('orders')
        .select('status')
        .eq('order_number', session.metadata.order_number)
        .single()

      const alreadyPaid = existing?.status === 'paid' || existing?.status === 'fulfilled'

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

      if (!alreadyPaid) {
        const { data: orderForEmail } = await supabase
          .from('orders')
          .select('order_number, total, customer_name, customer_email, dues_amount, qr_token, order_items(product_name, quantity, unit_price, pass_date)')
          .eq('order_number', session.metadata.order_number)
          .single()

        if (orderForEmail) {
          const productItems = (orderForEmail.order_items || [])
            .filter((i: { product_name: string }) => i.product_name !== 'Outstanding HOA Dues')

          await sendOrderConfirmation({
            to: orderForEmail.customer_email,
            customerName: orderForEmail.customer_name,
            orderNumber: orderForEmail.order_number,
            total: orderForEmail.total,
            items: productItems.map((i: { product_name: string; quantity: number; unit_price: number; pass_date: string | null }) => ({
              name: i.product_name,
              quantity: i.quantity,
              unitPrice: i.unit_price,
              passDate: i.pass_date,
            })),
            duesAmount: orderForEmail.dues_amount || 0,
            qrToken: orderForEmail.qr_token,
          })
        }
      }
    }

    const { data: order } = await supabase
      .from('orders')
      .select('order_number, total, customer_name, customer_email, qr_token')
      .eq('stripe_session_id', sessionId)
      .single()

    const mapped = order ? {
      orderNumber: order.order_number,
      total: order.total,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      qrToken: order.qr_token,
    } : null

    return Response.json({ order: mapped })
  } catch (err) {
    console.error('Order status error:', err)
    return Response.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}
