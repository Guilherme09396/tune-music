const API_BASE = "https://ample-gratitude-production-9d67.up.railway.app";

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  url: string;
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Erro ao buscar músicas");
  return res.json();
}

export async function getTrackInfo(url: string): Promise<Track> {
  const res = await fetch(`${API_BASE}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("Erro ao buscar info");
  return res.json();
}

export function getStreamUrl(videoUrl: string): string {
  return `${API_BASE}/stream?url=${encodeURIComponent(videoUrl)}`;
}

export function getDownloadUrl(videoUrl: string, title: string): string {
  return `${API_BASE}/download?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(title)}`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
