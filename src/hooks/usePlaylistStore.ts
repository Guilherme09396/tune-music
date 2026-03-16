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

  // Load playlists from localStorage (keyed by user)
  useEffect(() => {
    if (!user) { setPlaylists([]); setLoading(false); return; }
    const key = `soundflow_playlists_${user.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setPlaylists(JSON.parse(saved));
      } catch { setPlaylists([]); }
    }
    setLoading(false);
  }, [user]);

  // Persist to localStorage
  const persist = useCallback((pls: Playlist[]) => {
    if (!user) return;
    const key = `soundflow_playlists_${user.id}`;
    localStorage.setItem(key, JSON.stringify(pls));
  }, [user]);

  const createPlaylist = useCallback((name: string) => {
    const pl: Playlist = { id: crypto.randomUUID(), name, tracks: [] };
    setPlaylists(prev => {
      const next = [...prev, pl];
      persist(next);
      return next;
    });
    toast.success(`Playlist "${name}" criada!`);
    return pl.id;
  }, [persist]);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists(prev => {
      const next = prev.filter(p => p.id !== id);
      persist(next);
      return next;
    });
    toast.success("Playlist removida");
  }, [persist]);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track) => {
    setPlaylists(prev => {
      const next = prev.map(p => {
        if (p.id !== playlistId) return p;
        if (p.tracks.some(t => t.id === track.id)) {
          toast.info("Música já está na playlist");
          return p;
        }
        return { ...p, tracks: [...p.tracks, track] };
      });
      persist(next);
      return next;
    });
    toast.success("Música adicionada!");
  }, [persist]);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists(prev => {
      const next = prev.map(p =>
        p.id === playlistId
          ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
          : p
      );
      persist(next);
      return next;
    });
  }, [persist]);

  return { playlists, loading, createPlaylist, deletePlaylist, addTrackToPlaylist, removeTrackFromPlaylist };
}
