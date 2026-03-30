import { useState, useEffect } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { fetchLyrics } from "@/lib/lyrics";
import { Music2, X, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LyricsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function LyricsPanel({ open, onClose }: LyricsPanelProps) {
  const { currentTrack } = usePlayer();
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!currentTrack || !open) return;
    setLoading(true);
    setError(false);
    setLyrics(null);

    fetchLyrics(currentTrack.title, currentTrack.artist).then(result => {
      if (result) {
        setLyrics(result.lyrics);
      } else {
        setError(true);
      }
      setLoading(false);
    });
  }, [currentTrack?.id, open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed right-0 top-0 bottom-0 z-40 w-full sm:w-[380px] lg:w-[420px] border-l border-border/50 bg-background/95 backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
          <div className="flex items-center gap-2.5">
            <Music2 className="h-5 w-5 text-primary" />
            <h2 className="text-base font-bold text-foreground">Letra</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Track info */}
        {currentTrack && (
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/20">
            <img src={currentTrack.thumbnail} alt="" className="h-10 w-10 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="px-5 py-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Buscando letra...</p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium text-foreground">Letra não encontrada</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Não foi possível encontrar a letra desta música.
                </p>
              </div>
            )}

            {!loading && !error && !currentTrack && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Music2 className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Toque uma música para ver a letra</p>
              </div>
            )}

            {lyrics && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-1"
              >
                {lyrics.split("\n").map((line, i) => (
                  <p
                    key={i}
                    className={`text-sm leading-relaxed ${
                      line.trim() === "" ? "h-4" : "text-foreground/90"
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}
