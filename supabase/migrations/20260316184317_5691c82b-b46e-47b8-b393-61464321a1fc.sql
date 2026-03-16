
-- Playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Playlist tracks table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration NUMERIC NOT NULL DEFAULT 0,
  thumbnail TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Listening history table
CREATE TABLE public.listening_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  duration NUMERIC NOT NULL DEFAULT 0,
  thumbnail TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for playlists
CREATE POLICY "Users can manage own playlists" ON public.playlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS policies for playlist_tracks (join through playlists)
CREATE POLICY "Users can manage own playlist tracks" ON public.playlist_tracks FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.user_id = auth.uid()));

-- RLS policies for listening_history
CREATE POLICY "Users can manage own history" ON public.listening_history FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
