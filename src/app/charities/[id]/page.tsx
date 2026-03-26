import { createServerSupabaseClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function CharityPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: charity } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!charity) return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>Charity not found.</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold text-green-400">GolfGives</Link>
        <Link href="/charities" className="text-sm text-gray-400 hover:text-white">All charities</Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-6">
          {charity.is_featured && (
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-3 py-1 rounded-full">
              Featured charity
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4">{charity.name}</h1>
        <p className="text-gray-300 text-lg mb-8">{charity.description}</p>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6">
          <h3 className="font-semibold mb-2">Support this charity</h3>
          <p className="text-gray-400 text-sm mb-4">
            Choose {charity.name} as your charity when you subscribe and a portion of every payment goes directly to them.
          </p>
          <Link
            href="/signup"
            className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-2 rounded-lg transition inline-block"
          >
            Subscribe and support
          </Link>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h3 className="font-semibold mb-3">Upcoming golf events</h3>
          <p className="text-gray-400 text-sm">No upcoming events at this time. Check back soon!</p>
        </div>
      </div>
    </div>
  )
}