import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/contexts/PlayerContext";
import { formatDuration } from "@/lib/api";
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Volume1, Download, ChevronDown, Music2
} from "lucide-react";
import { getDownloadUrl } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PlayerBar({ onToggleLyrics, lyricsOpen, getOfflineThumbnailUrl }) {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    togglePlay, seekTo, setVolume, nextTrack, prevTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
  } = usePlayer();
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState("");
  const [seekValue, setSeekValue] = useState(0);
  const isDraggingRef = useRef(false);

  // Sync seek value with currentTime only when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      setSeekValue(currentTime);
    }
  }, [currentTime]);

  // Resolve capa offline quando necessário
  useEffect(() => {
    if (!currentTrack) return;
    if (!navigator.onLine && getOfflineThumbnailUrl) {
      getOfflineThumbnailUrl(currentTrack.id).then(url => {
        setThumbnailSrc(url || currentTrack.thumbnail);
      });
    } else {
      setThumbnailSrc(currentTrack.thumbnail);
    }
  }, [currentTrack?.id, currentTrack?.thumbnail, getOfflineThumbnailUrl]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (seekValue / duration) * 100 : 0;

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = getDownloadUrl(currentTrack.url, currentTrack.title);
    a.download = `${currentTrack.title}.mp3`;
    a.click();
    toast.success(`Baixando "${currentTrack.title}"...`);
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleSeekChange = (e) => {
    isDraggingRef.current = true;
    setSeekValue(Number(e.target.value));
  };

  const handleSeekCommit = (e) => {
    seekTo(Number(e.target.value));
    isDraggingRef.current = false;
  };

  // Mobile expanded player
  if (isMobile && expanded) {
    return (
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="fixed inset-0 z-50 flex flex-col bg-background p-6"
      >
        <button onClick={() => setExpanded(false)} className="self-center mb-6 p-2 text-muted-foreground">
          <ChevronDown className="h-6 w-6" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <img
            src={thumbnailSrc}
            alt={currentTrack.title}
            className={`w-64 h-64 rounded-2xl object-cover shadow-2xl ${isPlaying ? "animate-pulse-glow" : ""}`}
          />
          <div className="text-center w-full px-4">
            <p className="text-lg font-bold truncate text-foreground">{currentTrack.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{currentTrack.artist}</p>
          </div>

          <div className="w-full px-2">
            <input
              type="range" min={0} max={duration || 100} value={seekValue}
              onChange={handleSeekChange}
              onMouseUp={handleSeekCommit}
              onTouchEnd={handleSeekCommit}
              className="w-full h-1"
              style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)` }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(seekValue)}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={toggleShuffle} className={`p-2 rounded-lg ${isShuffle ? "text-primary" : "text-muted-foreground"}`}>
              <Shuffle className="h-5 w-5" />
            </button>
            <button onClick={prevTrack} className="p-2 text-foreground"><SkipBack className="h-6 w-6" /></button>
            <button onClick={togglePlay} className="flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background shadow-lg">
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-2 text-foreground"><SkipForward className="h-6 w-6" /></button>
            <button onClick={toggleRepeat} className={`p-2 rounded-lg ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground"}`}>
              {repeatMode === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center gap-4 mt-2">
            <button onClick={handleDownload} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <Download className="h-4 w-4" /> Baixar
            </button>
            {onToggleLyrics && (
              <button onClick={onToggleLyrics} className={`flex items-center gap-2 text-sm ${lyricsOpen ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                <Music2 className="h-4 w-4" /> Letra
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Mobile compact player
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50" style={{ background: "hsl(var(--player-bg))" }}>
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted/30">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2" onClick={() => setExpanded(true)}>
          <img src={thumbnailSrc} alt="" className="h-10 w-10 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate text-foreground">{currentTrack.title}</p>
            <p className="text-[10px] text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
          <button onClick={e => { e.stopPropagation(); togglePlay(); }} className="p-2">
            {isPlaying ? <Pause className="h-5 w-5 text-foreground" /> : <Play className="h-5 w-5 text-foreground" />}
          </button>
          <button onClick={e => { e.stopPropagation(); nextTrack(); }} className="p-2">
            <SkipForward className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  // Desktop player
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50"
        style={{
          background: "linear-gradient(to top, hsl(var(--player-bg)), hsl(var(--player-bg) / 0.95))",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted/30 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seekTo(pct * duration);
          }}
        >
          <div className="h-full bg-primary transition-all duration-150 relative" style={{ width: `${progress}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary glow-primary-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className="mx-auto flex h-20 max-w-screen-2xl items-center gap-4 px-4">
          <div className="flex items-center gap-3 w-[280px] min-w-0">
            <img src={thumbnailSrc} alt={currentTrack.title} className={`h-14 w-14 rounded-xl object-cover shadow-xl ${isPlaying ? "animate-pulse-glow" : ""}`} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{currentTrack.artist}</p>
            </div>
            <button onClick={handleDownload} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0 ml-1" title="Baixar">
              <Download className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex items-center gap-5">
              <button onClick={toggleShuffle} className={`p-1.5 rounded-lg transition-all ${isShuffle ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
                <Shuffle className="h-4 w-4" />
              </button>
              <button onClick={prevTrack} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SkipBack className="h-5 w-5" /></button>
              <button onClick={togglePlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background hover:scale-110 transition-all duration-200 shadow-lg">
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"><SkipForward className="h-5 w-5" /></button>
              <button onClick={toggleRepeat} className={`p-1.5 rounded-lg transition-all ${repeatMode !== "off" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}>
                {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">{formatDuration(seekValue)}</span>
              <div className="relative flex-1">
                <input
                  type="range" min={0} max={duration || 100} value={seekValue}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  className="w-full h-1 cursor-pointer"
                  style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)` }}
                />
              </div>
              <span className="text-[11px] text-muted-foreground w-10 tabular-nums">{formatDuration(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-[200px] justify-end">
            {onToggleLyrics && (
              <button onClick={onToggleLyrics} className={`p-1.5 rounded-lg transition-all ${lyricsOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`} title="Letra">
                <Music2 className="h-4 w-4" />
              </button>
            )}
            <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <VolumeIcon className="h-4 w-4" />
            </button>
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} className="w-24 h-1" style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${volume * 100}%, hsl(var(--muted)) ${volume * 100}%)` }} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}