import { Text } from "@/components/ui/Text";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function AuthCallback() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const ensureProfile = async (user: any) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        const username =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          `player_${user.id.slice(0, 8)}`;
        await supabase
          .from("profiles")
          .upsert(
            { id: user.id, username, avatar_color: "#6C63FF" },
            { onConflict: "id", ignoreDuplicates: true },
          );
      }
    };

    const finish = async (session: any) => {
      if (settled || !mounted) return;
      settled = true;
      try {
        if (session?.user) await ensureProfile(session.user);
      } catch (err) {
        console.warn("[AuthCallback] profile ensure error:", err);
      }
      router.replace("/(game)");
    };

    // supabase.auth already parses tokens from the URL itself
    // (see `detectSessionInUrl` in lib/supabase.ts) — we just wait for it,
    // instead of re-parsing the URL ourselves (tokens live in the hash
    // fragment, not queryParams, which was the source of the 404/stuck bug).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish(session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          session &&
          ["SIGNED_IN", "TOKEN_REFRESHED", "INITIAL_SESSION"].includes(event)
        ) {
          finish(session);
        }
      },
    );

    const timeout = setTimeout(() => {
      if (!settled && mounted) {
        settled = true;
        setErrorMsg("ورود ناموفق بود. لطفاً دوباره تلاش کنید.");
        setTimeout(() => router.replace("/auth/login"), 1500);
      }
    }, 8000);

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6C63FF" />
      <Text style={styles.text}>{errorMsg ?? "در حال ورود به بازی..."}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080C1A",
    gap: 16,
  },
  text: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
});
