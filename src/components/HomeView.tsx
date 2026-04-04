import { useState, useEffect, useMemo } from "react";
import { Play, Pause, Clock, Music, Sparkles, Mic2, BarChart3, TrendingUp } from "lucide-react";
import { Track, formatDuration, searchTracks } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { motion } from "framer-motion";

interface HomeViewProps {
  onNavigate: (view: string) => void;
}

export default function HomeView({ onNavigate }: HomeViewProps) {
  const { history, recentTracks, topArtists } = useListeningHistory();
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [recommendations, setRecommendations] = useState<Track[]>([]);

  const currentYear = new Date().getFullYear();

  // Filter history for current year only
  const yearHistory = useMemo(() => {
    return history.filter(e => new Date(e.playedAt).getFullYear() === currentYear);
  }, [history, currentYear]);

  const yearStats = useMemo(() => {
    const totalSeconds = yearHistory.reduce((sum, e) => sum + (e.listenedSeconds || e.track.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    const artistMap = new Map<string, { count: number; seconds: number; thumbnail: string }>();
    yearHistory.forEach(e => {
      const listenedSec = e.listenedSeconds || e.track.duration || 0;
      const prev = artistMap.get(e.track.artist) || { count: 0, seconds: 0, thumbnail: "" };
      artistMap.set(e.track.artist, {
        count: prev.count + 1,
        seconds: prev.seconds + listenedSec,
        thumbnail: e.track.thumbnail || prev.thumbnail,
      });
    });
    const topArtists = Array.from(artistMap.entries())
      .map(([name, data]) => ({ name, ...data, minutes: Math.floor(data.seconds / 60) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const trackMap = new Map<string, { track: Track; count: number }>();
    yearHistory.forEach(e => {
      const prev = trackMap.get(e.track.id);
      if (prev) prev.count++;
      else trackMap.set(e.track.id, { track: e.track, count: 1 });
    });
   const topTracks = [...yearHistory]
    .sort((a, b) => (b.playCount || 1) - (a.playCount || 1))
    .slice(0, 5)
    .map(e => ({ track: e.track, count: e.playCount || 1 }));

    return { totalMinutes, totalHours, topArtists, topTracks, uniqueArtists: artistMap.size, totalPlays: yearHistory.length };
  }, [yearHistory]);

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

  const rankColors = [
    "text-primary",
    "text-primary/80",
    "text-primary/60",
    "text-muted-foreground",
    "text-muted-foreground",
  ];

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

        {/* Year Stats Section */}
        {yearHistory.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8 sm:mb-10"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-foreground">Sua retrospectiva {currentYear}</h2>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-4 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{yearStats.totalHours}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">horas ouvidas</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{yearStats.totalPlays}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">reproduções</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{yearStats.uniqueArtists}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">artistas</p>
              </div>
              <div className="rounded-2xl bg-card border border-border/50 p-4 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground tabular-nums">{yearStats.totalMinutes.toLocaleString("pt-BR")}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">minutos totais</p>
              </div>
            </div>

            {/* Top Artists + Top Tracks side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top Artists */}
              {yearStats.topArtists.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Mic2 className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Top Artistas</h3>
                  </div>
                  <div className="space-y-2">
                    {yearStats.topArtists.map((artist, i) => (
                      <div
                        key={artist.name}
                        className="flex items-center gap-3 rounded-xl bg-card border border-border/30 p-2.5 sm:p-3 transition-colors hover:bg-muted/30"
                      >
                        <span className={`text-base sm:text-lg font-bold w-6 text-center ${rankColors[i]}`}>{i + 1}</span>
                        <img src={artist.thumbnail} alt={artist.name} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-border/50" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{artist.name}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {artist.count} {artist.count === 1 ? "reprodução" : "reproduções"} · {artist.minutes} min
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Tracks */}
              {yearStats.topTracks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground">Top Músicas</h3>
                  </div>
                  <div className="space-y-1">
                    {yearStats.topTracks.map((item, i) => (
                      <div
                        key={item.track.id}
                        className="flex items-center gap-3 rounded-xl p-2.5 sm:p-3 transition-colors hover:bg-muted/30 cursor-pointer"
                        onClick={() => isCurrentlyPlaying(item.track) ? togglePlay() : playTrack(item.track, yearStats.topTracks.map(t => t.track))}
                      >
                        <span className={`text-base sm:text-lg font-bold w-6 text-center ${rankColors[Math.min(i, 4)]}`}>{i + 1}</span>
                        <img src={item.track.thumbnail} alt={item.track.title} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shadow" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.track.title}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.track.artist}</p>
                        </div>
                        <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">{item.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Recently Played */}
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

        {/* Recommendations */}
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

        {/* Empty state */}
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
