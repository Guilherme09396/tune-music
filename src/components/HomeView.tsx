import { useState, useEffect } from "react";
import { Play, Pause, Clock, Music, Sparkles } from "lucide-react";
import { Track, formatDuration, searchTracks } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { motion } from "framer-motion";

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  const { recentTracks, topArtists } = useListeningHistory();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [recommendations, setRecommendations] = useState<Track[]>([]);

  useEffect(() => {
    const fetchRecs = async () => {
      if (topArtists.length === 0) return;
      try {
        const artist = topArtists[Math.floor(Math.random() * topArtists.length)];
        const tracks = await searchTracks(artist);
        const recentIds = new Set(recentTracks.map(t => t.id));
        const filtered = tracks.filter(t => !recentIds.has(t.id));
        setRecommendations(filtered.length > 0 ? filtered : tracks);
      } catch {}
    };
    fetchRecs();
  }, [topArtists.join(",")]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const isCurrentlyPlaying = (track: Track) => currentTrack?.id === track.id && isPlaying;

  const TrackCard = ({ track, tracks }: { track: Track; tracks: Track[] }) => {
    const playing = isCurrentlyPlaying(track);
    return (
      <div
        className={`group flex items-center gap-3 rounded-xl p-2 sm:p-3 cursor-pointer transition-all duration-200 ${playing ? "bg-primary/10" : "hover:bg-muted/50"}`}
        onClick={() => playing ? togglePlay() : playTrack(track, tracks)}
      >
        <div className="relative flex-shrink-0">
          <img src={track.thumbnail} alt={track.title} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shadow-lg" />
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            {playing ? <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> : <Play className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs sm:text-sm font-semibold truncate ${playing ? "text-primary" : "text-foreground"}`}>{track.title}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{formatDuration(track.duration)}</span>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 pb-28">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{getGreeting()} 👋</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">O que vamos ouvir hoje?</p>
        </motion.div>

        {recentTracks.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8 sm:mb-10">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">Tocadas recentemente</h2>
              </div>
              <button onClick={() => onNavigate("history")} className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors">Ver tudo</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {recentTracks.slice(0, 6).map(track => (
                <div
                  key={track.id}
                  className="group flex items-center gap-3 rounded-xl glass-card p-2.5 sm:p-3 cursor-pointer transition-all duration-200 hover:bg-muted/50"
                  onClick={() => isCurrentlyPlaying(track) ? togglePlay() : playTrack(track, recentTracks)}
                >
                  <img src={track.thumbnail} alt={track.title} className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg object-cover shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs sm:text-sm font-semibold truncate ${isCurrentlyPlaying(track) ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                  </div>
                  {isCurrentlyPlaying(track) && (
                    <div className="flex items-end gap-[2px] h-4 mr-2">
                      <div className="equalizer-bar" /><div className="equalizer-bar" /><div className="equalizer-bar" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {recommendations.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">Recomendações para você</h2>
            </div>
            <div className="space-y-1">
              {recommendations.slice(0, 5).map(track => (
                <TrackCard key={track.id} track={track} tracks={recommendations} />
              ))}
            </div>
          </motion.section>
        )}

        {recentTracks.length === 0 && recommendations.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
              <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-full bg-muted/50">
                <Music className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">Comece a explorar</h2>
            <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">Pesquise suas músicas favoritas e elas aparecerão aqui.</p>
            <button onClick={() => onNavigate("search")} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors glow-primary-sm">Começar a buscar</button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
