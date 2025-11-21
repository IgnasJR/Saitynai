import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ToastContainer, toast } from "react-toastify";
import AlbumModal from "../Components/AlbumModal";
import type Artist from "../Models/Artist";

export default function ArtistPage() {
  const { artistId } = useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const fetchArtist = async () => {
    if (!artistId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/artist/${artistId}`);
      if (!res.ok) window.location.href = "/404";
      const data = await res.json();
      setArtist(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtist();
  }, [artistId]);

  const handleDeleteArtist = async () => {
    if (!artist || !artist.id) return;
    if (!confirm(`Delete artist "${artist.name}"? This cannot be undone.`))
      return;

    try {
      let token = localStorage.getItem("accessToken") || "";
      let res = await fetch(`/api/artist?id=${artist.id}`, {
        method: "DELETE",
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

        res = await fetch(`/api/artist?id=${artist.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      if (!res.ok) throw new Error("Failed to delete artist");

      toast.success(`Artist "${artist.name}" deleted!`);
      setArtist(null);
      window.location.href = "/";
    } catch (err: unknown) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete artist"
      );
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  if (!artist) return <div className="text-center mt-10">Artist not found</div>;

  return (
    <div className="">
      <ToastContainer position="bottom-right" theme="dark" />

      <AlbumModal
        isOpen={!!editingAlbumId || creatingAlbum}
        albumId={editingAlbumId || undefined}
        artistId={artist.id}
        artistName={artist.name}
        onClose={() => {
          setEditingAlbumId(null);
          setCreatingAlbum(false);
        }}
        onSaved={fetchArtist}
      />

      <div className="flex flex-col md:flex-row w-3/4 mx-auto gap-6 mt-4 pt-12 md:pt-0">
        <div className="shrink-0 md:w-1/3 flex flex-col items-center">
          <h1 className="text-3xl font-bold mt-4 text-center">{artist.name}</h1>
          {artist.mbid && (
            <p className="text-sm mt-1 text-center">
              MusicBrainz ID: {artist.mbid}
            </p>
          )}

          {localStorage.getItem("role") === "admin" && (
            <button
              onClick={handleDeleteArtist}
              className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
            >
              Delete Artist
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto max-h-[80vh] p-4 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-white text-3xl!">Albums</h1>
            {localStorage.getItem("role") === "admin" && (
              <button
                onClick={() => setCreatingAlbum(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <span className="font-bold">+</span> Create Album
              </button>
            )}
          </div>

          {artist.albums?.length === 0 && <p className="">No albums found.</p>}

          <table className="w-full table-auto border-collapse text-white">
            <tbody>
              {artist.albums?.map((album) => (
                <tr
                  key={album.id}
                  className="group relative cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <td colSpan={3} className="p-2 font-bold text-left">
                    <div className="flex justify-between items-center">
                      <span
                        onClick={() =>
                          (window.location.href = `/album/${album.id}`)
                        }
                      >
                        {album.title}
                        {album.release_date && (
                          <span className="text-gray-400 ml-2 text-sm">
                            ({new Date(album.release_date).getFullYear()})
                          </span>
                        )}
                      </span>
                      {localStorage.getItem("role") === "admin" && (
                        <div className="hidden group-hover:flex gap-2">
                          <button
                            className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-700 text-xs"
                            onClick={() => setEditingAlbumId(album.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-600 rounded hover:bg-red-700 text-xs"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!confirm(`Delete album "${album.title}"?`))
                                return;

                              try {
                                let token =
                                  localStorage.getItem("accessToken") || "";
                                let res = await fetch(
                                  `/api/album?id=${album.id}`,
                                  {
                                    method: "DELETE",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  }
                                );

                                if (res.status === 401) {
                                  const refreshRes = await fetch(
                                    "/api/refresh",
                                    {
                                      method: "POST",
                                      credentials: "include",
                                    }
                                  );
                                  if (!refreshRes.ok)
                                    throw new Error("Token refresh failed");

                                  const data = await refreshRes.json();
                                  token = data.accessToken;
                                  localStorage.setItem("accessToken", token);

                                  res = await fetch(
                                    `/api/album?id=${album.id}`,
                                    {
                                      method: "DELETE",
                                      headers: {
                                        Authorization: `Bearer ${token}`,
                                      },
                                    }
                                  );
                                }

                                if (!res.ok)
                                  throw new Error("Failed to delete album");

                                toast.success("Album deleted!");
                                fetchArtist();
                              } catch (err) {
                                console.error(err);
                                toast.error(
                                  err instanceof Error
                                    ? err.message
                                    : "Failed to delete album"
                                );
                              }
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
