import { useState, useEffect, useCallback } from "react";
import { openDB, DBSchema } from "idb";
import { Track, getStreamUrl, fetchAudioBlob } from "@/lib/api";
import { toast } from "sonner";

interface OfflineDB extends DBSchema {
    tracks: {
        key: string;
        value: {
            id: string;
            title: string;
            artist: string;
            duration: number;
            thumbnail: string;
            url: string;
            audioBlob: Blob;
            thumbnailBlob?: Blob;
            savedAt: number;
        };
    };
}

const DB_NAME = "soundflow-offline";
const DB_VERSION = 1;

async function getDB() {
    return openDB<OfflineDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains("tracks")) {
                db.createObjectStore("tracks", { keyPath: "id" });
            }
        },
    });
}

export function useOfflineStorage() {
    const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(
        new Set(),
    );
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

    // Load saved track IDs on mount
    useEffect(() => {
        (async () => {
            try {
                const db = await getDB();
                const keys = await db.getAllKeys("tracks");
                setOfflineTrackIds(new Set(keys));
            } catch (e) {
                console.error("Error loading offline tracks:", e);
            }
        })();
    }, []);

    const saveTrackOffline = useCallback(
        async (track: Track) => {
            if (offlineTrackIds.has(track.id)) {
                toast.info("Música já salva offline");
                return;
            }

            setSavingIds((prev) => new Set(prev).add(track.id));

            try {
                const toastId = toast.loading(
                    `Salvando "${track.title}" offline...`,
                );

                // Fetch audio
                const audioBlob = await fetchAudioBlob(track.url);

                // Fetch thumbnail
                let thumbnailBlob: Blob | undefined;
                try {
                    const thumbRes = await fetch(track.thumbnail);
                    if (thumbRes.ok) thumbnailBlob = await thumbRes.blob();
                } catch {
                    /* ignore thumbnail errors */
                }

                const db = await getDB();
                await db.put("tracks", {
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    thumbnail: track.thumbnail,
                    url: track.url,
                    audioBlob,
                    thumbnailBlob,
                    savedAt: Date.now(),
                });

                setOfflineTrackIds((prev) => new Set(prev).add(track.id));
                toast.success(`"${track.title}" salva offline!`, {
                    id: toastId,
                });
            } catch (err) {
                console.error("Error saving offline:", err);
                toast.error("Erro ao salvar música offline");
            } finally {
                setSavingIds((prev) => {
                    const next = new Set(prev);
                    next.delete(track.id);
                    return next;
                });
            }
        },
        [offlineTrackIds],
    );

    const removeTrackOffline = useCallback(async (trackId: string) => {
        try {
            const db = await getDB();
            await db.delete("tracks", trackId);
            setOfflineTrackIds((prev) => {
                const next = new Set(prev);
                next.delete(trackId);
                return next;
            });
            toast.success("Música removida do offline");
        } catch (err) {
            console.error("Error removing offline track:", err);
        }
    }, []);

    const getOfflineAudioUrl = useCallback(
        async (trackId: string): Promise<string | null> => {
            try {
                const db = await getDB();
                const track = await db.get("tracks", trackId);
                if (track?.audioBlob) {
                    return URL.createObjectURL(track.audioBlob);
                }
            } catch (e) {
                console.error("Error getting offline audio:", e);
            }
            return null;
        },
        [],
    );

    const getOfflineTracks = useCallback(async (): Promise<Track[]> => {
        try {
            const db = await getDB();
            const all = await db.getAll("tracks");
            return all.map((t) => ({
                id: t.id,
                title: t.title,
                artist: t.artist,
                duration: t.duration,
                thumbnail: t.thumbnail,
                url: t.url,
            }));
        } catch {
            return [];
        }
    }, []);

    const savePlaylistOffline = useCallback(
        async (tracks: Track[]) => {
            const unsaved = tracks.filter((t) => !offlineTrackIds.has(t.id));
            if (unsaved.length === 0) {
                toast.info("Todas as músicas já estão salvas offline");
                return;
            }

            toast.info(`Salvando ${unsaved.length} músicas offline...`);

            for (const track of unsaved) {
                await saveTrackOffline(track);
            }
        },
        [offlineTrackIds, saveTrackOffline],
    );

    const isTrackOffline = useCallback(
        (trackId: string) => offlineTrackIds.has(trackId),
        [offlineTrackIds],
    );
    const isTrackSaving = useCallback(
        (trackId: string) => savingIds.has(trackId),
        [savingIds],
    );

    return {
        offlineTrackIds,
        saveTrackOffline,
        removeTrackOffline,
        getOfflineAudioUrl,
        getOfflineTracks,
        savePlaylistOffline,
        isTrackOffline,
        isTrackSaving,
    };
}
