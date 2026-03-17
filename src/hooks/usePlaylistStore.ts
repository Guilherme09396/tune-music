import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Track } from "@/lib/api";
import { toast } from "sonner";

export type PlaylistVisibility = "private" | "link" | "public";

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  visibility: PlaylistVisibility;
  share_id: string | null;
  user_id?: string;
}

function generateShareId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function usePlaylistStore() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

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
          visibility: (pl as any).visibility || "private",
          share_id: (pl as any).share_id || null,
          user_id: pl.user_id,
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
      .insert({ name, user_id: user.id } as any)
      .select("id")
      .single();

    if (error) { toast.error("Erro ao criar playlist"); return ""; }
    const newPl: Playlist = { id: data.id, name, tracks: [], visibility: "private", share_id: null };
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

  const updateVisibility = useCallback(async (playlistId: string, visibility: PlaylistVisibility) => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return;

    const updates: any = { visibility };

    // Generate share_id if sharing and doesn't have one
    if (visibility !== "private" && !pl.share_id) {
      updates.share_id = generateShareId();
    }

    const { error } = await supabase
      .from("playlists")
      .update(updates)
      .eq("id", playlistId);

    if (error) { toast.error("Erro ao atualizar visibilidade"); return; }

    setPlaylists(prev => prev.map(p =>
      p.id === playlistId ? { ...p, visibility, share_id: updates.share_id || p.share_id } : p
    ));

    const labels = { private: "Privada", link: "Compartilhável via link", public: "Pública" };
    toast.success(`Playlist agora é: ${labels[visibility]}`);
  }, [playlists]);

  const getShareLink = useCallback((playlistId: string): string | null => {
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl?.share_id || pl.visibility === "private") return null;
    return `${window.location.origin}/shared/${pl.share_id}`;
  }, [playlists]);

  const fetchSharedPlaylist = useCallback(async (shareId: string): Promise<Playlist | null> => {
    const { data: pls, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("share_id" as any, shareId)
      .in("visibility" as any, ["link", "public"]);

    if (error || !pls || pls.length === 0) return null;
    const pl = pls[0];

    const { data: tracks } = await supabase
      .from("playlist_tracks")
      .select("*")
      .eq("playlist_id", pl.id)
      .order("position", { ascending: true });

    return {
      id: pl.id,
      name: pl.name,
      visibility: (pl as any).visibility || "private",
      share_id: (pl as any).share_id || null,
      user_id: pl.user_id,
      tracks: (tracks || []).map(t => ({
        id: t.track_id,
        title: t.title,
        artist: t.artist,
        duration: Number(t.duration),
        thumbnail: t.thumbnail,
        url: t.url,
      })),
    };
  }, []);

  const copySharedPlaylist = useCallback(async (sharedPlaylist: Playlist): Promise<string> => {
    if (!user) return "";
    
    const { data, error } = await supabase
      .from("playlists")
      .insert({ name: sharedPlaylist.name, user_id: user.id } as any)
      .select("id")
      .single();

    if (error) { toast.error("Erro ao salvar playlist"); return ""; }

    // Copy all tracks
    if (sharedPlaylist.tracks.length > 0) {
      const trackInserts = sharedPlaylist.tracks.map((track, i) => ({
        playlist_id: data.id,
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        duration: track.duration,
        thumbnail: track.thumbnail,
        url: track.url,
        position: i,
      }));

      const { error: tError } = await supabase.from("playlist_tracks").insert(trackInserts);
      if (tError) console.error("Error copying tracks:", tError);
    }

    const newPl: Playlist = {
      id: data.id,
      name: sharedPlaylist.name,
      tracks: [...sharedPlaylist.tracks],
      visibility: "private",
      share_id: null,
    };
    setPlaylists(prev => [...prev, newPl]);
    toast.success(`Playlist "${sharedPlaylist.name}" salva na sua biblioteca!`);
    return data.id;
  }, [user]);

  return {
    playlists,
    loading,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    updateVisibility,
    getShareLink,
    fetchSharedPlaylist,
    copySharedPlaylist,
  };
}
