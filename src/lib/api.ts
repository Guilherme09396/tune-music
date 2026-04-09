// Lista de servidores — adicione VITE_API_URL_2, VITE_API_URL_3 no .env conforme precisar
const ALL_SERVERS = [
    import.meta.env.VITE_API_URL,
    import.meta.env.VITE_API_URL_2,
    import.meta.env.VITE_API_URL_3,
].filter(Boolean) as string[];

if (ALL_SERVERS.length === 0) {
    throw new Error("Nenhum servidor configurado. Defina VITE_API_URL no .env");
}

// servidor ativo atual (índice)
let activeIndex = 0;

function getActiveBase(): string {
    return ALL_SERVERS[activeIndex];
}

export function markServerFailed(): void {
    const prev = activeIndex;
    activeIndex = (activeIndex + 1) % ALL_SERVERS.length;
    console.warn(
        `⚠️ Servidor ${prev} falhou, alternando para servidor ${activeIndex}: ${ALL_SERVERS[activeIndex]}`,
    );
}

/** Retorna o número total de servidores disponíveis */
export function getServerCount(): number {
    return ALL_SERVERS.length;
}

// Fetch com timeout
async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 5000,
): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// Tenta cada servidor em sequência para chamadas fetch
async function tryEachServer<T>(fn: (base: string) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < ALL_SERVERS.length; i++) {
        const serverIndex = (activeIndex + i) % ALL_SERVERS.length;
        try {
            const result = await fn(ALL_SERVERS[serverIndex]);
            if (serverIndex !== activeIndex) {
                activeIndex = serverIndex;
                console.info(`✅ Alternado para servidor ${activeIndex}`);
            }
            return result;
        } catch (err) {
            console.warn(
                `⚠️ Servidor ${serverIndex} falhou, tentando próximo...`,
            );
            lastError = err;
        }
    }
    throw lastError;
}

// =======================
// TIPOS
// =======================
export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    thumbnail: string;
    url: string;
}

// =======================
// API FUNCTIONS
// =======================
export async function searchTracks(query: string): Promise<Track[]> {
    return tryEachServer(async (base) => {
        const res = await fetchWithTimeout(`${base}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query }),
        });
        if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
        return res.json();
    });
}

export async function getTrackInfo(url: string): Promise<Track> {
    return tryEachServer(async (base) => {
        const res = await fetchWithTimeout(`${base}/info`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
        if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
        return res.json();
    });
}

// Síncrono — usa o servidor ativo no momento da chamada
export function getStreamUrl(videoUrl: string): string {
    const base = getActiveBase();
    const safeUrl = encodeURIComponent(videoUrl.trim());
    return `${base}/stream?url=${safeUrl}`;
}

export function getDownloadUrl(videoUrl: string, title: string): string {
    return `${getActiveBase()}/download?url=${encodeURIComponent(videoUrl)}&title=${encodeURIComponent(title)}`;
}

export function formatDuration(seconds: number): string {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function fetchAudioBlob(videoUrl: string): Promise<Blob> {
    return tryEachServer(async (base) => {
        const res = await fetch(
            `${base}/stream?url=${encodeURIComponent(videoUrl)}`,
        );
        if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
        return res.blob();
    });
}

/**
 * Busca a URL direta do áudio via /offline-url e faz o download
 * direto da fonte (sem passar pelo proxy do servidor).
 * Muito mais rápido para salvar offline.
 */
export async function fetchDirectAudioBlob(videoUrl: string): Promise<Blob> {
    const { audioUrl } = await tryEachServer(async (base) => {
        const res = await fetchWithTimeout(
            `${base}/offline-url?url=${encodeURIComponent(videoUrl)}`,
            {},
            15000, // yt-dlp pode demorar um pouco
        );
        if (!res.ok) throw new Error(`Servidor retornou ${res.status}`);
        return res.json();
    });

    // Baixa direto da fonte (YouTube CDN), sem passar pelo seu servidor
    const res = await fetch(audioUrl);
    if (!res.ok) throw new Error(`Erro ao baixar áudio: ${res.status}`);
    return res.blob();
}
