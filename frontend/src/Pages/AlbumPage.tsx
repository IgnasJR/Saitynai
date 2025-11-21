import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type Album from "../Models/Album";
import LoadingSpinner from "../Components/LoadingSpinner";
import Header from "../Components/Header";
import SongModal from "../Components/SongModal";
import { ToastContainer, toast } from "react-toastify";
import placeHolderImage from "../assets/placeholder.svg";

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [creatingSong, setCreatingSong] = useState(false);

  useEffect(() => {
    fetchAlbumDetails();
  }, [id]);

  const fetchAlbumDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/album/${id}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data: Album = await response.json();
      setAlbum(data);
    } catch (error) {
      console.error("Failed to fetch album details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!album && !loading)
    return <p className="text-center">Album not found.</p>;
  if (loading || !album) return <LoadingSpinner />;

  return (
    <div className="">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        theme="dark"
      />

      {localStorage.getItem("role") === "admin" && editingSongId && (
        <SongModal
          isOpen={!!editingSongId}
          onClose={() => setEditingSongId(null)}
          songId={editingSongId}
          onSaved={fetchAlbumDetails}
        />
      )}

      <SongModal
        isOpen={creatingSong}
        onClose={() => setCreatingSong(false)}
        onSaved={fetchAlbumDetails}
        albumId={album?.id} // pass current album id for creation
      />

      <Header />

      <div className="flex flex-col md:flex-row w-3/4 mx-auto gap-6 mt-4 pt-12 md:pt-0">
        <div className="shrink-0 md:w-1/2 flex justify-center pt-10">
          <div className="flex flex-col items-center max-h-[80vh]">
            <div className="w-3/4 aspect-square rounded-lg overflow-hidden bg-gray-700">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <img
                  src={album?.cover_url || placeHolderImage}
                  alt={album?.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              )}
            </div>

            <h1 className="text-2xl font-bold mt-4 text-center text-white">
              {loading ? "Loading..." : album?.title}
            </h1>
            <p
              className={`text-2xl text-center cursor-pointer ${
                loading ? "bg-gray-600 animate-pulse" : ""
              }`}
              onClick={() =>
                !loading &&
                (window.location.href = `/artist/${album?.artist_id}`)
              }
            >
              {loading ? "Loading artist..." : album?.artist}
            </p>
          </div>
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-auto max-h-[80vh]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="font-bold text-white">Tracks</h1>
            {localStorage.getItem("role") === "admin" && (
              <button
                onClick={() => setCreatingSong(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
              >
                <span className="font-bold">+</span> Create song
              </button>
            )}
          </div>
          <table className="w-full table-auto border-collapse">
            <tbody>
              {album.songs.map((song) => {
                const minutes = Math.floor(song.length / 60000);
                const seconds = Math.floor((song.length % 60000) / 1000);

                const handleDelete = async (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!confirm(`Delete song "${song.title}"?`)) return;

                  try {
                    let token = localStorage.getItem("accessToken") || "";
                    let res = await fetch(`/api/song?id=${song.id}`, {
                      method: "DELETE",
                      headers: { Authorization: `Bearer ${token}` },
                    });

                    if (res.status === 401) {
                      const refreshRes = await fetch("/api/refresh", {
                        method: "POST",
                        credentials: "include",
                      });
                      if (!refreshRes.ok)
                        throw new Error("Token refresh failed");
                      const data = await refreshRes.json();
                      token = data.accessToken;
                      localStorage.setItem("accessToken", token);

                      res = await fetch(`/api/song?id=${song.id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                      });
                    }

                    if (!res.ok) throw new Error("Failed to delete song");
                    fetchAlbumDetails();
                  } catch (err) {
                    console.error(err);
                    toast.error(
                      err instanceof Error
                        ? err.message
                        : "Failed to delete song"
                    );
                  }
                };

                return (
                  <tr
                    key={song.id}
                    onClick={() => setEditingSongId(song.id)}
                    className="h-6 cursor-pointer group"
                  >
                    <th className="p-2 text-left">{song.track_number}</th>
                    <td className="p-2">{song.title}</td>
                    <td className="p-2 text-right">
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </td>
                    {localStorage.getItem("role") === "admin" && (
                      <td className="p-2 text-right">
                        <button
                          onClick={handleDelete}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
