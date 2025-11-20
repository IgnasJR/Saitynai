import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type Album from "../Models/Album";
import LoadingSpinner from "../Components/LoadingSpinner";
import Header from "../Components/Header";
import SongEditModal from "../Components/SongEditModal";
import { ToastContainer } from "react-toastify";

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<string | null>(null);

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

  if (!album && !loading) {
    return <p className="text-center">Album not found.</p>;
  }
  if (loading || !album) {
    return <LoadingSpinner />;
  }

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
      <SongEditModal
        isOpen={editingIndex !== null}
        onClose={() => setEditingIndex(null)}
        songId={editingIndex || undefined} // <-- use songId
      />

      <Header />
      <div className="flex flex-col md:flex-row w-3/4 mx-auto gap-6 mt-4">
        {/* Album info */}
        <div className="shrink-0 md:w-1/2 flex justify-center">
          <div className="flex flex-col items-center max-h-[80vh]">
            <div className="w-3/4 aspect-square">
              <img
                src={album.cover_url}
                alt={album.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <h1 className="text-2xl font-bold mt-4 text-center">
              {album.title}
            </h1>
            <p
              className="text-2xl text-center"
              onClick={() =>
                (window.location.href = `/artist/${album.artist_id}`)
              }
            >
              {album.artist}
            </p>
          </div>
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-auto max-h-[80vh]">
          <h2 className="text-xl font-semibold mb-2 w-full">Tracks</h2>
          <table className="w-full table-auto border-collapse">
            <tbody>
              {album.songs.map((song) => {
                const minutes = Math.floor(song.length / 60000);
                const seconds = Math.floor((song.length % 60000) / 1000);

                return (
                  <tr
                    key={song.id}
                    onClick={() => setEditingIndex(song.id)}
                    className="h-6"
                  >
                    <th className="p-2 text-left">{song.track_number}</th>
                    <td className="p-2">{song.title}</td>
                    <td className="p-2 text-right">
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </td>
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
