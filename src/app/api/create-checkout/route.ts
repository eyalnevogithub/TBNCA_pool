import { stripe } from '@/lib/stripe'
import { getServiceSupabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const STREET_ABBREVIATIONS: Record<string, string> = {
  street: 'st', st: 'st', lane: 'ln', ln: 'ln', drive: 'dr', dr: 'dr',
  court: 'ct', ct: 'ct', circle: 'cir', cir: 'cir', boulevard: 'blvd',
  blvd: 'blvd', avenue: 'ave', ave: 'ave', place: 'pl', pl: 'pl',
  road: 'rd', rd: 'rd', terrace: 'ter', ter: 'ter', trail: 'trl',
  trl: 'trl', parkway: 'pkwy', pkwy: 'pkwy', way: 'way',
}

function normalizeAddress(str: string): string {
  return str.trim().toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, ' ')
    .split(' ').map(w => STREET_ABBREVIATIONS[w] || w).join(' ')
}

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

  const { data: products } = await supabase
    .from('products')
    .select('id, max_quantity, product_type, price_resident, price_guest')
  const tagProduct = products?.find(p => p.product_type === 'pool_tag')
  const passProduct = products?.find(p => p.product_type === 'day_pass')

  let existingTags = 0
  const existingPassesByDate: Record<string, number> = {}

  if (isResident && customerAddress) {
    const normalizedAddr = normalizeAddress(customerAddress)

    const { data: allResidents } = await supabase.from('residents').select('id, address')
    const householdIds = (allResidents || [])
      .filter(r => normalizeAddress(r.address) === normalizedAddr)
      .map(r => r.id)

    if (householdIds.length > 0) {
      const { data: pastOrders } = await supabase
        .from('orders')
        .select('order_items(product_name, quantity, pass_date)')
        .in('resident_id', householdIds)
        .in('status', ['paid', 'fulfilled'])

      for (const order of pastOrders || []) {
        for (const item of order.order_items || []) {
          if (item.product_name === 'Pool Tag') {
            existingTags += item.quantity
          } else if (item.product_name === 'Day Pass' && item.pass_date) {
            existingPassesByDate[item.pass_date] = (existingPassesByDate[item.pass_date] || 0) + item.quantity
          }
        }
      }

      let newTags = 0
      const newPassesByDate: Record<string, number> = {}
      for (const item of items) {
        if (item.productName === 'Pool Tag') {
          newTags += item.quantity
        } else if (item.productName === 'Day Pass' && item.passDate) {
          newPassesByDate[item.passDate] = (newPassesByDate[item.passDate] || 0) + item.quantity
        }
      }

      if (tagProduct && existingTags + newTags > tagProduct.max_quantity) {
        const remaining = Math.max(0, tagProduct.max_quantity - existingTags)
        return Response.json({
          error: `Your household has already purchased ${existingTags} pool tag(s). The limit is ${tagProduct.max_quantity} per household. You can purchase ${remaining} more.`,
        }, { status: 400 })
      }

      if (passProduct) {
        for (const [date, qty] of Object.entries(newPassesByDate)) {
          const existingForDate = existingPassesByDate[date] || 0
          if (existingForDate + qty > passProduct.max_quantity) {
            const remaining = Math.max(0, passProduct.max_quantity - existingForDate)
            return Response.json({
              error: `Your household has already purchased ${existingForDate} day pass(es) for ${date}. The limit is ${passProduct.max_quantity} per household per day. You can purchase ${remaining} more for that date.`,
            }, { status: 400 })
          }
        }
      }
    }
  }

  const orderNumber = `TBNCA-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`
  const qrToken = uuidv4()

  let subtotal = 0
  const lineItems: { price_data: { currency: string; product_data: { name: string; description?: string }; unit_amount: number }; quantity: number }[] = []

  for (const item of items) {
    if (item.productName === 'Pool Tag' && tagProduct) {
      const firstPrice = tagProduct.price_resident
      const additionalPrice = tagProduct.price_guest
      const isFirstEver = existingTags === 0

      if (isFirstEver && item.quantity >= 1) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'Pool Tag' },
            unit_amount: Math.round(firstPrice * 100),
          },
          quantity: 1,
        })
        if (item.quantity > 1) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: { name: 'Pool Tag (additional)' },
              unit_amount: Math.round(additionalPrice * 100),
            },
            quantity: item.quantity - 1,
          })
        }
        subtotal += firstPrice + (item.quantity - 1) * additionalPrice
      } else {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'Pool Tag' },
            unit_amount: Math.round(additionalPrice * 100),
          },
          quantity: item.quantity,
        })
        subtotal += additionalPrice * item.quantity
      }
    } else {
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
  }

  if (duesAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Outstanding HOA Dues' },
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
      qr_token: qrToken,
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
