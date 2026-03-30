export interface LyricsResult {
  lyrics: string;
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    // Clean title aggressively
    let cleanTitle = title
      .replace(/\s*[\(\[][^)\]]*[\)\]]/gi, "")        // remove (anything) and [anything]
      .replace(/\s*-\s*(?:ao vivo|live|official|clipe|clip|video|audio).*$/gi, "")
      .replace(/\s*\|.*$/, "")
      .replace(/\s*ft\.?\s.*$/i, "")
      .replace(/\s*feat\.?\s.*$/i, "")
      .replace(/\s*,\s+[A-Z].*$/, "")                  // remove long artist lists after comma
      .replace(/\s*#\d+\s*/, " ")                       // remove #6, #11 etc
      .replace(/\s+-\s+$/, "")
      .trim();

    // If title still has " - " with sub-title, try just the sub-title part
    const dashParts = cleanTitle.split(/\s+-\s+/);
    if (dashParts.length > 1) {
      cleanTitle = dashParts.filter(p => p.length > 2).slice(-1)[0] || cleanTitle;
    }

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
