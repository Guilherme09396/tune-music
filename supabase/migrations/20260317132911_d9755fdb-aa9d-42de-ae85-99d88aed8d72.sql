
-- Add sharing columns to playlists
ALTER TABLE public.playlists 
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;

-- Create index for share_id lookups
CREATE INDEX IF NOT EXISTS idx_playlists_share_id ON public.playlists(share_id) WHERE share_id IS NOT NULL;

-- Create index for public playlists
CREATE INDEX IF NOT EXISTS idx_playlists_visibility ON public.playlists(visibility) WHERE visibility = 'public';

-- Drop existing policy and recreate with sharing support
DROP POLICY IF EXISTS "Users can manage own playlists" ON public.playlists;

-- Owner can do everything
CREATE POLICY "Users can manage own playlists" ON public.playlists 
  FOR ALL TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Anyone authenticated can view public or link-shared playlists
CREATE POLICY "Anyone can view shared playlists" ON public.playlists
  FOR SELECT TO authenticated
  USING (visibility IN ('public', 'link'));

-- Update playlist_tracks policy to allow reading tracks of shared playlists
DROP POLICY IF EXISTS "Users can manage own playlist tracks" ON public.playlist_tracks;

CREATE POLICY "Users can manage own playlist tracks" ON public.playlist_tracks 
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.user_id = auth.uid())) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.user_id = auth.uid()));

CREATE POLICY "Anyone can view shared playlist tracks" ON public.playlist_tracks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.visibility IN ('public', 'link')));
