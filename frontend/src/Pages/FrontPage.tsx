import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Artist from "../Models/Artist";
import ArtistModal from "../Components/ArtistModal";

function Frontpage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtistId, setEditingArtistId] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (!res.ok) throw new Error("Failed to fetch frontpage artists");

        const data: Artist[] = await res.json();
        setArtists(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(`Error fetching artists: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const openCreateArtist = () => {
    setEditingArtistId(undefined);
    setIsModalOpen(true);
  };

  const openEditArtist = (artistId: string) => {
    setEditingArtistId(artistId);
    setIsModalOpen(true);
  };

  const handleArtistSaved = () => {
    const updateList = async () => {
      try {
        const res = await fetch("/api/artists");
        if (!res.ok) throw new Error("Failed to refresh artist list");
        const data: Artist[] = await res.json();
        setArtists(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Failed to refresh artists: ${msg}`);
      }
    };
    updateList();
  };

  if (loading)
    return <p className="text-center mt-10">Loading artist information...</p>;
  if (error) return <p className="text-red-500 text-center mt-10">{error}</p>;
  if (artists.length === 0)
    return <p className="text-center mt-10">No artists found.</p>;

  return (
    <>
      <ToastContainer position="bottom-right" theme="dark" />

      <ArtistModal
        artistId={editingArtistId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleArtistSaved}
      />

      <div className="w-11/12 md:w-4/5 mx-auto mt-10 pt-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-0">
            Artists
          </h1>

          {localStorage.getItem("role") === "admin" && (
            <button
              onClick={openCreateArtist}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded flex items-center gap-1"
            >
              <span className="text-lg md:text-xl font-bold">+</span> Create
              Artist
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-white">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">MBID</th>
                <th className="p-3">Country</th>
                <th className="p-3">Founded</th>
                <th className="p-3">Disbanded</th>
                {localStorage.getItem("role") === "admin" && (
                  <th className="p-3">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {artists.map((artist) => (
                <tr
                  key={artist.id}
                  className="hover:bg-gray-700 transition-colors cursor-pointer group"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).tagName !== "BUTTON") {
                      window.location.href = `/artist/${artist.id}`;
                    }
                  }}
                >
                  <td className="p-3">{artist.id}</td>
                  <td className="p-3">{artist.name}</td>
                  <td className="p-3">{artist.mbid || "N/A"}</td>
                  <td className="p-3">{artist.country || "N/A"}</td>
                  <td className="p-3">
                    {artist.founded
                      ? new Date(artist.founded).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="p-3">
                    {artist.disbanded
                      ? new Date(artist.disbanded).toLocaleDateString()
                      : "N/A"}
                  </td>
                  {localStorage.getItem("role") === "admin" && (
                    <td className="p-3">
                      <button
                        onClick={() => openEditArtist(artist.id)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Frontpage;
