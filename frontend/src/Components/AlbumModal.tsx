import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Album from "../Models/Album";

interface AlbumModalProps {
  albumId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  artistId?: string;
  artistName?: string;
}

export default function AlbumModal({
  albumId,
  isOpen,
  onClose,
  onSaved,
  artistId,
  artistName,
}: AlbumModalProps) {
  const [album, setAlbum] = useState<Album>({
    id: "",
    title: "",
    artist: artistName || "",
    cover_url: "",
    songs: [],
    mbid: "",
    artist_id: artistId || "",
    release_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAlbum({
        id: "",
        title: "",
        artist: artistName || "",
        cover_url: "",
        songs: [],
        mbid: "",
        artist_id: artistId || "",
        release_date: "",
      });
      setError(null);
      setLoading(false);
      return;
    }

    if (!albumId) return;

    setLoading(true);
    setError(null);

    const fetchAlbum = async () => {
      let token = localStorage.getItem("accessToken") || "";
      let res = await fetch(`/api/album/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        const refreshRes = await fetch("/api/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) throw new Error("Token refresh failed");
        const data = await refreshRes.json();
        token = data.accessToken;
        localStorage.setItem("accessToken", token);

        res = await fetch(`/api/album/${albumId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!res.ok) throw new Error("Failed to fetch album");

      const data = await res.json();
      setAlbum(
        new Album(
          data.id,
          data.title,
          data.artist,
          data.cover_url,
          data.songs,
          data.mbid,
          data.artist_id,
          data.release_date || ""
        )
      );
    };

    toast
      .promise(fetchAlbum(), {
        pending: "Loading album...",
        success: "Album loaded!",
        error: "Failed to load album",
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen, albumId, artistId, artistName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAlbum({ ...album, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const saveAlbum = async () => {
      let token = localStorage.getItem("accessToken") || "";
      const url = albumId ? `/api/album?id=${albumId}` : "/api/album";
      const method = albumId ? "PATCH" : "POST";

      const payload: Partial<Album> = albumId
        ? album
        : {
            title: album.title,
            release_date: album.release_date,
            mbid: album.mbid || undefined,
            artist_id: album.artist_id,
          };

      const sendRequest = async () =>
        fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

      let res = await sendRequest();

      if (res.status === 401) {
        const refreshRes = await fetch("/api/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) throw new Error("Token refresh failed");
        const data = await refreshRes.json();
        token = data.accessToken;
        localStorage.setItem("accessToken", token);
        res = await sendRequest();
      }

      if (!res.ok)
        throw new Error(
          albumId ? "Failed to update album" : "Failed to create album"
        );

      return res;
    };

    const toastPromise = toast.promise(saveAlbum(), {
      pending: albumId ? "Updating album..." : "Creating album...",
      success: albumId ? "Album updated!" : "Album created!",
      error: albumId ? "Failed to update album" : "Failed to create album",
    });

    try {
      await toastPromise;
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save album");
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      className={`fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-[rgba(0,0,0,0.3)]
                  backdrop-blur-sm transition-opacity duration-300
                  ${isOpen ? "opacity-100" : "opacity-0"}`}
    >
      <div className="relative p-4 w-full max-w-md">
        <div
          className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 text-white
                      transform transition-all duration-300
                      ${
                        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                      }`}
        >
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold">Album Title</label>
                <input
                  name="title"
                  value={album.title}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-bold">Release Date</label>
                <input
                  name="release_date"
                  type="date"
                  value={album.release_date?.split("T")[0] || ""}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded"
                  required
                />
              </div>

              <div>
                <label className="block font-bold">MBID</label>
                <input
                  name="mbid"
                  value={album.mbid}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded"
                />
              </div>
              <div>
                <label className="block font-bold">Cover art</label>
                <input
                  name="cover_url"
                  value={album.cover_url}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded"
                />
              </div>

              <div>
                <label className="block font-bold">Artist ID</label>
                <input
                  name="artist_id"
                  value={album.artist_id}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
                >
                  {albumId ? "Save" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
