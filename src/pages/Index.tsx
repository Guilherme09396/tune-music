import { useState, useMemo, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import SearchView from "@/components/SearchView";
import PlaylistView from "@/components/PlaylistView";
import PlayerBar from "@/components/PlayerBar";
import HomeView from "@/components/HomeView";
import HistoryView from "@/components/HistoryView";
import LyricsPanel from "@/components/LyricsPanel";

import { usePlaylistStore } from "@/hooks/usePlaylistStore";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import { useListeningHistory } from "@/hooks/useListeningHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { Track } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function AppContent() {
  const [activeView, setActiveView] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    playlists, createPlaylist, deletePlaylist, addTrackToPlaylist,
    removeTrackFromPlaylist, updateVisibility, getShareLink,
  } = usePlaylistStore();
  const {
    saveTrackOffline, savePlaylistOffline, isTrackOffline, isTrackSaving,
    getOfflineAudioUrl, getOfflineThumbnailUrl,
  } = useOfflineStorage();
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const { addToHistory } = useListeningHistory();
  const { currentTrack, currentTime } = usePlayer();
  const isMobile = useIsMobile();
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const prevTrackRef = useRef<{ track: Track; listenedTime: number } | null>(null);

  useEffect(() => {
    if (prevTrackRef.current && prevTrackRef.current.track.id !== currentTrack?.id) {
      const { track, listenedTime } = prevTrackRef.current;
      addToHistory(track, listenedTime);
    }
    if (currentTrack) {
      prevTrackRef.current = { track: currentTrack, listenedTime: 0 };
    } else {
      prevTrackRef.current = null;
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (prevTrackRef.current && currentTrack && prevTrackRef.current.track.id === currentTrack.id) {
      prevTrackRef.current.listenedTime = currentTime;
    }
  }, [currentTime, currentTrack?.id]);

  useEffect(() => {
    const handleUnload = () => {
      if (prevTrackRef.current && prevTrackRef.current.listenedTime >= 5) {
        const { track, listenedTime } = prevTrackRef.current;
        addToHistory(track, listenedTime);
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [addToHistory]);

  const handleViewChange = (view: string) => {
    setActiveView(view);
    if (isMobile) setSidebarOpen(false);
  };

  const activePlaylist = useMemo(() => {
    if (!activeView.startsWith("playlist:")) return null;
    const id = activeView.split(":")[1];
    return playlists.find(p => p.id === id) || null;
  }, [activeView, playlists]);

  const handleAddToPlaylist = (track: Track) => {
    if (playlists.length === 0) {
      createPlaylist("Minha Playlist").then(id => {
        if (id) addTrackToPlaylist(id, track);
      });
    } else if (playlists.length === 1) {
      addTrackToPlaylist(playlists[0].id, track);
    } else {
      setAddToPlaylistTrack(track);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 transition-transform duration-300' : ''} ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <Sidebar
          playlists={playlists.map(p => ({ id: p.id, name: p.name }))}
          activeView={activeView}
          onViewChange={handleViewChange}
          onCreatePlaylist={createPlaylist}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {isMobile && (
          <div className="flex items-center gap-3 p-4 border-b border-border/50">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <span className="text-lg font-bold text-gradient">SoundFlow</span>
          </div>
        )}

        {activeView === "home" && <HomeView onNavigate={handleViewChange} />}
        {activeView === "search" && <SearchView onAddToPlaylist={handleAddToPlaylist} />}
        {activeView === "history" && <HistoryView />}

        {activePlaylist && (
          <PlaylistView
            playlist={activePlaylist}
            onRemoveTrack={trackId => removeTrackFromPlaylist(activePlaylist.id, trackId)}
            onDeletePlaylist={() => { deletePlaylist(activePlaylist.id); setActiveView("home"); }}
            onUpdateVisibility={v => updateVisibility(activePlaylist.id, v)}
            shareLink={getShareLink(activePlaylist.id)}
            onSaveOffline={savePlaylistOffline}
            isTrackOffline={isTrackOffline}
            onSaveTrackOffline={saveTrackOffline}
            isTrackSaving={isTrackSaving}
            getOfflineAudioUrl={getOfflineAudioUrl}
            getOfflineThumbnailUrl={getOfflineThumbnailUrl}
          />
        )}
      </main>

      <PlayerBar
        onToggleLyrics={() => setLyricsOpen(v => !v)}
        lyricsOpen={lyricsOpen}
        getOfflineThumbnailUrl={getOfflineThumbnailUrl}
      />
      <LyricsPanel open={lyricsOpen} onClose={() => setLyricsOpen(false)} />

      <Dialog open={!!addToPlaylistTrack} onOpenChange={() => setAddToPlaylistTrack(null)}>
        <DialogContent className="bg-card border-border/50 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar à playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 mt-2">
            {playlists.map(pl => (
              <Button
                key={pl.id}
                variant="ghost"
                className="w-full justify-start rounded-xl hover:bg-primary/10 hover:text-primary"
                onClick={() => {
                  if (addToPlaylistTrack) {
                    addTrackToPlaylist(pl.id, addToPlaylistTrack);
                    setAddToPlaylistTrack(null);
                  }
                }}
              >
                {pl.name}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Index() {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
}