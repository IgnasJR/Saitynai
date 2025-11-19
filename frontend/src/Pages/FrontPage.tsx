import { useEffect, useState } from "react";
import Spinner from "../Components/LoadingSpinner";
import { Link } from "react-router";
const imagePlaceholder = "../assets/placeholder.svg";

interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
}

export default function Frontpage() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/albums");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Expected JSON response but received: ${
              text || "non-JSON response"
            }`
          );
        }

        const data: Album[] = await response.json();
        setAlbums(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message || "Failed to load albums");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (isLoading) return <Spinner />;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div>
      <h1>Music Albums</h1>
      <div className="w-fit mx-auto grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 justify-items-center justify-center gap-y-20 gap-x-14 mt-10 mb-5">
        {albums.map((album) => (
          <Link to={`/album/${album.id}`} key={album.id} className="album-card">
            <div
              key={album.id}
              className="w-72 bg-white shadow-md rounded-xl duration-500 hover:scale-105 hover:shadow-xl"
            >
              <img
                src={album.cover_url ? album.cover_url : imagePlaceholder}
                alt={album.title}
                className="album-cover"
              />
              <div className="album-info">
                <h2 className="album-title">{album.title}</h2>
                <p className="album-artist">{album.artist}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
