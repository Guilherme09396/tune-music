export interface LyricsResult {
  lyrics: string;
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Clean title: remove suffixes like (Official Video), [Lyrics], etc.
    const cleanTitle = title
      .replace(/\s*[\(\[][^)\]]*(?:official|video|audio|lyrics|lyric|clip|hd|4k|visualizer|live|remix|ft\.|feat\.|ao vivo)[^)\]]*[\)\]]/gi, "")
      .replace(/\s*\|.*$/, "")
      .replace(/\s*-\s*$/, "")
      .trim();

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/lyrics-proxy?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(cleanTitle)}`
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data?.lyrics) {
      return { lyrics: data.lyrics };
    }
    return null;
  } catch {
    return null;
  }
}
