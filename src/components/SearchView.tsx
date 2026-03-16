import { useState } from "react";
import { Search, Play, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchTracks, Track, formatDuration } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { toast } from "sonner";

interface SearchViewProps {
  onAddToPlaylist?: (track: Track) => void;
}

export default function SearchView({ onAddToPlaylist }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const { playTrack } = usePlayer();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const tracks = await searchTracks(query.trim());
      setResults(tracks);
      if (tracks.length === 0) toast.info("Nenhuma música encontrada");
    } catch {
      toast.error("Erro ao buscar músicas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Buscar</h1>
      <form onSubmit={handleSearch} className="relative max-w-xl mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar músicas, artistas..."
          className="pl-10 bg-card border-border"
        />
      </form>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-1">
          {results.map((track, i) => (
            <div
              key={track.id}
              className="flex items-center gap-3 rounded-lg p-3 glass-hover transition-colors group cursor-pointer"
              onClick={() => playTrack(track, results)}
            >
              <span className="w-6 text-center text-sm text-muted-foreground group-hover:hidden">
                {i + 1}
              </span>
              <Play className="w-6 h-4 text-foreground hidden group-hover:block" />
              <img
                src={track.thumbnail}
                alt={track.title}
                className="h-10 w-10 rounded object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(track.duration)}
              </span>
              {onAddToPlaylist && (
                <button
                  onClick={e => { e.stopPropagation(); onAddToPlaylist(track); }}
                  className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  title="Adicionar à playlist"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !query && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">Pesquise por músicas ou artistas</p>
        </div>
      )}
    </div>
  );
}
