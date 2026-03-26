import { createClient } from '@/lib/supabase'

const supabase = createClient()

// Get the latest 5 active scores for a user
export async function getScores(userId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('score_date', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching scores:', error)
    return []
  }

  return data
}

// Add a new score — keeps only latest 5 (rolling logic)
export async function addScore(userId: string, score: number, date: string) {
  // First get current active scores
  const { data: existingScores } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('score_date', { ascending: true })

  // If already 5 scores, deactivate the oldest one
  if (existingScores && existingScores.length >= 5) {
    const oldest = existingScores[0]
    await supabase
      .from('scores')
      .update({ is_active: false })
      .eq('id', oldest.id)
  }

  // Insert the new score
  const { data, error } = await supabase
    .from('scores')
    .insert({
      user_id: userId,
      stableford_score: score,
      score_date: date,
      is_active: true
    })

  if (error) {
    console.error('Error adding score:', error)
    throw error
  }

  return data
}