import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlaylistStore, Playlist } from "@/hooks/usePlaylistStore";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import { useAuth } from "@/contexts/AuthContext";
import { Track, formatDuration } from "@/lib/api";
import { Play, Pause, Save, Music, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

function SharedContent() {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchSharedPlaylist, copySharedPlaylist } = usePlaylistStore();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      setLoading(true);
      const pl = await fetchSharedPlaylist(shareId);
      if (pl) setPlaylist(pl);
      else setNotFound(true);
      setLoading(false);
    })();
  }, [shareId, fetchSharedPlaylist]);

  const handleSave = async () => {
    if (!playlist || !user) return;
    setSaving(true);
    const id = await copySharedPlaylist(playlist);
    setSaving(false);
    if (id) navigate("/");
  };

  const handlePlayAll = () => {
    if (playlist && playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const isCurrentlyPlaying = (track: Track) => currentTrack?.id === track.id && isPlaying;
  const totalDuration = playlist?.tracks.reduce((sum, t) => sum + (t.duration || 0), 0) || 0;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <Music className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold text-foreground">Playlist não encontrada</h1>
        <p className="text-muted-foreground">Este link pode estar expirado ou a playlist foi tornada privada.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="rounded-full gap-2 mt-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <Button onClick={() => navigate("/")} variant="ghost" className="rounded-xl gap-2 mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-6">
          <div className="flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 overflow-hidden shadow-2xl mx-auto sm:mx-0 flex-shrink-0">
            {playlist?.tracks?.[0]?.thumbnail ? (
              <img src={playlist.tracks[0].thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <Music className="h-12 w-12 text-primary/40" />
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Playlist compartilhada</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground">{playlist?.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {playlist?.tracks.length} {playlist?.tracks.length === 1 ? "música" : "músicas"}
              {totalDuration > 0 && ` • ${formatDuration(totalDuration)}`}
            </p>
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Button onClick={handlePlayAll} disabled={!playlist?.tracks.length} size="lg" className="rounded-full gap-2 px-8 glow-primary-sm">
            <Play className="h-5 w-5" /> Reproduzir
          </Button>
          {user && (
            <Button onClick={handleSave} disabled={saving} size="lg" variant="outline" className="rounded-full gap-2 border-border/50 hover:border-primary/50 hover:text-primary">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar na minha biblioteca
            </Button>
          )}
          {!user && (
            <Button onClick={() => navigate("/auth")} size="lg" variant="outline" className="rounded-full gap-2">
              Faça login para salvar
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {playlist?.tracks.map((track, i) => {
            const playing = isCurrentlyPlaying(track);
            return (
              <motion.div
                key={`${track.id}-${i}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer ${playing ? "bg-primary/10" : "hover:bg-muted/50"}`}
                onClick={() => { if (playing) togglePlay(); else playTrack(track, playlist?.tracks || []); }}
              >
                <div className="w-8 flex items-center justify-center flex-shrink-0">
                  {playing ? (
                    <div className="flex items-end gap-[2px] h-4"><div className="equalizer-bar" /><div className="equalizer-bar" /><div className="equalizer-bar" /></div>
                  ) : (
                    <span className="text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                  )}
                </div>
                <img src={track.thumbnail} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${playing ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{formatDuration(track.duration)}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SharedPlaylist() {
  return (
    <PlayerProvider>
      <SharedContent />
    </PlayerProvider>
  );
}
