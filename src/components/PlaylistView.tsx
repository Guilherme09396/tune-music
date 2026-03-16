import { Track, formatDuration, getDownloadUrl } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Pause, Trash2, Download, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PlaylistViewProps {
  playlist: { id: string; name: string; tracks: Track[] };
  onRemoveTrack: (trackId: string) => void;
  onDeletePlaylist: () => void;
}

export default function PlaylistView({ playlist, onRemoveTrack, onDeletePlaylist }: PlaylistViewProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) playTrack(playlist.tracks[0], playlist.tracks);
  };

  const handleDownloadAll = () => {
    toast.info("Iniciando download da playlist...");
    playlist.tracks.forEach((track, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = getDownloadUrl(track.url, track.title);
        a.download = `${track.title}.mp3`;
        a.click();
      }, i * 1500);
    });
  };

  const handleDownloadSingle = (track: Track) => {
    const a = document.createElement("a");
    a.href = getDownloadUrl(track.url, track.title);
    a.download = `${track.title}.mp3`;
    a.click();
    toast.success(`Baixando "${track.title}"...`);
  };

  const isCurrentlyPlaying = (track: Track) => currentTrack?.id === track.id && isPlaying;
  const totalDuration = playlist.tracks.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="relative flex-shrink-0 group mx-auto sm:mx-0">
            <div className="flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 overflow-hidden shadow-2xl">
              {playlist.tracks.length > 0 && playlist.tracks[0].thumbnail ? (
                <img src={playlist.tracks[0].thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <Music className="h-12 w-12 sm:h-16 sm:w-16 text-primary/40" />
              )}
            </div>
            {playlist.tracks.length > 0 && (
              <button onClick={handlePlayAll} className="absolute bottom-3 right-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl glow-primary opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105">
                <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Playlist</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground truncate">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground mt-2 sm:mt-3">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? "música" : "músicas"}
              {totalDuration > 0 && ` • ${formatDuration(totalDuration)}`}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-5 sm:mt-6">
          <Button onClick={handlePlayAll} disabled={playlist.tracks.length === 0} size="lg" className="rounded-full gap-2 px-6 sm:px-8 glow-primary-sm hover:glow-primary transition-all">
            <Play className="h-5 w-5" /> Reproduzir
          </Button>
          <Button onClick={handleDownloadAll} variant="outline" size="lg" className="rounded-full gap-2 border-border/50 hover:border-primary/50 hover:text-primary transition-all" disabled={playlist.tracks.length === 0}>
            <Download className="h-4 w-4" /> Baixar tudo
          </Button>
          <Button onClick={onDeletePlaylist} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:ml-auto rounded-xl">
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      <div className="px-4 sm:px-6 pb-28">
        {playlist.tracks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted/50"><Music className="h-10 w-10 text-muted-foreground/50" /></div>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Playlist vazia</p>
            <p className="text-sm text-muted-foreground">Busque e adicione músicas</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, i) => {
              const playing = isCurrentlyPlaying(track);
              return (
                <motion.div key={`${track.id}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl p-2 sm:p-3 transition-all duration-200 group cursor-pointer ${playing ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  onClick={() => { if (playing) togglePlay(); else playTrack(track, playlist.tracks); }}
                >
                  <div className="w-6 sm:w-8 flex items-center justify-center flex-shrink-0">
                    {playing ? (
                      <div className="flex items-end gap-[2px] h-4"><div className="equalizer-bar" /><div className="equalizer-bar" /><div className="equalizer-bar" /></div>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm text-muted-foreground group-hover:hidden tabular-nums">{i + 1}</span>
                        <Play className="h-4 w-4 text-foreground hidden group-hover:block" />
                      </>
                    )}
                  </div>
                  <img src={track.thumbnail} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0 shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${playing ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{formatDuration(track.duration)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); handleDownloadSingle(track); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onRemoveTrack(track.id); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
