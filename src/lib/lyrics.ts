const LYRICS_API = "https://lyrics.lewdhutao.my.eu.org";

export interface LyricsResult {
  lyrics: string;
  source: string;
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Clean up title: remove common suffixes like (Official Video), [Lyrics], etc.
    const cleanTitle = title
      .replace(/\s*[\(\[][^)\]]*(?:official|video|audio|lyrics|lyric|clip|hd|4k|visualizer|live|remix|ft\.|feat\.)[^)\]]*[\)\]]/gi, "")
      .replace(/\s*\|.*$/, "")
      .trim();

    const query = `${cleanTitle} ${artist}`.trim();
    const res = await fetch(`${LYRICS_API}/api/search?q=${encodeURIComponent(query)}`);
    
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
