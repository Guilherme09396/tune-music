import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function normalize(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LyricsBot/1.0)" },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(/<div id="lyrics">([\s\S]*?)<\/div>/);
    if (!match) return null;

    const lyrics = match[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+(>|$)/g, "")
      .trim();

    return lyrics || null;
  } catch (err) {
    console.error("Erro vagalume:", err);
    return null;
  }
}

async function fetchLyricsOvh(artist: string, title: string) {
  try {
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.lyrics || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    const artist = searchParams.get("artist") || "";
    const title = searchParams.get("title") || "";

    console.log("🎵 Request:", { artist, title });

    // 1. Vagalume (BR)
    let lyrics = await fetchVagalume(artist, title);

    // 2. lyrics.ovh
    if (!lyrics) {
      lyrics = await fetchLyricsOvh(artist, title);
    }

    return new Response(JSON.stringify({ lyrics: lyrics || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Internal error:", err);
    return new Response(JSON.stringify({ lyrics: null, error: "Internal error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
