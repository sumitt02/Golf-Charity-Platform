import { createClient } from "@/lib/supabase";

export async function getCharities() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("charities")
    .select("*")
    .eq("is_active", true);

  if (error) throw error;

  return data;
}

export async function updateUserCharity(userId: string, charityId: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ charity_id: charityId })
    .eq("id", userId);

  if (error) throw error;
}