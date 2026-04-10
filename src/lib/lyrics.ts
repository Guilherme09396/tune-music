export interface SyncedLine {
    time: number; // segundos
    text: string;
}

export interface LyricsResult {
    lyrics: string;
    syncedLines?: SyncedLine[];
}

// Parseia "[mm:ss.xx] texto" → { time, text }[]
export function parseSyncedLyrics(raw: string): SyncedLine[] {
    return raw
        .split("\n")
        .map((line) => {
            const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (!match) return null;
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const ms = parseInt(match[3].padEnd(3, "0"));
            const time = minutes * 60 + seconds + ms / 1000;
            return { time, text: match[4].trim() };
        })
        .filter(Boolean) as SyncedLine[];
}

// ====== Limpeza agressiva de título do YouTube ======
function cleanTitle(rawTitle: string): string {
    let t = rawTitle;
    // Remove parênteses/colchetes com tags comuns
    t = t.replace(/\s*[\(\[][^)\]]*(?:official|video|audio|lyrics|lyric|clipe|clip|visualizer|hd|hq|4k|live|ao vivo|remix|edit|version|ver\.|prod\.|ft\.|feat\.)[^)\]]*[\)\]]/gi, "");
    // Remove "| Texto Extra"
    t = t.replace(/\s*\|.*$/i, "");
    // Remove hashtags e #N
    t = t.replace(/\s*#\d+/g, "");
    t = t.replace(/\s*#\w+/g, "");
    // Remove "- Topic" suffix do YouTube
    t = t.replace(/\s*-\s*Topic$/i, "");
    // Remove sufixos comuns
    t = t.replace(/\s*(MV|M\/V|Official|Audio|Clipe Oficial|Video Oficial|Videoclipe)$/gi, "");
    return t.trim();
}

function cleanArtist(rawArtist: string): string {
    let a = rawArtist;
    a = a.replace(/\s*-\s*Topic$/i, "");
    a = a.replace(/\s*VEVO$/i, "");
    a = a.replace(/\s*(Official|Channel|Music)$/gi, "");
    return a.trim();
}

// Gera candidatos de título e artista para tentar
function buildCandidates(rawTitle: string, rawArtist: string): { title: string; artist: string }[] {
    const cleaned = cleanTitle(rawTitle);
    const artist = cleanArtist(rawArtist);
    const candidates: { title: string; artist: string }[] = [];

    // Se o título tem " - ", tenta separar "Artista - Título"
    const dashParts = cleaned.split(/\s*-\s*/);
    if (dashParts.length >= 2) {
        // "Artista - Título Real" — usa a última parte como título
        const possibleTitle = dashParts[dashParts.length - 1].trim();
        const possibleArtist = dashParts[0].trim();
        candidates.push({ title: possibleTitle, artist: possibleArtist });
        // Também tenta com o artista do canal
        candidates.push({ title: possibleTitle, artist });
    }

    // Título limpo + artista do canal
    candidates.push({ title: cleaned, artist });

    // Remove lista de artistas (vírgulas) do título
    const noCommaArtists = cleaned.replace(/,\s*[^,]+/g, "").trim();
    if (noCommaArtists !== cleaned) {
        candidates.push({ title: noCommaArtists, artist });
    }

    // Desdup
    const seen = new Set<string>();
    return candidates.filter((c) => {
        const key = `${c.title.toLowerCase()}|${c.artist.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return c.title.length > 0 && c.artist.length > 0;
    });
}

async function fetchFromLrclib(
    title: string,
    artist: string,
): Promise<LyricsResult | null> {
    try {
        const params = new URLSearchParams({
            track_name: title,
            artist_name: artist,
        });
        const res = await fetch(`https://lrclib.net/api/search?${params}`);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data || data.length === 0) return null;

        const match = data.find(
            (item: any) => item.plainLyrics || item.syncedLyrics,
        );
        if (!match) return null;

        if (match.syncedLyrics) {
            const syncedLines = parseSyncedLyrics(match.syncedLyrics);
            const lyrics =
                match.plainLyrics || syncedLines.map((l) => l.text).join("\n");
            return { lyrics, syncedLines };
        }

        return { lyrics: match.plainLyrics };
    } catch {
        return null;
    }
}

async function fetchFromProxy(
    title: string,
    artist: string,
): Promise<LyricsResult | null> {
    try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        if (!projectId) return null;
        const url = `https://${projectId}.supabase.co/functions/v1/lyrics-proxy?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.lyrics) return null;
        return { lyrics: data.lyrics };
    } catch {
        return null;
    }
}

export async function fetchLyrics(
    title: string,
    artist: string,
): Promise<LyricsResult | null> {
    try {
        console.log("🎵 Buscando letra:", artist, "-", title);

        const candidates = buildCandidates(title, artist);

        // Tentar lrclib com cada candidato (tem sincronia)
        for (const c of candidates) {
            console.log(`🔍 lrclib: "${c.title}" by "${c.artist}"`);
            const result = await fetchFromLrclib(c.title, c.artist);
            if (result) return result;
        }

        // Fallback: proxy (Vagalume + lyrics.ovh)
        for (const c of candidates) {
            console.log(`🔍 proxy: "${c.title}" by "${c.artist}"`);
            const result = await fetchFromProxy(c.title, c.artist);
            if (result) return result;
        }

        return null;
    } catch (err) {
        console.error("Erro ao buscar letra:", err);
        return null;
    }
}
