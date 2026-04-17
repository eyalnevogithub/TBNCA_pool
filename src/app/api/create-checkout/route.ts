import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    items,
    customerName,
    customerAddress,
    customerEmail,
    residentId,
    isResident,
    duesAmount,
    waiverName,
    waiverDate,
  } = body

  if (!items?.length || !customerName || !customerEmail) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const orderNumber = `TBNCA-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`

  let subtotal = 0
  const lineItems: { price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number }; quantity: number }[] = []

  for (const item of items) {
    const amount = Math.round(item.unitPrice * 100)
    subtotal += item.unitPrice * item.quantity
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.productName,
          description: item.passDate ? `Date: ${item.passDate}` : undefined,
        },
        unit_amount: amount,
      },
      quantity: item.quantity,
    })
  }

  if (duesAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Outstanding HOA Dues',
        },
        unit_amount: Math.round(duesAmount * 100),
      },
      quantity: 1,
    })
    subtotal += duesAmount
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cancel`,
      metadata: {
        order_number: orderNumber,
        customer_name: customerName,
        customer_address: customerAddress,
        resident_id: residentId || '',
        is_resident: isResident ? 'true' : 'false',
      },
    })

    const { error: orderError } = await supabase.from('orders').insert({
      order_number: orderNumber,
      resident_id: residentId || null,
      customer_name: customerName,
      customer_address: customerAddress,
      customer_email: customerEmail,
      is_resident: isResident,
      total: subtotal,
      dues_amount: duesAmount || 0,
      status: 'pending',
      stripe_session_id: session.id,
      waiver_name: waiverName,
      waiver_date: waiverDate,
    })

    if (orderError) {
      console.error('Order insert error:', orderError)
    }

    const orderData = await supabase
      .from('orders')
      .select('id')
      .eq('order_number', orderNumber)
      .single()

    if (orderData.data) {
      const orderItems = items.map((item: { productId: string; productName: string; quantity: number; unitPrice: number; passDate: string | null }) => ({
        order_id: orderData.data.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.unitPrice * item.quantity,
        pass_date: item.passDate || null,
      }))

      if (duesAmount > 0) {
        orderItems.push({
          order_id: orderData.data.id,
          product_id: null as unknown as string,
          product_name: 'Outstanding HOA Dues',
          quantity: 1,
          unit_price: duesAmount,
          subtotal: duesAmount,
          pass_date: null,
        })
      }

      await supabase.from('order_items').insert(orderItems)
    }

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('Stripe error:', err)
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
