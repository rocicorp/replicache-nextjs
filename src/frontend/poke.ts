import { getSupabaseClientConfig } from "../backend/supabase.js";
import { createClient } from "@supabase/supabase-js";

const supabaseClientConfig = getSupabaseClientConfig();

export type OnPoke = () => Promise<void>;
export type Cancel = () => void;

// Listens for pokes using Supabase realtime functionality.
export function subscribeToPokes(spaceID: string, onPoke: OnPoke): Cancel {
  if (!supabaseClientConfig) {
    throw new Error("Supabase configuration is not correct");
  }

  const { url, key } = supabaseClientConfig;
  const supabase = createClient(url, key);
  const subscriptionChannel = supabase.channel("public:space");
  subscriptionChannel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "space",
        filter: `id=eq.${spaceID}`,
      },
      () => {
        void onPoke();
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(subscriptionChannel);
  };
}
