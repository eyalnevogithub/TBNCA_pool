'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { CartItem, Product } from '@/lib/types'

interface WaiverData {
  name: string
  date: string
}

interface CartContextType {
  items: CartItem[]
  waiver: WaiverData | null
  addItem: (product: Product, quantity: number, unitPrice: number, passDate?: string) => void
  removeItem: (index: number) => void
  clearCart: () => void
  setWaiver: (waiver: WaiverData) => void
  getSubtotal: () => number
  getItemCount: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [waiver, setWaiver] = useState<WaiverData | null>(null)

  function addItem(product: Product, quantity: number, unitPrice: number, passDate?: string) {
    setItems(prev => {
      const existing = prev.findIndex(
        i => i.product.id === product.id && i.passDate === passDate
      )
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + quantity }
        return updated
      }
      return [...prev, { product, quantity, unitPrice, passDate }]
    })
  }

  function removeItem(index: number) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  function clearCart() {
    setItems([])
    setWaiver(null)
  }

  function getSubtotal() {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }

  function getItemCount() {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <CartContext.Provider value={{ items, waiver, addItem, removeItem, clearCart, setWaiver, getSubtotal, getItemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
