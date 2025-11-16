import { useEffect, useState } from "react";
import Spinner from "../Components/LoadingSpinner";
import "./FrontPage.css";
import { Link } from "react-router";

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
        const data: Album[] = await response.json();
        setAlbums(data);
      } catch (err: any) {
        setError(err.message || "Failed to load albums");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  if (isLoading) return <Spinner />;

  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="frontpage-container">
      <h1 className="frontpage-title">Music Albums</h1>
      <div className="album-list">
        {albums.map((album) => (
          <Link to={`/album/${album.id}`} key={album.id} className="album-card">
            <div key={album.id} className="album-item">
              <img
                src={album.cover_url}
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
