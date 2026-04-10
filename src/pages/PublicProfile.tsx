import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicProfile, fetchPublicPlaylists, fetchUserStats, Profile } from "@/hooks/useProfile";
import { Music2, Clock, PlayCircle, ListMusic, User, ArrowLeft } from "lucide-react";
import { Track, formatDuration } from "@/lib/api";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import PlayerBar from "@/components/PlayerBar";

interface PublicPlaylist {
  id: string;
  name: string;
  trackCount: number;
  tracks: Track[];
}

interface UserStats {
  totalTracks: number;
  totalSeconds: number;
  totalPlays: number;
  topArtists: { name: string; plays: number }[];
}

function formatListenTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function ProfileContent() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const { playTrack, setQueue, currentTrack, isPlaying, togglePlay } = usePlayer();

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetchPublicProfile(username).then(async (p) => {
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProfile(p);
      const [pls, st] = await Promise.all([
        fetchPublicPlaylists(p.user_id),
        fetchUserStats(p.user_id),
      ]);
      setPlaylists(pls);
      setStats(st);
      setLoading(false);
    });
  }, [username]);

  const handlePlayPlaylist = (pl: PublicPlaylist, startIndex = 0) => {
    if (pl.tracks.length === 0) return;
    setQueue(pl.tracks);
    playTrack(pl.tracks[startIndex]);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Perfil não encontrado</h1>
        <p className="text-muted-foreground">O usuário @{username} não existe.</p>
        <Link to="/" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background px-6 pt-8 pb-6">
        <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center ring-4 ring-primary/20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-primary">
                {profile?.display_name?.[0]?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile?.display_name || username}</h1>
            <p className="text-muted-foreground text-sm">@{profile?.username}</p>
            {profile?.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 px-6 py-4">
          <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalPlays}</div>
            <div className="text-xs text-muted-foreground mt-1">Reproduções</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.totalTracks}</div>
            <div className="text-xs text-muted-foreground mt-1">Músicas únicas</div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50 text-center">
            <div className="text-2xl font-bold text-foreground">{formatListenTime(stats.totalSeconds)}</div>
            <div className="text-xs text-muted-foreground mt-1">Tempo ouvido</div>
          </div>
        </div>
      )}

      {/* Top Artists */}
      {stats && stats.topArtists.length > 0 && (
        <div className="px-6 py-3">
          <h2 className="text-lg font-semibold text-foreground mb-3">Artistas mais ouvidos</h2>
          <div className="flex flex-wrap gap-2">
            {stats.topArtists.map((a) => (
              <span key={a.name} className="bg-primary/10 text-primary text-sm px-3 py-1.5 rounded-full">
                {a.name} <span className="text-primary/60 text-xs">({a.plays})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Public Playlists */}
      <div className="px-6 py-4">
        <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <ListMusic className="h-5 w-5" /> Playlists públicas
        </h2>
        {playlists.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma playlist pública.</p>
        ) : (
          <div className="space-y-3">
            {playlists.map((pl) => (
              <div key={pl.id} className="bg-card rounded-xl border border-border/50 overflow-hidden">
                <button
                  onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-foreground">{pl.name}</p>
                    <p className="text-xs text-muted-foreground">{pl.trackCount} músicas</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayPlaylist(pl); }}
                    className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <PlayCircle className="h-5 w-5" />
                  </button>
                </button>

                {expandedPlaylist === pl.id && pl.tracks.length > 0 && (
                  <div className="border-t border-border/30 divide-y divide-border/20">
                    {pl.tracks.map((track, i) => {
                      const playing = currentTrack?.id === track.id;
                      return (
                        <button
                          key={track.id}
                          onClick={() => handlePlayPlaylist(pl, i)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors ${playing ? "bg-primary/5" : ""}`}
                        >
                          <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                          <img src={track.thumbnail} alt="" className="h-8 w-8 rounded object-cover" />
                          <div className="flex-1 min-w-0 text-left">
                            <p className={`text-sm truncate ${playing ? "text-primary font-semibold" : "text-foreground"}`}>{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDuration(track.duration)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerBar getOfflineThumbnailUrl={() => ""} lyricsOpen={false} onToggleLyrics={() => {}} />
    </div>
  );
}

export default function PublicProfile() {
  return (
    <PlayerProvider>
      <ProfileContent />
    </PlayerProvider>
  );
}
