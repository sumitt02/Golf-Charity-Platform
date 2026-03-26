import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import HomeClient from '@/components/HomeClient'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: charities } = await supabase
    .from('charities')
    .select('*')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })

  const featured = charities?.find(c => c.is_featured)
  const allCharities = charities || []

  return <HomeClient featured={featured} charities={allCharities} />
}