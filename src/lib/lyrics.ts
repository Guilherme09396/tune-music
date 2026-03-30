export interface LyricsResult {
  lyrics: string;
}

function buildTitleCandidates(title: string): string[] {
  const normalized = title
    .replace(/\s*[\(\[][^)\]]*[\)\]]/gi, "")
    .replace(/\s*\|.*$/, "")
    .replace(/\s*(?:ao vivo|live|official|clipe|clip|video|audio|visualizer|lyrics?)\b.*$/gi, "")
    .trim();

  const pieces = normalized
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = [
    normalized,
    pieces[pieces.length - 1],
    pieces.find((part) => part.length > 2 && part.length < 40),
    normalized.replace(/\s*#\d+\b/gi, "").trim(),
  ].filter((value, index, arr): value is string => !!value && arr.indexOf(value) === index);

  return candidates.length > 0 ? candidates : [title.trim()];
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsResult | null> {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const titleCandidates = buildTitleCandidates(title);

    for (const candidate of titleCandidates) {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/lyrics-proxy?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(candidate)}`,
      );

      if (!response.ok) continue;

      const data = await response.json();
      if (data?.lyrics) {
        return { lyrics: data.lyrics };
      }
    }

    return null;
  } catch {
    return null;
  }
}
