import { useParams } from "react-router";

export default function AlbumPage() {
  const { id } = useParams();

  return (
    <div>
      <h1>Album Page</h1>
      <p>Album ID: {id}</p>
    </div>
  );
}
