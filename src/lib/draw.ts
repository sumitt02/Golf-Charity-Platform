import { createClient } from "@/lib/supabase";

function generateRandomNumbers(): number[] {
  const numbers = new Set<number>();

  while (numbers.size < 5) {
    const num = Math.floor(Math.random() * 45) + 1;
    numbers.add(num);
  }

  return Array.from(numbers);
}

function countMatches(userScores: number[], winning: number[]) {
  return userScores.filter((s) => winning.includes(s)).length;
}

export async function runDraw() {
  const supabase = createClient();

  // 1. Generate numbers
  const winningNumbers = generateRandomNumbers();

  // 2. Create draw
  const { data: draw, error } = await supabase
    .from("draws")
    .insert({
      draw_date: new Date().toISOString(),
      status: "published",
      winning_numbers: winningNumbers,
    })
    .select()
    .single();

  if (error) throw error;

  // 3. Get active subscribers
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("status", "active");

  if (!subs) return winningNumbers;

  // 4. Track winners
  const winnersByTier: Record<string, string[]> = {
    "3-match": [],
    "4-match": [],
    "5-match": [],
  };

  // 5. Process users
  for (const sub of subs) {
    const userId = sub.user_id;

    const { data: scores } = await supabase
      .from("scores")
      .select("stableford_score")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (!scores || scores.length === 0) continue;

    const userScores = scores.map((s) => s.stableford_score);
    const matchCount = countMatches(userScores, winningNumbers);

    // Save entry
    await supabase.from("draw_entries").insert({
      draw_id: draw.id,
      user_id: userId,
      score_snapshot: userScores,
      match_count: matchCount,
    });

    // Track winners safely
    if (matchCount >= 3) {
      const tier =
        matchCount === 5
          ? "5-match"
          : matchCount === 4
          ? "4-match"
          : "3-match";

      winnersByTier[tier].push(userId);
    }
  }

  // 6. Prize distribution
  const totalPool = 1000;

  const distribution: Record<string, number> = {
    "5-match": totalPool * 0.4,
    "4-match": totalPool * 0.35,
    "3-match": totalPool * 0.25,
  };

  // 7. Insert winners with prize + verification status
  for (const tier of ["3-match", "4-match", "5-match"]) {
    const winners = winnersByTier[tier];

    if (!winners.length) continue;

    const prizePerUser = distribution[tier] / winners.length;

    for (const userId of winners) {
      await supabase.from("winners").insert({
        draw_id: draw.id,
        user_id: userId,
        match_tier: tier,
        prize_amount: prizePerUser,
        verification_status: "pending", // ✅ IMPORTANT
      });
    }
  }

  // 8. Jackpot rollover logic
  const hasJackpotWinner = winnersByTier["5-match"].length > 0;

  await supabase
    .from("draws")
    .update({
      jackpot_rolled: !hasJackpotWinner,
    })
    .eq("id", draw.id);

  return winningNumbers;
}

// Fetch draws
export async function getDraws() {
  const supabase = createClient();
  const { data } = await supabase
    .from("draws")
    .select("*")
    .order("created_at", { ascending: false });

  return data || [];
}

// Prize pool calculation
export function calculatePrizePools(totalPool: number) {
  return {
    fiveMatch: totalPool * 0.4,
    fourMatch: totalPool * 0.35,
    threeMatch: totalPool * 0.25,
  };
}

// Notifications
export async function sendDrawNotifications(
  drawId: string,
  winningNumbers: number[]
) {
  const supabase = createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("status", "active");

  if (!subs) return;

  const notifications = subs.map((s) => ({
    user_id: s.user_id,
    type: "draw_result",
    message: `Monthly draw complete! Winning numbers: ${winningNumbers.join(
      ", "
    )}. Check your dashboard to see if you won!`,
  }));

  await supabase.from("notifications").insert(notifications);

  const { data: winners } = await supabase
    .from("winners")
    .select("user_id, match_tier, prize_amount")
    .eq("draw_id", drawId);

  if (winners && winners.length > 0) {
    const winnerNotifications = winners.map((w) => ({
      user_id: w.user_id,
      type: "winner",
      message: `Congratulations! You won £${w.prize_amount?.toFixed(
        2
      )} with a ${w.match_tier}! Upload proof to claim.`,
    }));

    await supabase.from("notifications").insert(winnerNotifications);
  }
}