import { getServiceSupabase } from '@/lib/supabase'

export async function POST(request: Request) {
  const { csv } = await request.json()

  if (!csv) {
    return Response.json({ error: 'No CSV data provided' }, { status: 400 })
  }

  const lines = csv.split('\n').map((l: string) => l.trim()).filter((l: string) => l)
  if (lines.length < 2) {
    return Response.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })
  }

  const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase())
  const nameIdx = headers.indexOf('full_name')
  const addressIdx = headers.indexOf('address')
  const emailIdx = headers.indexOf('email')
  const duesIdx = headers.indexOf('dues_owed')

  if (nameIdx === -1 || addressIdx === -1) {
    return Response.json({ error: 'CSV must have full_name and address columns' }, { status: 400 })
  }

  const records = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i])
    if (cols.length <= Math.max(nameIdx, addressIdx)) continue

    const name = cols[nameIdx]?.trim()
    const address = cols[addressIdx]?.trim()
    if (!name || !address) continue

    records.push({
      full_name: name,
      address: address,
      email: emailIdx >= 0 ? cols[emailIdx]?.trim() || null : null,
      dues_owed: duesIdx >= 0 ? parseFloat(cols[duesIdx]) || 0 : 0,
    })
  }

  if (records.length === 0) {
    return Response.json({ error: 'No valid records found in CSV' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase.from('residents').upsert(records, {
    onConflict: 'full_name,address',
    ignoreDuplicates: false,
  })

  if (error) {
    return Response.json({ error: `Import failed: ${error.message}` }, { status: 500 })
  }

  return Response.json({ message: `Successfully imported ${records.length} residents.` })
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
