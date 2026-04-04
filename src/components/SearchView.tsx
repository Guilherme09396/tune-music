import { useState, useRef } from "react";
import { Search, Play, Plus, Loader2, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTracks, Track, formatDuration, getDownloadUrl } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface SearchViewProps {
  onAddToPlaylist?: (track: Track) => void;
}

export default function SearchView({ onAddToPlaylist }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setPage(1);
      try {
        const tracks = await searchTracks(query.trim());
        setResults(tracks);
        if (tracks.length === 0) toast.info("Nenhuma música encontrada");
      } catch {
        toast.error("Erro ao buscar músicas");
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleDownload = (track: Track) => {
    const a = document.createElement("a");
    a.href = getDownloadUrl(track.url, track.title);
    a.download = `${track.title}.mp3`;
    a.click();
    toast.success(`Baixando "${track.title}"...`);
  };

  const isCurrentlyPlaying = (track: Track) =>
    currentTrack?.id === track.id && isPlaying;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 pb-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-foreground"
        >
          Buscar
        </motion.h1>

        <form onSubmit={handleSearch} className="relative max-w-2xl mb-6 sm:mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="O que você quer ouvir?"
            className="pl-12 pr-4 h-12 text-base bg-muted/50 border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:bg-muted/70 transition-all"
          />
        </form>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Buscando músicas...</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {!loading && results.length > 0 && (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-4 sm:px-6 pb-28">
            <p className="text-sm text-muted-foreground mb-4">
              {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-1">
              {paginated.map((track, i) => {
                const globalIndex = (page - 1) * PAGE_SIZE + i;
                const playing = isCurrentlyPlaying(track);
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-2 sm:gap-3 rounded-xl p-2 sm:p-3 transition-all duration-200 group cursor-pointer ${playing ? "bg-primary/10" : "hover:bg-muted/50"}`}
                    onClick={() => { if (playing) togglePlay(); else playTrack(track, results); }}
                  >
                    <div className="w-6 sm:w-8 flex items-center justify-center flex-shrink-0">
                      {playing ? (
                        <div className="flex items-end gap-[2px] h-4">
                          <div className="equalizer-bar" /><div className="equalizer-bar" /><div className="equalizer-bar" />
                        </div>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm text-muted-foreground group-hover:hidden tabular-nums">{globalIndex + 1}</span>
                          <Play className="h-4 w-4 text-foreground hidden group-hover:block" />
                        </>
                      )}
                    </div>

                    <img src={track.thumbnail} alt={track.title} className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0 shadow-lg" />

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${playing ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                    </div>

                    <span className="text-xs text-muted-foreground tabular-nums mr-1 hidden sm:block">{formatDuration(track.duration)}</span>

                    <div className="flex items-center gap-1">
                      {onAddToPlaylist && (
                        <button onClick={e => { e.stopPropagation(); onAddToPlaylist(track); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Adicionar à playlist">
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); handleDownload(track); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Baixar música">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-muted/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {!loading && results.length === 0 && !query && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-muted-foreground px-4">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-muted/50">
                <Search className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/50" />
              </div>
            </div>
            <p className="text-lg sm:text-xl font-semibold text-foreground mb-1">Explore milhares de músicas</p>
            <p className="text-sm text-center">Pesquise por músicas, artistas ou álbuns</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}