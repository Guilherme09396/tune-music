import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const artist = url.searchParams.get("artist")?.trim();
  const title = url.searchParams.get("title")?.trim();

  if (!artist || !title) {
    return new Response(JSON.stringify({ lyrics: null, error: "Missing artist or title" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const candidates = [
      { artist, title },
      { artist: artist.split(",")[0].trim(), title },
      { artist: artist.split("&")[0].trim(), title },
    ].filter((candidate, index, arr) => {
      if (!candidate.artist || !candidate.title) return false;
      return arr.findIndex(
        (item) => item.artist.toLowerCase() === candidate.artist.toLowerCase() && item.title.toLowerCase() === candidate.title.toLowerCase(),
      ) === index;
    });

    for (const candidate of candidates) {
      const response = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(candidate.artist)}/${encodeURIComponent(candidate.title)}`,
      );

      if (response.ok) {
        const data = await response.json();
        return new Response(JSON.stringify({ lyrics: data.lyrics ?? null, error: null }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await response.text();
    }

    return new Response(JSON.stringify({ lyrics: null, error: "Lyrics not found" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ lyrics: null, error: "Failed to fetch lyrics" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
