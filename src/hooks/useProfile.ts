import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      // Profile might not exist yet for old users — create one
      if (error.code === "PGRST116") {
        const { data: newProfile } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            display_name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
          } as any)
          .select("*")
          .single();
        if (newProfile) setProfile(newProfile as any);
      }
    } else {
      setProfile(data as any);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: { username?: string; display_name?: string; bio?: string; avatar_url?: string }) => {
      if (!user) return false;
      
      const { error } = await supabase
        .from("profiles")
        .update(updates as any)
        .eq("user_id", user.id);

      if (error) {
        if (error.code === "23505") {
          toast.error("Este username já está em uso");
        } else {
          toast.error("Erro ao atualizar perfil");
        }
        return false;
      }

      setProfile((prev) => prev ? { ...prev, ...updates } : null);
      toast.success("Perfil atualizado!");
      return true;
    },
    [user]
  );

  return { profile, loading, updateProfile, refetch: fetchProfile };
}

export async function fetchPublicProfile(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) return null;
  return data as any;
}

export async function fetchPublicPlaylists(userId: string) {
  const { data: pls, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .eq("visibility", "public")
    .order("created_at", { ascending: false });

  if (error || !pls) return [];

  const result = [];
  for (const pl of pls) {
    const { data: tracks } = await supabase
      .from("playlist_tracks")
      .select("*")
      .eq("playlist_id", pl.id)
      .order("position", { ascending: true });

    result.push({
      id: pl.id,
      name: pl.name,
      trackCount: tracks?.length || 0,
      tracks: (tracks || []).map((t) => ({
        id: t.track_id,
        title: t.title,
        artist: t.artist,
        duration: Number(t.duration),
        thumbnail: t.thumbnail,
        url: t.url,
      })),
    });
  }
  return result;
}

export async function fetchUserStats(userId: string) {
  const { data, error } = await supabase
    .from("listening_history")
    .select("*" as any)
    .eq("user_id", userId);

  if (error || !data) return { totalTracks: 0, totalSeconds: 0, totalPlays: 0, topArtists: [] };

  const totalTracks = data.length;
  const totalSeconds = data.reduce((acc: number, d: any) => acc + (Number(d.listened_seconds) || 0), 0);
  const totalPlays = data.reduce((acc: number, d: any) => acc + (Number(d.play_count) || 1), 0);

  const artistMap = new Map<string, number>();
  data.forEach((d: any) => {
    artistMap.set(d.artist, (artistMap.get(d.artist) || 0) + (Number(d.play_count) || 1));
  });
  const topArtists = Array.from(artistMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, plays]) => ({ name, plays }));

  return { totalTracks, totalSeconds, totalPlays, topArtists };
}
