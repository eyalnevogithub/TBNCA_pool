export interface Resident {
  id: string
  full_name: string
  address: string
  email: string | null
  dues_owed: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  price_resident: number
  price_guest: number
  max_quantity: number
  product_type: 'pool_tag' | 'day_pass'
  active: boolean
  created_at: string
}

export interface Order {
  id: string
  order_number: string
  resident_id: string | null
  customer_name: string
  customer_address: string
  customer_email: string
  is_resident: boolean
  total: number
  dues_amount: number
  status: 'pending' | 'paid' | 'fulfilled' | 'cancelled'
  stripe_payment_intent_id: string | null
  waiver_name: string
  waiver_date: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  pass_date: string | null
}

export interface CartItem {
  product: Product
  quantity: number
  unitPrice: number
  passDate?: string
}
