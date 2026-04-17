import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface OrderConfirmationParams {
  to: string
  customerName: string
  orderNumber: string
  total: number
  items: { name: string; quantity: number; unitPrice: number; passDate?: string | null }[]
  duesAmount: number
}

export async function sendOrderConfirmation({
  to,
  customerName,
  orderNumber,
  total,
  items,
  duesAmount,
}: OrderConfirmationParams) {
  const itemRows = items
    .map(i => {
      const date = i.passDate ? ` (${i.passDate})` : ''
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${i.name}${date}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>`
    })
    .join('')

  const duesRow = duesAmount > 0
    ? `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">Outstanding HOA Dues</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">1</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">$${duesAmount.toFixed(2)}</td>
      </tr>`
    : ''

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1a3a5c;padding:24px;text-align:center">
        <h1 style="color:#ffffff;margin:0;font-size:24px">TBNCA Pool</h1>
      </div>
      <div style="padding:24px;background:#ffffff">
        <h2 style="color:#1a3a5c;margin-top:0">Order Confirmation</h2>
        <p>Hi ${customerName},</p>
        <p>Thank you for your purchase! Here are your order details:</p>
        <p style="background:#f7fafc;padding:12px;border-radius:6px;font-family:monospace;font-size:18px;font-weight:bold">
          Order #${orderNumber}
        </p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead>
            <tr style="background:#f7fafc">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e2e8f0">Item</th>
              <th style="padding:8px 12px;text-align:center;border-bottom:2px solid #e2e8f0">Qty</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e2e8f0">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            ${duesRow}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:12px;font-weight:bold;text-align:right;border-top:2px solid #1a3a5c">Total</td>
              <td style="padding:12px;font-weight:bold;text-align:right;border-top:2px solid #1a3a5c;font-size:18px;color:#1a3a5c">$${total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="background:#f0fff4;border:1px solid #c6f6d5;border-radius:6px;padding:16px;margin:16px 0">
          <p style="margin:0;color:#276749"><strong>What's next?</strong></p>
          <p style="margin:8px 0 0;color:#276749">Your pool tags will be prepared for pickup or mailing. You will receive further instructions from the management office.</p>
        </div>
        <p style="color:#718096;font-size:14px">
          Questions? Contact Marshall Management Group at (713) 977-6644 or
          <a href="mailto:ops@mmgihouston.com" style="color:#2c5282">ops@mmgihouston.com</a>.
        </p>
      </div>
      <div style="background:#f7fafc;padding:16px;text-align:center;color:#a0aec0;font-size:12px">
        Thunderbird North Community Association
      </div>
    </div>
  `

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'TBNCA Pool <onboarding@resend.dev>',
    to,
    subject: `Order Confirmation - ${orderNumber}`,
    html,
  })

  if (error) {
    console.error('Email send error:', error)
  }

  return { error }
}
