'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function CharitiesPage() {
  const [charities, setCharities] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [percent, setPercent] = useState(10)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const { data: charities } = await supabase
        .from('charities')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
      setCharities(charities || [])

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('charity_id, charity_percent')
          .eq('id', user.id)
          .single()
        if (profile?.charity_id) {
          setSelected(profile.charity_id)
          setPercent(profile.charity_percent || 10)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    if (!selected) return alert('Please select a charity')
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await supabase
      .from('profiles')
      .update({ charity_id: selected, charity_percent: percent })
      .eq('id', user.id)
    setSaving(false)
    alert('Charity saved!')
    const params = new URLSearchParams(window.location.search)
    const isOnboarding = params.get('onboarding') === 'true'
    router.push(isOnboarding ? '/pricing' : '/dashboard')
  }

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <a href="/" className="text-xl font-bold text-green-400">GolfGives</a>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">Back to dashboard</a>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('onboarding') === 'true' && (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6"
  >
    <p className="text-green-400 font-medium text-sm">Step 2 of 3 — Choose your charity</p>
    <p className="text-gray-400 text-xs mt-1">After this you'll choose your subscription plan</p>
  </motion.div>
)}
        <h1 className="text-3xl font-bold mb-2">Choose your charity</h1>
        <p className="text-gray-400 mb-8">
          A portion of your subscription goes directly to your chosen charity every month.
        </p>

        {/* Search */}
        <input
          type="text"
          placeholder="Search charities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white mb-6 focus:outline-none focus:border-green-500 transition"
        />

        {/* Charity grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filtered.map(charity => (
            <div
              key={charity.id}
              className={`bg-zinc-900 rounded-xl p-5 border transition ${
                selected === charity.id
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {/* Click to select */}
              <div
                className="cursor-pointer"
                onClick={() => setSelected(charity.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{charity.name}</h3>
                  <div className="flex gap-2 flex-shrink-0 ml-2">
                    {charity.is_featured && (
                      <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">
                        Featured
                      </span>
                    )}
                    {selected === charity.id && (
                      <span className="text-xs bg-green-500 text-black font-bold px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-3">{charity.description}</p>
              </div>

              {/* View profile link */}
              <a 
                href={`/charities/${charity.id}`}
                className="text-xs text-green-400 hover:text-green-300 transition"
                onClick={(e) => e.stopPropagation()}
              >
                View profile →
              </a>
            </div>
          ))}
        </div>

        {/* Contribution % */}
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6">
          <h3 className="font-medium mb-1">Contribution percentage</h3>
          <p className="text-sm text-gray-400 mb-4">Minimum 10%. You can give more if you wish.</p>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={10}
              max={50}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-green-400 font-bold text-lg w-12">{percent}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            On a £9.99/month plan, you'd donate £{(9.99 * percent / 100).toFixed(2)}/month
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !selected}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save charity selection'}
        </button>
      </div>
    </div>
  )
}