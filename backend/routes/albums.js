import express from "express";
import { postgres } from "../utils/db.js"; // your Postgres connection

const router = express.Router();

router.get("/albums", async (req, res) => {
  const { title = "", artist = "", year } = req.query;

  try {
    const result = await postgres.query(
      `SELECT albums.id, albums.mbid, albums.title, artists.name as artist
       FROM albums 
       JOIN artists ON albums.artist_id = artists.id
       WHERE ($1::text IS NULL OR LOWER(albums.title) LIKE $1) 
         AND ($2::text IS NULL OR LOWER(artists.name) LIKE $2)`,
      [`%${title.toLowerCase()}%`, `%${artist.toLowerCase()}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching albums from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
