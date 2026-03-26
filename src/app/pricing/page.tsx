'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.15 } }
}

const cardVariant = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubscribe(plan: 'monthly' | 'yearly') {
    setLoading(plan)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/signup'); return }

    const { error } = await supabase.from('subscriptions').upsert({
      user_id: user.id,
      plan,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'user_id' })

    if (error) { alert('Error: ' + error.message); setLoading(null); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('charity_id, charity_percent')
      .eq('id', user.id)
      .single()

    if (profile?.charity_id) {
      const amount = plan === 'monthly'
        ? 9.99 * (profile.charity_percent || 10) / 100
        : 8.25 * (profile.charity_percent || 10) / 100

      await supabase.from('charity_contributions').insert({
        user_id: user.id,
        charity_id: profile.charity_id,
        amount
      })
    }

    router.push('/dashboard')
  }

  const features = {
    monthly: [
      'Enter up to 5 Stableford scores',
      'Monthly prize draw entry',
      'Choose your charity',
      'Min 10% goes to charity',
      'Winner dashboard access',
    ],
    yearly: [
      'Everything in Monthly',
      '2 months free',
      'Priority draw entry',
      'Yearly charity report',
      'Early access to features',
    ]
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between px-6 py-4 border-b border-zinc-800"
      >
        <a href="/" className="text-xl font-bold text-green-400">GolfGives</a>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">Dashboard</a>
      </motion.nav>

      <div className="max-w-3xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Simple pricing</h1>
          <p className="text-gray-400">Join the draw. Support charity. Win prizes.</p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <motion.div
            variants={cardVariant}
            whileHover={{ y: -4 }}
            className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800"
          >
            <h2 className="text-lg font-semibold mb-1">Monthly</h2>
            <p className="text-gray-400 text-sm mb-6">Flexible, cancel anytime</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">£9.99</span>
              <span className="text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-300">
              {features.monthly.map(f => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-green-400">✓</span> {f}
                </motion.li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly'}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading === 'monthly' ? 'Processing...' : 'Get started'}
            </motion.button>
          </motion.div>

          <motion.div
            variants={cardVariant}
            whileHover={{ y: -4 }}
            className="bg-zinc-900 rounded-2xl p-8 border border-green-500/40 relative"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-bold px-4 py-1 rounded-full"
            >
              BEST VALUE
            </motion.div>
            <h2 className="text-lg font-semibold mb-1">Yearly</h2>
            <p className="text-gray-400 text-sm mb-6">Save 2 months free</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-green-400">£99</span>
              <span className="text-gray-400">/year</span>
              <p className="text-xs text-gray-400 mt-1">Just £8.25/month</p>
            </div>
            <ul className="space-y-3 mb-8 text-sm text-gray-300">
              {features.yearly.map(f => (
                <motion.li
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-green-400">✓</span> {f}
                </motion.li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubscribe('yearly')}
              disabled={loading === 'yearly'}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading === 'yearly' ? 'Processing...' : 'Get started'}
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-gray-500 text-sm mt-8"
        >
          Minimum 10% of your subscription is donated to your chosen charity automatically.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-10 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 text-center"
        >
          <h3 className="font-semibold mb-2">Want to donate without subscribing?</h3>
          <p className="text-gray-400 text-sm mb-4">
            You can make an independent donation directly to any of our supported charities.
          </p>
          <motion.a
            href="/charities"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-2 rounded-xl transition inline-block text-sm"
          >
            Browse charities
          </motion.a>
        </motion.div>
      </div>
    </div>
  )
}
