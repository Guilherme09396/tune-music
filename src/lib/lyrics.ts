export interface LyricsResult {
  lyrics: string;
  source: string;
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    const cleanTitle = title
      .replace(/\s*[\(\[][^)\]]*(?:official|video|audio|lyrics|lyric|clip|hd|4k|visualizer|live|remix|ft\.|feat\.)[^)\]]*[\)\]]/gi, "")
      .replace(/\s*\|.*$/, "")
      .trim();

    const query = `${cleanTitle} ${artist}`.trim();
    
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/lyrics-proxy?q=${encodeURIComponent(query)}`
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data?.lyrics) {
      return { lyrics: data.lyrics, source: data.source || "Lyrics API" };
    }
    return null;
  } catch {
    return null;
  }
}
