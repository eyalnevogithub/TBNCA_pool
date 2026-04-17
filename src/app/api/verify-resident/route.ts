import { getServiceSupabase } from '@/lib/supabase'

const STREET_ABBREVIATIONS: Record<string, string> = {
  street: 'st', st: 'st',
  lane: 'ln', ln: 'ln',
  drive: 'dr', dr: 'dr',
  court: 'ct', ct: 'ct',
  circle: 'cir', cir: 'cir',
  boulevard: 'blvd', blvd: 'blvd',
  avenue: 'ave', ave: 'ave',
  place: 'pl', pl: 'pl',
  road: 'rd', rd: 'rd',
  terrace: 'ter', ter: 'ter',
  trail: 'trl', trl: 'trl',
  parkway: 'pkwy', pkwy: 'pkwy',
  way: 'way',
}

function normalizeAddress(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => STREET_ABBREVIATIONS[word] || word)
    .join(' ')
}

function normalizeName(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function nameMatches(input: string, stored: string): boolean {
  const normalizedInput = normalizeName(input)
  const normalizedStored = normalizeName(stored)

  if (normalizedInput === normalizedStored) return true

  const couples = normalizedStored.split(/\s+(?:and|&)\s+/)
  if (couples.length === 2) {
    const lastName = couples[1].includes(' ')
      ? couples[1].split(' ').slice(-1)[0]
      : couples[1]

    const firstPerson = couples[0].includes(' ') ? couples[0] : `${couples[0]} ${lastName}`
    const secondPerson = couples[1].includes(' ') ? couples[1] : `${couples[1]}`

    if (normalizedInput === firstPerson || normalizedInput === secondPerson) return true
  }

  return false
}

export async function POST(request: Request) {
  const { name, address } = await request.json()

  if (!name || !address) {
    return Response.json({ verified: false, error: 'Name and address required' }, { status: 400 })
  }

  const supabase = getServiceSupabase()

  const { data: residents, error } = await supabase
    .from('residents')
    .select('id, full_name, address, dues_owed')

  if (error || !residents) {
    return Response.json({ verified: false })
  }

  const normalizedAddress = normalizeAddress(address)

  const match = residents.find(r =>
    nameMatches(name, r.full_name) &&
    normalizeAddress(r.address) === normalizedAddress
  )

  if (!match) {
    return Response.json({ verified: false })
  }

  // Find all residents at the same address (household)
  const householdResidentIds = residents
    .filter(r => normalizeAddress(r.address) === normalizedAddress)
    .map(r => r.id)

  // Look up past orders for this household (paid or fulfilled only)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_items(product_name, quantity, pass_date, product_id)')
    .in('resident_id', householdResidentIds)
    .in('status', ['paid', 'fulfilled'])

  let tagsPurchased = 0
  const dayPassesByDate: Record<string, number> = {}

  if (orders) {
    for (const order of orders) {
      for (const item of order.order_items || []) {
        if (item.product_name === 'Pool Tag') {
          tagsPurchased += item.quantity
        } else if (item.product_name === 'Day Pass' && item.pass_date) {
          const date = item.pass_date
          dayPassesByDate[date] = (dayPassesByDate[date] || 0) + item.quantity
        }
      }
    }
  }

  return Response.json({
    verified: true,
    residentId: match.id,
    duesOwed: match.dues_owed || 0,
    purchaseHistory: {
      tagsPurchased,
      dayPassesByDate,
    },
  })
}
