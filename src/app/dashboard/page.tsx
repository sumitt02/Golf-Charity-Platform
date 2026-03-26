'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { addScore, getScores } from '@/lib/score'
import { motion } from 'framer-motion'

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
}
const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } }
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scores, setScores] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [score, setScore] = useState('')
  const [date, setDate] = useState('')
  const [subscription, setSubscription] = useState<any>(null)
  const [charity, setCharity] = useState<any>(null)
  const [winnings, setWinnings] = useState<any[]>([])
  const [draws, setDraws] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [nextDraw, setNextDraw] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Calculate next draw date (1st of next month)
    const now = new Date()
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    setNextDraw(next.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      const [scoresRes, subRes, profileRes, winnersRes, drawsRes, notifsRes] = await Promise.all([
        supabase.from('scores').select('*').eq('user_id', user.id).eq('is_active', true).order('score_date', { ascending: false }).limit(5),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
        supabase.from('profiles').select('*, charities(name)').eq('id', user.id).single(),
        supabase.from('winners').select('*, draws(draw_date)').eq('user_id', user.id),
        supabase.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false }).limit(3),
        supabase.from('notifications').select('*').eq('user_id', user.id).eq('read', false).order('created_at', { ascending: false }),
      ])

      setScores(scoresRes.data || [])
      setSubscription(subRes.data)
      setProfile(profileRes.data)
      setCharity(profileRes.data?.charities)
      setWinnings(winnersRes.data || [])
      setDraws(drawsRes.data || [])
      setNotifications(notifsRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleAddScore() {
    if (!score || !date) return alert('Fill all fields')
    const num = Number(score)
    if (num < 1 || num > 45) return alert('Score must be between 1 and 45')
    try {
      await addScore(user.id, num, date)
      const { data } = await supabase.from('scores').select('*').eq('user_id', user.id).eq('is_active', true).order('score_date', { ascending: false }).limit(5)
      setScores(data || [])
      setScore('')
      setDate('')
      setShowForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function markNotifsRead() {
    setShowNotifs(!showNotifs)
    if (!showNotifs && notifications.length > 0) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id)
      setNotifications([])
    }
  }

  const totalWon = winnings.reduce((sum, w) => sum + (w.prize_amount || 0), 0)
  const hasWinningsPending = winnings.some(w => w.verification_status === 'pending')

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between"
      >
        <h1 className="text-xl font-bold text-green-400">GolfGives</h1>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={markNotifsRead}
              className="relative text-gray-400 hover:text-white transition text-sm px-3 py-1 rounded-lg border border-zinc-700"
            >
              Notifications
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-10 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {notifications.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No new notifications</p>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="px-4 py-3 border-b border-zinc-800 last:border-0">
                      <p className="text-xs text-green-400 mb-1 capitalize">{n.type?.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-300">{n.message}</p>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </div>
          <a href="/admin" className="text-xs text-gray-500 hover:text-white transition">Admin</a>
          <span className="text-gray-400 text-sm hidden md:block">{user?.email}</span>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition">
            Sign out
          </button>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-1">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
          </h2>
          <p className="text-gray-400 mb-8">Your golf dashboard.</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            {
              label: 'Subscription',
              value: subscription?.status === 'active' ? `Active (${subscription.plan})` : 'No plan',
              green: subscription?.status === 'active'
            },
            { label: 'Scores entered', value: `${scores.length} / 5` },
            { label: 'Total winnings', value: `£${totalWon.toFixed(2)}` },
            { label: 'Draws entered', value: draws.length },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={staggerItem}
              className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
            >
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className={`font-semibold text-sm ${stat.green ? 'text-green-400' : 'text-white'}`}>
                {stat.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Subscription CTA */}
        {subscription?.status !== 'active' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-5 mb-6"
          >
            <p className="text-green-400 font-medium mb-1">You don't have an active subscription</p>
            <p className="text-gray-400 text-sm mb-3">Subscribe to enter monthly draws and win prizes.</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/pricing')}
              className="bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-5 py-2 rounded-lg transition"
            >
              View plans
            </motion.button>
          </motion.div>
        )}

        {/* Main grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"
        >
          {/* Scores */}
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h3 className="font-semibold mb-3">My scores</h3>
            {scores.length === 0 ? (
              <p className="text-gray-400 text-sm">No scores entered yet.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {scores.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{s.stableford_score} pts</span>
                    <span className="text-gray-400">{s.score_date}</span>
                  </div>
                ))}
              </div>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(!showForm)}
              className="mt-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {showForm ? 'Cancel' : 'Enter score'}
            </motion.button>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 space-y-2"
              >
                <input
                  type="number" min={1} max={45}
                  placeholder="Score (1-45)"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddScore}
                  className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold py-2 rounded-lg text-sm"
                >
                  Submit score
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* Charity */}
          <motion.div variants={staggerItem} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h3 className="font-semibold mb-3">My charity</h3>
            {charity ? (
              <div className="mb-3">
                <p className="text-white font-medium">{charity.name}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Contributing {profile?.charity_percent || 10}% of subscription
                </p>
                <p className="text-green-400 text-sm mt-1">
                  ≈ £{((subscription?.plan === 'yearly' ? 8.25 : 9.99) * (profile?.charity_percent || 10) / 100).toFixed(2)}/month
                </p>
              </div>
            ) : (
              <p className="text-gray-400 text-sm mb-3">No charity selected yet.</p>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/charities')}
              className="bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {charity ? 'Change charity' : 'Choose charity'}
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Participation summary — upcoming draws */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-4"
        >
          <h3 className="font-semibold mb-4">Participation summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Draws entered */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Draws entered</p>
              {draws.length === 0 ? (
                <p className="text-gray-400 text-sm">No draws yet.</p>
              ) : (
                <div className="space-y-2">
                  {draws.map(d => (
                    <div key={d.id} className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {d.winning_numbers?.slice(0, 5).map((n: number) => (
                          <span key={n} className="w-6 h-6 bg-green-500 text-black font-bold rounded-full flex items-center justify-center text-xs">
                            {n}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{d.draw_date?.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming draw */}
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Next draw</p>
              <p className="text-white font-semibold">{nextDraw}</p>
              <p className="text-xs text-gray-400 mt-1">Monthly prize draw</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-green-400 font-bold text-sm">40%</p>
                  <p className="text-xs text-gray-400">5-match</p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">35%</p>
                  <p className="text-xs text-gray-400">4-match</p>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">25%</p>
                  <p className="text-xs text-gray-400">3-match</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Winnings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-zinc-900 rounded-xl p-6 border border-zinc-800"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">My winnings</h3>
            {hasWinningsPending && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/winner')}
                className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-lg hover:bg-green-500/20 transition"
              >
                Upload proof to claim →
              </motion.button>
            )}
          </div>
          {winnings.length === 0 ? (
            <p className="text-gray-400 text-sm">No winnings yet. Keep playing!</p>
          ) : (
            <div className="space-y-3">
              {winnings.map(w => (
                <div key={w.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{w.match_tier} — £{w.prize_amount?.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{w.draws?.draw_date?.split('T')[0]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      w.verification_status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      w.verification_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {w.verification_status}
                    </span>
                    {w.verification_status === 'pending' && (
                      <button
                        onClick={() => router.push('/winner')}
                        className="text-xs text-green-400 hover:text-green-300 underline transition"
                      >
                        Upload proof
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}