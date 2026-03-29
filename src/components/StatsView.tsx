import { useMemo } from "react";
import { BarChart3, Music, Mic2, Clock } from "lucide-react";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { formatDuration } from "@/lib/api";
import { motion } from "framer-motion";

export default function StatsView() {
  const { history } = useListeningHistory();

  const stats = useMemo(() => {
    const totalSeconds = history.reduce((sum, e) => sum + (e.track.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);

    // Top artists with total minutes
    const artistMap = new Map<string, { count: number; seconds: number; thumbnail: string }>();
    history.forEach(e => {
      const prev = artistMap.get(e.track.artist) || { count: 0, seconds: 0, thumbnail: "" };
      artistMap.set(e.track.artist, {
        count: prev.count + 1,
        seconds: prev.seconds + (e.track.duration || 0),
        thumbnail: e.track.thumbnail || prev.thumbnail,
      });
    });
    const topArtists = Array.from(artistMap.entries())
      .map(([name, data]) => ({ name, ...data, minutes: Math.floor(data.seconds / 60) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top tracks by play count
    const trackMap = new Map<string, { track: typeof history[0]["track"]; count: number }>();
    history.forEach(e => {
      const prev = trackMap.get(e.track.id);
      if (prev) {
        prev.count++;
      } else {
        trackMap.set(e.track.id, { track: e.track, count: 1 });
      }
    });
    const topTracks = Array.from(trackMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { totalMinutes, totalSeconds, topArtists, topTracks };
  }, [history]);

  const rankColors = [
    "text-primary",
    "text-primary/80",
    "text-primary/60",
    "text-muted-foreground",
    "text-muted-foreground",
  ];

  if (history.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
              <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Sem estatísticas ainda</h2>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Comece a ouvir músicas para ver suas estatísticas aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 pb-28 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Suas estatísticas</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Veja como foi o seu tempo em música</p>
        </motion.div>

        {/* Total minutes + top artist hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {/* Total minutes card */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 p-5 sm:p-6 flex items-center gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-primary/20">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
                {stats.totalMinutes.toLocaleString("pt-BR")}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">minutos ouvidos</p>
            </div>
          </div>

          {/* Total tracks card */}
          <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-6 flex items-center gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-muted">
              <Music className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums">
                {history.length}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">músicas reproduzidas</p>
            </div>
          </div>
        </motion.div>

        {/* Two columns: top artists + top tracks */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Artists */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Mic2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Artistas mais ouvidos</h2>
            </div>
            <div className="space-y-2">
              {stats.topArtists.map((artist, i) => (
                <div
                  key={artist.name}
                  className="flex items-center gap-4 rounded-xl bg-card border border-border/30 p-3 sm:p-4 transition-colors hover:bg-muted/30"
                >
                  <span className={`text-lg sm:text-xl font-bold w-6 text-center ${rankColors[i]}`}>
                    {i + 1}
                  </span>
                  <img
                    src={artist.thumbnail}
                    alt={artist.name}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover ring-2 ring-border/50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-foreground truncate">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {artist.count} {artist.count === 1 ? "reprodução" : "reproduções"} · {artist.minutes.toLocaleString("pt-BR")} min
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Top Tracks */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Music className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Músicas mais ouvidas</h2>
            </div>
            <div className="space-y-1">
              {stats.topTracks.map((item, i) => (
                <div
                  key={item.track.id}
                  className="flex items-center gap-3 rounded-xl p-2.5 sm:p-3 transition-colors hover:bg-muted/30"
                >
                  <span className={`text-base sm:text-lg font-bold w-6 text-center ${rankColors[Math.min(i, 4)]}`}>
                    {i + 1}
                  </span>
                  <img
                    src={item.track.thumbnail}
                    alt={item.track.title}
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shadow"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{item.track.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
                    {formatDuration(item.track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
