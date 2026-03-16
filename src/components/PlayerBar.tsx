import { usePlayer } from "@/contexts/PlayerContext";
import { formatDuration } from "@/lib/api";
import {
  Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX
} from "lucide-react";
import { useState } from "react";

export default function PlayerBar() {
  const {
    currentTrack, isPlaying, currentTime, duration, volume,
    togglePlay, seekTo, setVolume, nextTrack, prevTrack,
    isShuffle, toggleShuffle, repeatMode, toggleRepeat,
  } = usePlayer();
  const [showVolume, setShowVolume] = useState(false);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t border-border bg-[hsl(var(--player-bg))] backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center gap-4 px-4">
        {/* Track info */}
        <div className="flex items-center gap-3 w-[240px] min-w-0">
          <img
            src={currentTrack.thumbnail}
            alt={currentTrack.title}
            className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{currentTrack.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`p-1 transition-colors ${isShuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Shuffle className="h-4 w-4" />
            </button>
            <button onClick={prevTrack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button onClick={nextTrack} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              <SkipForward className="h-5 w-5" />
            </button>
            <button
              onClick={toggleRepeat}
              className={`p-1 transition-colors ${repeatMode !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex w-full max-w-lg items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {formatDuration(currentTime)}
            </span>
            <div className="relative flex-1 group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={e => seekTo(Number(e.target.value))}
                className="w-full h-1 cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) ${progress}%, hsl(var(--muted)) ${progress}%)`,
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-10 tabular-nums">
              {formatDuration(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 w-[140px] justify-end">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="w-20 h-1"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) ${volume * 100}%, hsl(var(--muted)) ${volume * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
