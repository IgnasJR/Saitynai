import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Song from "../Models/Song";
import "react-toastify/dist/ReactToastify.css";

interface EditSongModalProps {
  songId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SongEditModal({
  songId,
  isOpen,
  onClose,
}: EditSongModalProps) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSong(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!songId) return;

    setLoading(true);
    setError(null);

    const fetchSongPromise = async () => {
      const token = localStorage.getItem("accessToken") || "";
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
        localStorage.setItem("accessToken", data.accessToken);

        res = await fetch(`/api/song/${songId}`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
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
          data.artist
        )
      );
    };

    toast
      .promise(fetchSongPromise(), {
        pending: "Loading song...",
        success: "Song loaded!",
        error: "Failed to load song",
      })
      .catch((err) => {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to fetch song");
      })
      .finally(() => setLoading(false));
  }, [isOpen, songId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!song) return;
    const { name, value } = e.target;
    if (name === "length") return;
    const newValue = name === "track_number" ? Number(value) : value;
    setSong({ ...song, [name]: newValue } as Song);
  };

  const handleChangeLength = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!song) return;
    const seconds = Number(e.target.value);
    if (!isNaN(seconds)) {
      setSong({ ...song, length: seconds * 1000 });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song || !songId) return;

    const patchSong = async () => {
      let token = localStorage.getItem("accessToken") || "";

      const sendPatch = async () => {
        return fetch(`/api/song?id=${songId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(song),
        });
      };

      let res = await sendPatch();

      if (res.status === 401) {
        const refreshRes = await fetch("/api/refresh", {
          method: "POST",
          credentials: "include",
        });
        if (!refreshRes.ok) throw new Error("Token refresh failed");

        const data = await refreshRes.json();
        token = data.accessToken;
        localStorage.setItem("accessToken", token);

        res = await sendPatch();
      }

      if (!res.ok) throw new Error("Failed to update song");
      return res;
    };

    const patchPromise = patchSong();

    toast.promise(patchPromise, {
      pending: "Saving song...",
      success: "Song updated!",
      error: "Failed to update song",
    });

    try {
      await patchPromise;
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to update song");
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
            ) : song ? (
              <form onSubmit={handleSubmit} className="space-y-4 text-white">
                <div>
                  <label className="block font-bold">Title</label>
                  <input
                    name="title"
                    value={song.title}
                    onChange={handleChange}
                    className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold">Album</label>
                  <input
                    name="album"
                    value={song.album}
                    onChange={handleChange}
                    className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold">Artist</label>
                  <input
                    name="artist"
                    value={song.artist}
                    onChange={handleChange}
                    className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
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
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-white">Song not found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
