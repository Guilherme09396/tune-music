import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Track } from "@/lib/api";
import { toast } from "sonner";

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

export function usePlaylistStore() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load playlists from database
  const fetchPlaylists = useCallback(async () => {
    if (!user) { setPlaylists([]); setLoading(false); return; }
    try {
      const { data: pls, error: plError } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (plError) throw plError;

      const playlistsWithTracks: Playlist[] = [];
      for (const pl of pls || []) {
        const { data: tracks, error: tError } = await supabase
          .from("playlist_tracks")
          .select("*")
          .eq("playlist_id", pl.id)
          .order("position", { ascending: true });

        if (tError) throw tError;

        playlistsWithTracks.push({
          id: pl.id,
          name: pl.name,
          tracks: (tracks || []).map(t => ({
            id: t.track_id,
            title: t.title,
            artist: t.artist,
            duration: Number(t.duration),
            thumbnail: t.thumbnail,
            url: t.url,
          })),
        });
      }
      setPlaylists(playlistsWithTracks);
    } catch (err) {
      console.error("Error fetching playlists:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchPlaylists(); }, [fetchPlaylists]);

  const createPlaylist = useCallback(async (name: string): Promise<string> => {
    if (!user) return "";
    const { data, error } = await supabase
      .from("playlists")
      .insert({ name, user_id: user.id })
      .select("id")
      .single();

    if (error) { toast.error("Erro ao criar playlist"); return ""; }
    const newPl: Playlist = { id: data.id, name, tracks: [] };
    setPlaylists(prev => [...prev, newPl]);
    toast.success(`Playlist "${name}" criada!`);
    return data.id;
  }, [user]);

  const deletePlaylist = useCallback(async (id: string) => {
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover playlist"); return; }
    setPlaylists(prev => prev.filter(p => p.id !== id));
    toast.success("Playlist removida");
  }, []);

  const addTrackToPlaylist = useCallback(async (playlistId: string, track: Track) => {
    // Check if already exists
    const pl = playlists.find(p => p.id === playlistId);
    if (pl?.tracks.some(t => t.id === track.id)) {
      toast.info("Música já está na playlist");
      return;
    }

    const position = pl ? pl.tracks.length : 0;
    const { error } = await supabase.from("playlist_tracks").insert({
      playlist_id: playlistId,
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      thumbnail: track.thumbnail,
      url: track.url,
      position,
    });

    if (error) { toast.error("Erro ao adicionar música"); return; }

    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p
    ));
    toast.success("Música adicionada!");
  }, [playlists]);

  const removeTrackFromPlaylist = useCallback(async (playlistId: string, trackId: string) => {
    const { error } = await supabase
      .from("playlist_tracks")
      .delete()
      .eq("playlist_id", playlistId)
      .eq("track_id", trackId);

    if (error) { toast.error("Erro ao remover música"); return; }

    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p
    ));
  }, []);

  return { playlists, loading, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist };
}
