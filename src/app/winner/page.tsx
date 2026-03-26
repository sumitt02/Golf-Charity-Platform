'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function WinnerPage() {
  const [winners, setWinners] = useState<any[]>([])
  const [uploading, setUploading] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  async function loadWinners(userId: string) {
    const { data } = await supabase
      .from('winners')
      .select('*, draws(draw_date)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setWinners(data || [])
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      await loadWinners(user.id)
      setLoading(false)
    }
    load()
  }, [])

  async function handleUpload(winnerId: string, file: File) {
    // ✅ File validation
    if (!file.type.startsWith('image/')) {
      alert('Only image files allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Max file size is 5MB')
      return
    }

    setUploading(winnerId)

    const fileExt = file.name.split('.').pop()
    const fileName = `${winnerId}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(null)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(fileName)

    await supabase
      .from('winners')
      .update({ proof_url: publicUrl })
      .eq('id', winnerId)

    // ✅ Reload only current user data
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await loadWinners(user.id)

    setUploading(null)
    alert('Proof uploaded successfully!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <a href="/" className="text-xl font-bold text-green-400">GolfGives</a>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white">Back to dashboard</a>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">My winnings</h1>
        <p className="text-gray-400 mb-8">
          Upload proof of your scores to claim your prize.
        </p>

        {winners.length === 0 ? (
          <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-800 text-center">
            <p className="text-gray-400">No winnings yet. Keep playing!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {winners.map(w => {
              const status = w.verification_status || 'pending'

              return (
                <div key={w.id} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                  
                  {/* Top */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold capitalize">{w.match_tier}</p>
                      <p className="text-green-400 font-bold text-lg">
                        £{w.prize_amount?.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {w.draws?.draw_date?.split('T')[0]}
                      </p>
                    </div>

                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      status === 'approved'
                        ? 'bg-green-500/10 text-green-400'
                        : status === 'rejected'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {status}
                    </span>
                  </div>

                  {/* Proof Section */}
                  {status === 'pending' && (
                    <div>
                      {w.proof_url ? (
                        <div className="space-y-2">
                          <p className="text-sm text-green-400">
                            Proof uploaded — awaiting admin review
                          </p>

                          <a
                            href={w.proof_url}
                            target="_blank"
                            className="text-xs text-blue-400 hover:underline"
                          >
                            View uploaded proof
                          </a>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-400 mb-3">
                            Upload a screenshot of your scores to verify your win.
                          </p>

                          <label className="cursor-pointer bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition inline-block">
                            {uploading === w.id ? 'Uploading...' : 'Upload proof'}

                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploading === w.id}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUpload(w.id, file)
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}