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

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const res = await fetch("/api/artists");
        if (!res.ok) throw new Error("Failed to fetch frontpage artists");

        const data: Artist[] = await res.json();
        setArtists(data);
      } catch (err: unknown) {
        console.error("Error fetching frontpage artists:", err);
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        toast.error(`Error fetching artists: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  const handleCreateArtist = () => {
    setIsModalOpen(true);
  };

  const handleArtistSaved = (newArtistId: string) => {
    toast.success("Artist saved successfully!");
    setIsModalOpen(false);
  };

  const handleArtistSaveFailed = (message: string) => {
    toast.error(`Failed to save artist: ${message}`);
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={handleArtistSaved}
        onError={handleArtistSaveFailed}
      />

      <div className="w-3/4 mx-auto mt-10 pt-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-white">Artists</h1>
          {localStorage.getItem("role") === "admin" && (
            <button
              onClick={handleCreateArtist}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded flex items-center gap-1"
            >
              <span className="text-xl font-bold">+</span> Create Artist
            </button>
          )}
        </div>

        <table className="w-full border-collapse text-left text-white">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">MBID</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((artist) => (
              <tr
                onClick={() => (window.location.href = `/artist/${artist.id}`)}
                key={artist.id}
                className="hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <td className="p-3">{artist.id}</td>
                <td className="p-3">{artist.name}</td>
                <td className="p-3">{artist.mbid || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Frontpage;
