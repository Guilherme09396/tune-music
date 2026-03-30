// supabase/functions/lyrics-proxy/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

function normalize(str: string) {
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove acento
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-");
}

async function fetchVagalume(artist: string, title: string) {
    try {
        const artistSlug = normalize(artist);
        const titleSlug = normalize(title);

        const url = `https://www.vagalume.com.br/${artistSlug}/${titleSlug}.html`;

        console.log("🔎 Vagalume URL:", url);

        const res = await fetch(url);

        if (!res.ok) return null;

        const html = await res.text();

        // 🔥 extrai letra da página
        const match = html.match(/<div id="lyrics">([\s\S]*?)<\/div>/);

        if (!match) return null;

        let lyrics = match[1]
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<\/?[^>]+(>|$)/g, "")
            .trim();

        if (!lyrics) return null;

        return lyrics;
    } catch (err) {
        console.error("Erro vagalume:", err);
        return null;
    }
}

async function fetchLyricsOvh(artist: string, title: string) {
    try {
        const res = await fetch(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(
                artist,
            )}/${encodeURIComponent(title)}`,
        );

        if (!res.ok) return null;

        const data = await res.json();

        return data?.lyrics || null;
    } catch {
        return null;
    }
}

serve(async (req) => {
    try {
        const { searchParams } = new URL(req.url);

        const artist = searchParams.get("artist") || "";
        const title = searchParams.get("title") || "";

        console.log("🎵 Request:", { artist, title });

        // 🔥 1. tenta Vagalume (BR)
        let lyrics = await fetchVagalume(artist, title);

        // 🔥 2. fallback gringo
        if (!lyrics) {
            lyrics = await fetchLyricsOvh(artist, title);
        }

        if (!lyrics) {
            return new Response(JSON.stringify({ error: "Lyrics not found" }), {
                status: 404,
            });
        }

        return new Response(JSON.stringify({ lyrics }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Internal error" }), {
            status: 500,
        });
    }
});
