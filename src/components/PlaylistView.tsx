import { useState, useEffect } from "react";
import { Track, formatDuration, getDownloadUrl } from "@/lib/api";
import { usePlayer } from "@/contexts/PlayerContext";
import { PlaylistVisibility } from "@/hooks/usePlaylistStore";
import { Play, Pause, Trash2, Download, Music, Share2, Globe, Link2, Lock, Copy, Check, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface PlaylistViewProps {
  playlist: { id: string; name: string; tracks: Track[]; visibility?: PlaylistVisibility; share_id?: string | null };
  onRemoveTrack: (trackId: string) => void;
  onDeletePlaylist: () => void;
  onUpdateVisibility?: (visibility: PlaylistVisibility) => void;
  shareLink?: string | null;
  onSaveOffline?: (tracks: Track[]) => void;
  isTrackOffline?: (trackId: string) => boolean;
  onSaveTrackOffline?: (track: Track) => void;
  isTrackSaving?: (trackId: string) => boolean;
}

export default function PlaylistView({
  playlist,
  onRemoveTrack,
  onDeletePlaylist,
  onUpdateVisibility,
  shareLink,
  onSaveOffline,
  isTrackOffline,
  onSaveTrackOffline,
  isTrackSaving,
}: PlaylistViewProps) {
  const { playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
  const on = () => setIsOnline(true);
  const off = () => setIsOnline(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
}, []);

const visibleTracks = isOnline
  ? playlist.tracks
  : playlist.tracks.filter(t => isTrackOffline?.(t.id));

  const handlePlayAll = () => {
    if (visibleTracks.length > 0) playTrack(visibleTracks[0], visibleTracks);
  };

  const handleDownloadAll = async () => {
    if (visibleTracks.length === 0) return;
    setDownloading(true);
    toast.info(`Baixando ${visibleTracks.length} músicas...`);

    for (let i = 0; i < visibleTracks.length; i++) {
      const track = visibleTracks[i];
      try {
        const response = await fetch(getDownloadUrl(track.url, track.title));
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${track.title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`(${i + 1}/${visibleTracks.length}) "${track.title}" baixada`);
        // Small delay between downloads
        if (i < visibleTracks.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (err) {
        console.error(`Error downloading ${track.title}:`, err);
        toast.error(`Erro ao baixar "${track.title}"`);
      }
    }
    setDownloading(false);
    toast.success("Download da playlist completo!");
  };

  const handleDownloadSingle = (track: Track) => {
    const a = document.createElement("a");
    a.href = getDownloadUrl(track.url, track.title);
    a.download = `${track.title}.mp3`;
    a.click();
    toast.success(`Baixando "${track.title}"...`);
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const visibilityIcon = {
    private: <Lock className="h-4 w-4" />,
    link: <Link2 className="h-4 w-4" />,
    public: <Globe className="h-4 w-4" />,
  };

  const visibilityLabel = {
    private: "Privada",
    link: "Via link",
    public: "Pública",
  };

  const isCurrentlyPlaying = (track: Track) => currentTrack?.id === track.id && isPlaying;
  const totalDuration = visibleTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const visibility = playlist.visibility || "private";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-4 sm:p-6 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          <div className="relative flex-shrink-0 group mx-auto sm:mx-0">
            <div className="flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 overflow-hidden shadow-2xl">
              {visibleTracks.length > 0 && visibleTracks[0].thumbnail ? (
                <img src={visibleTracks[0].thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <Music className="h-12 w-12 sm:h-16 sm:w-16 text-primary/40" />
              )}
            </div>
            {visibleTracks.length > 0 && (
              <button onClick={handlePlayAll} className="absolute bottom-3 right-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl glow-primary opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-105">
                <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Playlist</p>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                {visibilityIcon[visibility]}
                {visibilityLabel[visibility]}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-foreground truncate">{playlist.name}</h1>
            <p className="text-sm text-muted-foreground mt-2 sm:mt-3">
              {visibleTracks.length} {visibleTracks.length === 1 ? "música" : "músicas"}
              {totalDuration > 0 && ` • ${formatDuration(totalDuration)}`}
            </p>
          </div>
        </motion.div>

        {!isOnline && (
          <div className="flex items-center gap-2 px-4 sm:px-6 py-2 text-xs text-muted-foreground bg-muted/30 rounded-lg mx-4 sm:mx-6 mb-2">
            <WifiOff className="h-3.5 w-3.5" />
            Modo offline — exibindo apenas músicas salvas ({visibleTracks.length} de {playlist.tracks.length})
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-5 sm:mt-6">
          <Button onClick={handlePlayAll} disabled={visibleTracks.length === 0} size="lg" className="rounded-full gap-2 px-6 sm:px-8 glow-primary-sm hover:glow-primary transition-all">
            <Play className="h-5 w-5" /> Reproduzir
          </Button>
          
          {/* Share dropdown */}
          {onUpdateVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="rounded-full gap-2 border-border/50 hover:border-primary/50 hover:text-primary">
                  <Share2 className="h-4 w-4" /> Compartilhar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 bg-card border-border/50 rounded-xl p-1">
                <DropdownMenuLabel className="text-xs text-muted-foreground px-3 py-1.5">Visibilidade</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onUpdateVisibility("private")}
                  className={`gap-3 rounded-lg ${visibility === "private" ? "bg-primary/10 text-primary" : ""}`}
                >
                  <Lock className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Privada</p>
                    <p className="text-[11px] text-muted-foreground">Só você pode ver</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateVisibility("link")}
                  className={`gap-3 rounded-lg ${visibility === "link" ? "bg-primary/10 text-primary" : ""}`}
                >
                  <Link2 className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Via link</p>
                    <p className="text-[11px] text-muted-foreground">Quem tiver o link pode ver</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateVisibility("public")}
                  className={`gap-3 rounded-lg ${visibility === "public" ? "bg-primary/10 text-primary" : ""}`}
                >
                  <Globe className="h-4 w-4" />
                  <div>
                    <p className="text-sm font-medium">Pública</p>
                    <p className="text-[11px] text-muted-foreground">Todos podem encontrar</p>
                  </div>
                </DropdownMenuItem>
                
                {shareLink && visibility !== "private" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyLink} className="gap-3 rounded-lg">
                      {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      <span className="text-sm">{copied ? "Copiado!" : "Copiar link"}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            onClick={handleDownloadAll}
            variant="outline"
            size="lg"
            className="rounded-full gap-2 border-border/50 hover:border-primary/50 hover:text-primary transition-all"
            disabled={visibleTracks.length === 0 || downloading}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Baixar tudo
          </Button>

          {onSaveOffline && (
            <Button
              onClick={() => onSaveOffline(visibleTracks)}
              variant="outline"
              size="lg"
              className="rounded-full gap-2 border-border/50 hover:border-primary/50 hover:text-primary transition-all"
              disabled={visibleTracks.length === 0}
            >
              <WifiOff className="h-4 w-4" /> Salvar offline
            </Button>
          )}

          <Button onClick={onDeletePlaylist} variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 sm:ml-auto rounded-xl">
            <Trash2 className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      <div className="px-4 sm:px-6 pb-28">
        {visibleTracks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-muted/50"><Music className="h-10 w-10 text-muted-foreground/50" /></div>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">Playlist vazia</p>
            <p className="text-sm text-muted-foreground">Busque e adicione músicas</p>
          </motion.div>
        ) : (
          <div className="space-y-1">
            {visibleTracks.map((track, i) => {
              const playing = isCurrentlyPlaying(track);
              const offline = isTrackOffline?.(track.id);
              const savingOffline = isTrackSaving?.(track.id);
              return (
                <motion.div key={`${track.id}-${i}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl p-2 sm:p-3 transition-all duration-200 group cursor-pointer ${playing ? "bg-primary/10" : "hover:bg-muted/50"}`}
                  onClick={() => { if (playing) togglePlay(); else playTrack(track, visibleTracks); }}
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
                  <img src={track.thumbnail} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0 shadow-lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${playing ? "text-primary" : "text-foreground"}`}>{track.title}</p>
                      {offline && <WifiOff className="h-3 w-3 text-primary flex-shrink-0" />}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">{formatDuration(track.duration)}</span>
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {onSaveTrackOffline && !offline && (
                      <button
                        onClick={e => { e.stopPropagation(); onSaveTrackOffline(track); }}
                        disabled={savingOffline}
                        className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-50"
                        title="Salvar offline"
                      >
                        {savingOffline ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <WifiOff className="h-3.5 w-3.5" />}
                      </button>
                    )}
                    <button onClick={e => { e.stopPropagation(); handleDownloadSingle(track); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); onRemoveTrack(track.id); }} className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
