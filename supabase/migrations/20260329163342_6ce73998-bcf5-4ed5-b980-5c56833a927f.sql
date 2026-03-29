
-- Allow anonymous users to view shared playlists
CREATE POLICY "Anon can view shared playlists"
ON public.playlists
FOR SELECT
TO anon
USING (visibility IN ('public', 'link'));

-- Allow anonymous users to view shared playlist tracks
CREATE POLICY "Anon can view shared playlist tracks"
ON public.playlist_tracks
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1 FROM playlists
  WHERE playlists.id = playlist_tracks.playlist_id
  AND playlists.visibility IN ('public', 'link')
));
