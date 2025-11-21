import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Artist from "../Models/Artist";
import "react-toastify/dist/ReactToastify.css";

interface ArtistModalProps {
  artistId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (id: number) => void;
  onError?: (msg: string) => void;
}

export default function ArtistModal({
  artistId,
  isOpen,
  onClose,
  onSaved,
  onError,
}: ArtistModalProps) {
  const [artist, setArtist] = useState<Artist>({ id: "0", name: "", mbid: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return setArtist({ id: "0", name: "", mbid: "" });
    if (!artistId) return;

    const fetchArtist = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken") || "";
        let res = await fetch(`/api/artist/${artistId}`, {
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

          res = await fetch(`/api/artist/${artistId}`, {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          });
        }

        if (!res.ok) throw new Error("Failed to fetch artist");

        const data: Artist = await res.json();
        setArtist(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(msg);
        onError?.(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchArtist();
  }, [isOpen, artistId, onError]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setArtist({ ...artist, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const saveArtist = async () => {
      let token = localStorage.getItem("accessToken") || "";
      const url = artistId ? `/api/artist/${artistId}` : "/api/artist";
      const method = artistId ? "PATCH" : "POST";

      const sendRequest = async () =>
        fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(artist),
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

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to save artist");
      }

      return res.json();
    };

    try {
      const savedArtist = await toast.promise(saveArtist(), {
        pending: artistId ? "Updating artist..." : "Creating artist...",
        success: artistId ? "Artist updated!" : "Artist created!",
        error: "Failed to save artist",
      });

      onSaved?.(savedArtist.id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(msg);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      tabIndex={-1}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex justify-center items-center w-full h-full overflow-y-auto
                 bg-[rgba(0,0,0,0.3)] backdrop-blur-sm transition-opacity duration-300
                 ${isOpen ? "opacity-100" : "opacity-0"}`}
    >
      <div className="relative p-4 w-full max-w-md max-h-full">
        <div
          className={`relative bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6
                      transform transition-all duration-300
                      ${
                        isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
                      }`}
        >
          {loading ? (
            <p className="text-white">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-white">
              <div>
                <label className="block font-bold">Name</label>
                <input
                  name="name"
                  value={artist.name}
                  onChange={handleChange}
                  className="w-full border border-gray-600 bg-gray-900 p-1 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block font-bold">MBID</label>
                <input
                  name="mbid"
                  value={artist.mbid || ""}
                  onChange={handleChange}
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
                  {artistId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
