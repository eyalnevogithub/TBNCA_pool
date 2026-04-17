import { getServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getServiceSupabase()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'waiver_html')
    .single()

  return Response.json({ html: data?.value || '' })
}
