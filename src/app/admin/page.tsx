'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { runDraw, getDraws, calculatePrizePools, sendDrawNotifications } from '@/lib/draw'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [draws, setDraws] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [running, setRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('draws')
  const [poolAmount] = useState(1000)
  const router = useRouter()
  const supabase = createClient()
  const [drawType, setDrawType] = useState<'random' | 'weighted'>('random')
  const [simResult, setSimResult] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // 🔴 ADMIN CHECK
      if (user.email !== 'admin@golfgives.com') {
        router.push('/dashboard')
        return
      }

      setUser(user)
      await loadData()
      setLoading(false)
    }

    load()
  }, [])

  async function loadData() {
    const drawData = await getDraws()
    setDraws(drawData)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*, subscriptions(*),scores(*)')
    setUsers(profiles || [])

    const { data: winnersData } = await supabase
      .from('winners')
      .select('*, profiles(full_name, email), draws(draw_date)')
    setWinners(winnersData || [])
  }

  async function handleRunDraw() {
    setRunning(true)
    try {
      const winningNumbers = await runDraw()

      const { data: latestDraw } = await supabase
        .from('draws')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (latestDraw) {
        await sendDrawNotifications(latestDraw.id, winningNumbers)
      }

      alert(`Draw complete: ${winningNumbers.join(', ')}`)
      await loadData()
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setRunning(false)
  }

  async function handleSimulate() {
    setRunning(true)
    setSimResult(null)

    try {
      const numbers: number[] = []

      if (drawType === 'weighted') {
        const { data: scores } = await supabase
          .from('scores')
          .select('stableford_score')
          .eq('is_active', true)

        const pool: number[] = []
        const freq: Record<number, number> = {}

        ;(scores || []).forEach((s: any) => {
          freq[s.stableford_score] = (freq[s.stableford_score] || 0) + 1
        })

        Object.entries(freq).forEach(([num, count]) => {
          for (let i = 0; i < count; i++) pool.push(Number(num))
        })

        const shuffled = pool.sort(() => Math.random() - 0.5)

        for (const n of shuffled) {
          if (!numbers.includes(n)) numbers.push(n)
          if (numbers.length === 5) break
        }
      }

      while (numbers.length < 5) {
        const n = Math.floor(Math.random() * 45) + 1
        if (!numbers.includes(n)) numbers.push(n)
      }

      numbers.sort((a, b) => a - b)

      const { data: profiles } = await supabase.from('profiles').select('id')

      let potentialWinners = 0

      for (const p of profiles || []) {
        const { data: scores } = await supabase
          .from('scores')
          .select('stableford_score')
          .eq('user_id', p.id)
          .eq('is_active', true)

        const matches = (scores || []).filter((s: any) =>
          numbers.includes(s.stableford_score)
        ).length

        if (matches >= 3) potentialWinners++
      }

      setSimResult({ numbers, potentialWinners })
    } catch (e: any) {
      alert('Simulation error: ' + e.message)
    }

    setRunning(false)
  }

  async function handleVerify(winnerId: string, status: 'approved' | 'rejected') {
    await supabase
      .from('winners')
      .update({ verification_status: status })
      .eq('id', winnerId)

    await loadData()
  }

  async function handleMarkPaid(winnerId: string) {
    const { data: payout } = await supabase
      .from('payouts')
      .select('id')
      .eq('winner_id', winnerId)
      .single()

    if (payout) {
      await supabase
        .from('payouts')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .eq('winner_id', winnerId)
    } else {
      await supabase
        .from('payouts')
        .insert({
          winner_id: winnerId,
          status: 'paid',
          paid_at: new Date().toISOString()
        })
    }

    alert('Marked as paid!')
    await loadData()
  }

  // ✅ FIX 1: WAIT FOR USER
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Checking access...</div>
      </div>
    )
  }

  // ✅ FIX 2: HARD BLOCK
  if (user.email !== 'admin@golfgives.com') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Access denied
      </div>
    )
  }

  const pools = calculatePrizePools(poolAmount)

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-green-400">GolfGives Admin</h1>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
          Back to dashboard
        </a>
      </header>

      <div className="border-b border-zinc-800 px-6">
        <div className="flex gap-6">
          {['draws', 'users', 'winners', 'charities', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-green-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">

        {/* DRAWS TAB */}
        {activeTab === 'draws' && (
  <div>
    <h2 className="text-lg font-semibold mb-6">Draw management</h2>

    {/* Pool breakdown */}
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <p className="text-xs text-gray-400 mb-1">5-match jackpot (40%)</p>
        <p className="text-green-400 font-bold">£{pools.fiveMatch.toFixed(2)}</p>
      </div>
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <p className="text-xs text-gray-400 mb-1">4-match prize (35%)</p>
        <p className="text-white font-bold">£{pools.fourMatch.toFixed(2)}</p>
      </div>
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
        <p className="text-xs text-gray-400 mb-1">3-match prize (25%)</p>
        <p className="text-white font-bold">£{pools.threeMatch.toFixed(2)}</p>
      </div>
    </div>

    {/* Draw config */}
    <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6">
      <h3 className="font-medium mb-4">Configure draw</h3>
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-1 block">Draw type</label>
        <select
          value={drawType}
          onChange={(e) => setDrawType(e.target.value as any)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
        >
          <option value="random">Random — pure lottery</option>
          <option value="weighted">Weighted — by score frequency</option>
        </select>
      </div>
      <div className="flex gap-3">
        <button
          onClick={handleSimulate}
          disabled={running}
          className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50 text-sm"
        >
          {running ? 'Running...' : 'Simulate draw'}
        </button>
        <button
          onClick={handleRunDraw}
          disabled={running}
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50 text-sm"
        >
          {running ? 'Running...' : 'Run & publish draw'}
        </button>
      </div>
    </div>

    {/* Simulation result */}
    {simResult && (
      <div className="bg-zinc-900 rounded-xl p-6 border border-green-500/30 mb-6">
        <h3 className="font-medium mb-3 text-green-400">Simulation result (not saved)</h3>
        <p className="text-sm text-gray-400 mb-3">If this draw ran right now:</p>
        <div className="flex gap-2 mb-3">
          {simResult.numbers.map((n: number) => (
            <div key={n} className="w-10 h-10 bg-green-500 text-black font-bold rounded-full flex items-center justify-center text-sm">
              {n}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-300">
          Potential winners: <span className="text-white font-semibold">{simResult.potentialWinners}</span>
        </p>
        {simResult.potentialWinners === 0 && (
          <p className="text-sm text-amber-400 mt-1">No winners — jackpot would roll over</p>
        )}
        <button
          onClick={() => setSimResult(null)}
          className="mt-3 text-xs text-gray-400 hover:text-white transition"
        >
          Clear simulation
        </button>
      </div>
    )}

    {/* Past draws */}
    <h3 className="font-medium mb-3">Past draws ({draws.length})</h3>
    {draws.length === 0 ? (
      <p className="text-gray-400 text-sm">No draws run yet.</p>
    ) : (
      <div className="space-y-3">
        {draws.map(draw => (
          <div key={draw.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{draw.draw_date?.split('T')[0]}</p>
              <div className="flex items-center gap-2">
                {draw.jackpot_rolled && (
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full">
                    Jackpot rolled
                  </span>
                )}
                <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
                  {draw.status}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {draw.winning_numbers?.map((n: number) => (
                <div key={n} className="w-8 h-8 bg-green-500 text-black font-bold rounded-full flex items-center justify-center text-xs">
                  {n}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Pool: £{draw.pool_total || 1000}</p>
          </div>
        ))}
      </div>
    )}
  </div>
)}

        {/* USERS TAB */}
        {/* USERS TAB */}
{activeTab === 'users' && (
  <div>
    <h2 className="text-lg font-semibold mb-2">User management</h2>
    <p className="text-sm text-gray-400 mb-6">Total users: {users.length}</p>

    {users.length === 0 ? (
      <p className="text-gray-400 text-sm">No users yet.</p>
    ) : (
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">

            {/* USER INFO */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{u.full_name || 'No name'}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>

              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                u.subscriptions?.[0]?.status === 'active'
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-zinc-700 text-gray-400'
              }`}>
                {u.subscriptions?.[0]?.status === 'active' ? 'Active' : 'Free'}
              </span>
            </div>

            {/* 🔥 EDIT SCORES */}
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Edit scores</p>
              <div className="space-y-2">
                {u.scores?.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue={s.stableford_score}
                      onBlur={async (e) => {
                        const value = Number(e.target.value)
                        await supabase
                          .from('scores')
                          .update({ stableford_score: value })
                          .eq('id', s.id)
                      }}
                      className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-gray-400">{s.score_date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 🔥 MANAGE SUBSCRIPTION */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={async () => {
                  await supabase
                    .from('subscriptions')
                    .update({ status: 'active' })
                    .eq('user_id', u.id)
                  await loadData()
                }}
                className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded"
              >
                Activate
              </button>

              <button
                onClick={async () => {
                  await supabase
                    .from('subscriptions')
                    .update({ status: 'cancelled' })
                    .eq('user_id', u.id)
                  await loadData()
                }}
                className="text-xs bg-red-500/10 text-red-400 px-3 py-1 rounded"
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  await supabase
                    .from('subscriptions')
                    .update({ plan: 'yearly' })
                    .eq('user_id', u.id)
                  await loadData()
                }}
                className="text-xs bg-zinc-700 text-white px-3 py-1 rounded"
              >
                Upgrade
              </button>
            </div>

          </div>
        ))}
      </div>
    )}
  </div>
)}

        {/* WINNERS TAB */}
        {activeTab === 'winners' && (
          <div>
            <h2 className="text-lg font-semibold mb-6">Winners & verification</h2>
            {winners.length === 0 ? (
              <p className="text-gray-400 text-sm">No winners yet. Run a draw first.</p>
            ) : (
              <div className="space-y-3">
                {winners.map(w => (
                  <div key={w.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium">{w.profiles?.full_name || w.profiles?.email || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{w.match_tier} · £{w.prize_amount?.toFixed(2)}</p>
                        {w.proof_url && (
                          <a href={w.proof_url} target="_blank" rel="noreferrer" className="text-xs text-green-400 underline mt-1 block">
                            View proof
                          </a>
                        )}
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        w.verification_status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        w.verification_status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {w.verification_status}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {w.verification_status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleVerify(w.id, 'approved')}
                            className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-lg hover:bg-green-500/20 transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerify(w.id, 'rejected')}
                            className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500/20 transition"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {w.verification_status === 'approved' && (
                        <button
                          onClick={() => handleMarkPaid(w.id)}
                          className="text-xs bg-zinc-700 text-white px-3 py-1 rounded-lg hover:bg-zinc-600 transition"
                        >
                          Mark as paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHARITIES TAB */}
        {activeTab === 'charities' && (
          <CharitiesTab supabase={supabase} />
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <AnalyticsTab supabase={supabase} />
        )}

      </main>
    </div>
  )
}

function CharitiesTab({ supabase }: { supabase: any }) {
  const [charities, setCharities] = useState<any[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharities()
  }, [])

  async function loadCharities() {
    const { data } = await supabase.from('charities').select('*').order('created_at', { ascending: false })
    setCharities(data || [])
    setLoading(false)
  }

  async function handleAdd() {
    if (!name) return alert('Name is required')
    await supabase.from('charities').insert({ name, description, is_active: true })
    setName('')
    setDescription('')
    await loadCharities()
  }

  async function handleDelete(id: string) {
    await supabase.from('charities').delete().eq('id', id)
    await loadCharities()
  }

  async function handleToggleFeatured(id: string, current: boolean) {
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    await loadCharities()
  }

  if (loading) return <p className="text-gray-400 text-sm">Loading...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Charity management</h2>
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 mb-6">
        <h3 className="font-medium mb-4">Add new charity</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Charity name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-5 py-2 rounded-lg transition"
          >
            Add charity
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {charities.map(c => (
          <div key={c.id} className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-gray-400">{c.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleFeatured(c.id, c.is_featured)}
                className={`text-xs px-3 py-1 rounded-lg transition ${
                  c.is_featured
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-zinc-700 text-gray-400'
                }`}
              >
                {c.is_featured ? 'Featured' : 'Set featured'}
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-lg hover:bg-red-500/20 transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsTab({ supabase }: { supabase: any }) {
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [usersRes, subsRes, winnersRes, drawsRes, contribRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('id, plan', { count: 'exact' }).eq('status', 'active'),
        supabase.from('winners').select('prize_amount'),
        supabase.from('draws').select('id', { count: 'exact' }),
        supabase.from('charity_contributions').select('amount'),
      ])

      const totalPaid = (winnersRes.data || []).reduce((s: number, w: any) => s + (w.prize_amount || 0), 0)
      const totalContrib = (contribRes.data || []).reduce((s: number, c: any) => s + (c.amount || 0), 0)
      const monthlyCount = (subsRes.data || []).filter((s: any) => s.plan === 'monthly').length
      const yearlyCount = (subsRes.data || []).filter((s: any) => s.plan === 'yearly').length
      const estimatedPool = (monthlyCount * 9.99) + (yearlyCount * 8.25)

      setStats({
        totalUsers: usersRes.count || 0,
        activeSubscribers: subsRes.count || 0,
        totalDraws: drawsRes.count || 0,
        totalPrizePaid: totalPaid,
        estimatedPool,
        totalCharity: totalContrib,
        monthlyCount,
        yearlyCount,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-gray-400 text-sm">Loading analytics...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total users', value: stats.totalUsers },
          { label: 'Active subscribers', value: stats.activeSubscribers },
          { label: 'Monthly plans', value: stats.monthlyCount },
          { label: 'Yearly plans', value: stats.yearlyCount },
          { label: 'Total draws run', value: stats.totalDraws },
          { label: 'Est. monthly pool', value: `£${stats.estimatedPool?.toFixed(2)}` },
          { label: 'Total prizes paid', value: `£${stats.totalPrizePaid?.toFixed(2)}` },
          { label: 'Charity contributions', value: `£${stats.totalCharity?.toFixed(2)}` },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-green-400">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}