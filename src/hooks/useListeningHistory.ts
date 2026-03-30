import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Track } from "@/lib/api";

export interface HistoryEntry {
  track: Track;
  playedAt: number;
  listenedSeconds: number;
}

const MAX_HISTORY = 50;

export function useListeningHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!user) { setHistory([]); return; }
    const { data, error } = await supabase
      .from("listening_history")
      .select("*")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(MAX_HISTORY);

    if (error) { console.error("Error fetching history:", error); return; }

    setHistory((data || []).map(d => ({
      track: {
        id: d.track_id,
        title: d.title,
        artist: d.artist,
        duration: Number(d.duration),
        thumbnail: d.thumbnail,
        url: d.url,
      },
      playedAt: new Date(d.played_at).getTime(),
      listenedSeconds: Number((d as any).listened_seconds) || 0,
    })));
  }, [user]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const addToHistory = useCallback(async (track: Track, listenedSeconds: number = 0) => {
    if (!user) return;
    // Only save if listened for at least 5 seconds
    if (listenedSeconds < 5) return;

    // Delete previous entry for same track to avoid duplicates
    await supabase
      .from("listening_history")
      .delete()
      .eq("user_id", user.id)
      .eq("track_id", track.id);

    const now = new Date().toISOString();
    await supabase.from("listening_history").insert({
      user_id: user.id,
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: track.thumbnail,
      url: track.url,
      played_at: now,
      listened_seconds: Math.floor(listenedSeconds),
    } as any);

    setHistory(prev => {
      const filtered = prev.filter(e => e.track.id !== track.id);
      return [{ track, playedAt: Date.now(), listenedSeconds: Math.floor(listenedSeconds) }, ...filtered].slice(0, MAX_HISTORY);
    });
  }, [user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    await supabase.from("listening_history").delete().eq("user_id", user.id);
    setHistory([]);
  }, [user]);

  const topArtists = Array.from(
    new Set(history.map(e => e.track.artist))
  ).slice(0, 5);

  const recentTracks = history.slice(0, 10).map(e => e.track);

  return { history, recentTracks, topArtists, addToHistory, clearHistory };
}
