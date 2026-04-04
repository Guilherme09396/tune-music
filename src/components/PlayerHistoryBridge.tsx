import { useListeningHistory } from "@/hooks/useListeningHistory";
import { PlayerProvider } from "@/contexts/PlayerContext";

export function PlayerHistoryBridge({ children }: { children: React.ReactNode }) {
  const { addToHistory } = useListeningHistory();

  return (
    <PlayerProvider onTrackListened={addToHistory}>
      {children}
    </PlayerProvider>
  );
}