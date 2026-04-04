import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import { Track, getStreamUrl, markServerFailed } from "@/lib/api";

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: "off" | "all" | "one";
}

interface PlayerContextType extends PlayerState {
  playTrack: (track: Track, newQueue?: Track[]) => void;
  togglePlay: () => void;
  seekTo: (time: number) => void;
  setVolume: (vol: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

interface PlayerProviderProps {
  children: React.ReactNode;
  onTrackListened?: (track: Track, listenedSeconds: number) => void;
}

export function PlayerProvider({ children, onTrackListened }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const retryCountRef = useRef(0);
  const listenStartRef = useRef<number | null>(null);
  const currentTrackRef = useRef<Track | null>(null);

  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isShuffle: false,
    repeatMode: "off",
  });

  const audio = audioRef.current;

  // Salva referência da track atual para usar nos event listeners
  useEffect(() => {
    currentTrackRef.current = state.currentTrack;
  }, [state.currentTrack]);

  useEffect(() => {
    audio.volume = state.volume;
  }, [state.volume, audio]);

  // Função para registrar o tempo ouvido e chamar callback
  const saveListenedTime = useCallback(() => {
    if (listenStartRef.current !== null && currentTrackRef.current && onTrackListened) {
      const listenedSeconds = (Date.now() - listenStartRef.current) / 1000;
      onTrackListened(currentTrackRef.current, listenedSeconds);
      listenStartRef.current = null;
    }
  }, [onTrackListened]);

  useEffect(() => {
    const onTimeUpdate = () => setState(s => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () => setState(s => ({ ...s, duration: audio.duration || 0 }));

    const onPlay = () => {
      setState(s => ({ ...s, isPlaying: true }));
      listenStartRef.current = Date.now();
    };

    const onPause = () => {
      setState(s => ({ ...s, isPlaying: false }));
      saveListenedTime();
    };

    const onEnded = () => {
      saveListenedTime();

      setState(prev => {
        const { queue, queueIndex, repeatMode, isShuffle } = prev;

        if (repeatMode === "one") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
          return { ...prev, isPlaying: true };
        }

        let nextIndex: number;
        if (isShuffle) {
          nextIndex = Math.floor(Math.random() * queue.length);
        } else {
          nextIndex = queueIndex + 1;
        }

        if (nextIndex >= queue.length) {
          if (repeatMode === "all") {
            nextIndex = 0;
          } else {
            return { ...prev, isPlaying: false };
          }
        }

        const nextTrack = queue[nextIndex];
        if (nextTrack) {
          retryCountRef.current = 0;
          audio.src = getStreamUrl(nextTrack.url);
          audio.play().catch(() => {});
          return { ...prev, currentTrack: nextTrack, queueIndex: nextIndex, isPlaying: true, currentTime: 0 };
        }

        return { ...prev, isPlaying: false };
      });
    };

    const onError = () => {
      console.error("Audio playback error");
      if (retryCountRef.current < 1) {
        retryCountRef.current += 1;
        markServerFailed();
        setState(prev => {
          if (prev.currentTrack) {
            audio.src = getStreamUrl(prev.currentTrack.url);
            audio.play().catch(() => {});
            return { ...prev, isPlaying: true };
          }
          return { ...prev, isPlaying: false };
        });
      } else {
        setState(s => ({ ...s, isPlaying: false }));
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("error", onError);
    };
  }, [audio, saveListenedTime]);

  const playTrack = useCallback((track: Track, newQueue?: Track[]) => {
    // Salva tempo da track anterior antes de trocar
    saveListenedTime();

    const q = newQueue || [track];
    const idx = newQueue ? newQueue.findIndex(t => t.id === track.id) : 0;
    retryCountRef.current = 0;
    audio.src = getStreamUrl(track.url);
    audio.play().catch(() => {});
    setState(s => ({
      ...s,
      currentTrack: track,
      queue: q,
      queueIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
      currentTime: 0,
    }));
  }, [audio, saveListenedTime]);

  const togglePlay = useCallback(() => {
    if (!state.currentTrack) return;
    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [audio, state.isPlaying, state.currentTrack]);

  const seekTo = useCallback((time: number) => {
    audio.currentTime = time;
  }, [audio]);

  const setVolume = useCallback((vol: number) => {
    audio.volume = vol;
    setState(s => ({ ...s, volume: vol }));
  }, [audio]);

  const nextTrack = useCallback(() => {
    saveListenedTime();
    setState(prev => {
      const { queue, queueIndex, isShuffle, repeatMode } = prev;
      let nextIndex: number;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        nextIndex = queueIndex + 1;
      }
      if (nextIndex >= queue.length) {
        if (repeatMode === "all") nextIndex = 0;
        else return prev;
      }
      const next = queue[nextIndex];
      if (next) {
        retryCountRef.current = 0;
        audio.src = getStreamUrl(next.url);
        audio.play().catch(() => {});
        return { ...prev, currentTrack: next, queueIndex: nextIndex, isPlaying: true, currentTime: 0 };
      }
      return prev;
    });
  }, [audio, saveListenedTime]);

  const prevTrack = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    saveListenedTime();
    setState(prev => {
      const { queue, queueIndex } = prev;
      const prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        audio.currentTime = 0;
        return prev;
      }
      const prevT = queue[prevIndex];
      if (prevT) {
        retryCountRef.current = 0;
        audio.src = getStreamUrl(prevT.url);
        audio.play().catch(() => {});
        return { ...prev, currentTrack: prevT, queueIndex: prevIndex, isPlaying: true, currentTime: 0 };
      }
      return prev;
    });
  }, [audio, saveListenedTime]);

  const toggleShuffle = useCallback(() => {
    setState(s => ({ ...s, isShuffle: !s.isShuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(s => ({
      ...s,
      repeatMode: s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
    }));
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setState(s => ({ ...s, queue: [...s.queue, track] }));
  }, []);

  const clearQueue = useCallback(() => {
    setState(s => ({ ...s, queue: [], queueIndex: -1 }));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playTrack,
        togglePlay,
        seekTo,
        setVolume,
        nextTrack,
        prevTrack,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        clearQueue,
        audioRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}