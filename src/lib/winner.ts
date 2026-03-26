import { createClient } from "@/lib/supabase";

export async function getWinners(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("winners")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}