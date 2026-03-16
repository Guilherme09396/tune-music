import { Track, formatDuration, getDownloadUrl } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { Play, Pause, Trash2, Download, Music, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PlaylistViewProps {
  playlist: { id: string; name: string; tracks: Track[] };
  onRemoveTrack: (trackId: string) => void;
  onDeletePlaylist: () => void;
}

export default function PlaylistView({ playlist, onRemoveTrack, onDeletePlaylist }: PlaylistViewProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();

  const handlePlayAll = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0], playlist.tracks);
    }
  };

  const handleDownloadAll = () => {
    toast.info("Iniciando download da playlist...");
    playlist.tracks.forEach((track, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = getDownloadUrl(track.url, track.title);
        a.download = `${track.title}.mp3`;
        a.click();
      }, i * 1500); // stagger downloads
    });
  };

  const isCurrentlyPlaying = (track: Track) =>
    currentTrack?.id === track.id && isPlaying;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-end gap-6">
          <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 flex-shrink-0">
            {playlist.tracks.length > 0 && playlist.tracks[0].thumbnail ? (
              <img
                src={playlist.tracks[0].thumbnail}
                alt=""
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <Music className="h-16 w-16 text-primary/50" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Playlist</p>
            <h1 className="text-3xl font-bold text-foreground mt-1 truncate">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground mt-2">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? "música" : "músicas"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6">
          <Button onClick={handlePlayAll} disabled={playlist.tracks.length === 0} size="lg" className="rounded-full gap-2">
            <Play className="h-5 w-5" />
            Reproduzir
          </Button>
          <Button onClick={handleDownloadAll} variant="outline" size="lg" className="rounded-full gap-2" disabled={playlist.tracks.length === 0}>
            <Download className="h-4 w-4" />
            Baixar tudo
          </Button>
          <Button onClick={onDeletePlaylist} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive ml-auto">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Track list */}
      <div className="px-6 pb-28">
        {playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Music className="h-12 w-12 mb-3 opacity-30" />
            <p>Nenhuma música na playlist</p>
            <p className="text-sm">Busque e adicione músicas</p>
          </div>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, i) => {
              const playing = isCurrentlyPlaying(track);
              return (
                <div
                  key={`${track.id}-${i}`}
                  className={`flex items-center gap-3 rounded-lg p-3 glass-hover transition-colors group cursor-pointer ${playing ? "bg-primary/10" : ""}`}
                  onClick={() => {
                    if (playing) togglePlay();
                    else playTrack(track, playlist.tracks);
                  }}
                >
                  <span className={`w-6 text-center text-sm ${playing ? "text-primary" : "text-muted-foreground"} group-hover:hidden`}>
                    {playing ? "♫" : i + 1}
                  </span>
                  <span className="w-6 text-center hidden group-hover:block">
                    {playing ? <Pause className="h-4 w-4 text-primary mx-auto" /> : <Play className="h-4 w-4 text-foreground mx-auto" />}
                  </span>
                  <img src={track.thumbnail} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${playing ? "text-primary" : "text-foreground"}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">{formatDuration(track.duration)}</span>
                  <button
                    onClick={e => { e.stopPropagation(); onRemoveTrack(track.id); }}
                    className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
