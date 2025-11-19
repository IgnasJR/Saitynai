import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type Album from "../Models/Album";

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);

  useEffect(() => {
    fetchAlbumDetails();
  }, [id]);

  const fetchAlbumDetails = async () => {
    try {
      const response = await fetch(`/api/album/${id}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data: Album = await response.json();
      setAlbum(data);
    } catch (error) {
      console.error("Failed to fetch album details:", error);
    }
  };

  return (
    <div>
      <h1>{album?.title}</h1>
      <p>Album ID: {id}</p>
      <p>Artist: {album?.artist}</p>
      <img src={album?.cover_url} alt={album?.title} />
    </div>
  );
}
