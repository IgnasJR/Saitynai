import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Song from "../Models/Song";
import "react-toastify/dist/ReactToastify.css";

interface SongModalProps {
  songId?: string; // optional, if provided -> edit
  albumId?: string; // current album id for creation
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void; // callback after save
}

export default function SongModal({
  songId,
  albumId,
  isOpen,
  onClose,
  onSaved,
}: SongModalProps) {
  const [song, setSong] = useState<Song>({
    id: "",
    mbid: "",
    title: "",
    track_number: 1,
    length: 0,
    album: albumId || "",
    album_id: albumId || "",
    artist: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSong({
        id: "",
        mbid: "",
        title: "",
        track_number: 1,
        length: 0,
        album: "",
        album_id: albumId || "",
        artist: "",
      });
      setError(null);
      setLoading(false);
      return;
    }

    if (!songId) return;

    setLoading(true);
    setError(null);

    const fetchSong = async () => {
      let token = localStorage.getItem("accessToken") || "";
      let res = await fetch(`/api/song/${songId}`, {
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

        res = await fetch(`/api/song/${songId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!res.ok) throw new Error("Failed to fetch song");

      const data = await res.json();
      setSong(
        new Song(
          data.id,
          data.mbid,
          data.title,
          data.track_number,
          data.length,
          data.album,
          data.album_id,
          data.artist
        )
      );
    };

    toast
      .promise(fetchSong(), {
        pending: "Loading song...",
        success: "Song loaded!",
        error: "Failed to load song",
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch song");
      })
      .finally(() => setLoading(false));
  }, [isOpen, songId, albumId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "length") return;
    const newValue = name === "track_number" ? Number(value) : value;
    setSong({ ...song, [name]: newValue } as Song);
  };

  const handleChangeLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seconds = Number(e.target.value);
    if (!isNaN(seconds)) setSong({ ...song, length: seconds * 1000 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const saveSong = async () => {
      let token = localStorage.getItem("accessToken") || "";
      const url = songId ? `/api/song?id=${songId}` : "/api/song";
      const method = songId ? "PATCH" : "POST";

      const sendRequest = async () =>
        fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(song),
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
          songId ? "Failed to update song" : "Failed to create song"
        );

      return res;
    };

    const toastPromise = toast.promise(saveSong(), {
      pending: songId ? "Updating song..." : "Creating song...",
      success: songId ? "Song updated!" : "Song created!",
      error: songId ? "Failed to update song" : "Failed to create song",
    });

    try {
      await toastPromise;
      onSaved?.();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save song");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      tabIndex={-1}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex justify-center items-center w-full h-full overflow-y-auto
                 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm transition-opacity duration-300
                 ${isOpen ? "opacity-100" : "opacity-0"}`}
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div
          className={`relative bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6
                      transform transition-all duration-300
                      ${
                        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                      }`}
        >
          {loading ? (
            <p className="text-white">Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-white">
              <div>
                <label className="block font-bold">Title</label>
                <input
                  name="title"
                  value={song.title}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold">Track Number</label>
                <input
                  name="track_number"
                  type="number"
                  value={song.track_number}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
                />
              </div>
              <div>
                <label className="block font-bold">Length (seconds)</label>
                <input
                  name="length"
                  type="number"
                  value={song.length / 1000}
                  onChange={handleChangeLength}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {songId ? "Save" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
