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

        // se tiver letra sincronizada, usa ela
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

async function fetchFromLyricsOvh(
    title: string,
    artist: string,
): Promise<LyricsResult | null> {
    try {
        const res = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.lyrics) return null;
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

        let result = await fetchFromLrclib(title, artist);

        if (!result) {
            console.log("⏩ Fallback: lyrics.ovh");
            result = await fetchFromLyricsOvh(title, artist);
        }

        return result;
    } catch (err) {
        console.error("Erro ao buscar letra:", err);
        return null;
    }
}
