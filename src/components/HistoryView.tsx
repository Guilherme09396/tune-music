import { Play, Pause, Trash2, Clock, Download } from "lucide-react";
import { Track, formatDuration, getDownloadUrl } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function HistoryView() {
  const { history, clearHistory } = useListeningHistory();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const isCurrentlyPlaying = (track: Track) => currentTrack?.id === track.id && isPlaying;

  const formatDate = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}min`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString("pt-BR");
  };

  const handleDownload = (track: Track) => {
    const a = document.createElement("a");
    a.href = getDownloadUrl(track.url, track.title);
    a.download = `${track.title}.mp3`;
    a.click();
    toast.success(`Baixando "${track.title}"...`);
  };

  const allTracks = history.map(e => e.track);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 pb-28">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" /> Histórico
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {history.length} {history.length === 1 ? "música" : "músicas"}
            </p>
          </div>
          {history.length > 0 && (
            <Button variant="ghost" onClick={clearHistory} className="text-muted-foreground hover:text-destructive text-xs sm:text-sm">
              <Trash2 className="h-4 w-4 mr-1 sm:mr-2" /> Limpar
            </Button>
          )}
        </motion.div>

        {history.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-muted/50"><Clock className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" /></div>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Nenhum histórico ainda</p>
            <p className="text-sm text-muted-foreground">Comece a ouvir para ver seu histórico aqui</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {history.map((entry, i) => {
              const playing = isCurrentlyPlaying(entry.track);
              return (
                <motion.div key={`${entry.track.id}-${entry.playedAt}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl p-2 sm:p-3 transition-all duration-200 group cursor-pointer ${playing ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  onClick={() => playing ? togglePlay() : playTrack(entry.track, allTracks)}
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
                  <img src={entry.track.thumbnail} alt={entry.track.title} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0 shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${playing ? "text-primary" : "text-foreground"}`}>{entry.track.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{entry.track.artist}</p>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground/60 hidden sm:block">{formatDate(entry.playedAt)}</span>
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{formatDuration(entry.track.duration)}</span>
                  <button onClick={e => { e.stopPropagation(); handleDownload(entry.track); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
