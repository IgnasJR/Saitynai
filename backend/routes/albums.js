import express from "express";
import { postgres } from "../utils/db.js";
import { formatDate } from "../utils/parser.js";
import { verifyToken } from "../utils/auth.js";

const router = express.Router();

router.get("/album/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Album ID is required");
  }

  try {
    const albumResult = await postgres.query(
      `SELECT albums.id, albums.mbid, albums.title, albums.release_date, artists.name as artist, artists.id as artist_id, albums.AlbumCoverLink as cover_url
       FROM albums 
       JOIN artists ON albums.artist_id = artists.id
       WHERE albums.id = $1`,
      [id]
    );

    if (albumResult.rows.length === 0) {
      return res.status(404).send("Album not found");
    }

    const album = albumResult.rows[0];

    const songsResult = await postgres.query(
      `SELECT *
       FROM songs
       WHERE album_id = $1
       ORDER BY track_number NULLS LAST, id`,
      [id]
    );

    album.songs = songsResult.rows;

    res.json(album);
  } catch (error) {
    console.error("Error fetching album from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.patch("/album", async (req, res) => {
  const { id } = req.query;
  let { title, release_date } = req.body;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    } else if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
  } else {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  if (!title && !release_date) {
    return res.status(400).json({ error: "No fields to update" });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (title) {
    fields.push(`title = $${idx++}`);
    values.push(title);
  }
  if (release_date) {
    fields.push(`release_date = $${idx++}`);
    values.push(formatDate(release_date));
  }
  values.push(id);

  const query = `UPDATE albums SET ${fields.join(
    ", "
  )} WHERE id = $${idx} RETURNING *`;

  try {
    const result = await postgres.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).send("Album not found");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating album:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/album", async (req, res) => {
  const { title, artist_id, release_date, mbid } = req.body;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    } else if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
  } else {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  if (!title || !artist_id || !release_date) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const artistExists = await postgres.query(
      "SELECT id FROM artists WHERE id = $1",
      [artist_id]
    );

    if (artistExists.rows.length === 0) {
      return res.status(404).json({ error: "Artist not found" });
    }

    const result = await postgres.query(
      `INSERT INTO albums (title, artist_id, release_date, mbid)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, artist_id, formatDate(release_date), mbid || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding album:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/album", async (req, res) => {
  const { id } = req.query;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    } else if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
  } else {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  if (!id) {
    return res.status(400).send("Album ID is required");
  }

  try {
    const deleteSongsQuery = `DELETE FROM songs WHERE album_id = $1`;
    await postgres.query(deleteSongsQuery, [id]);

    const result = await postgres.query(
      `DELETE FROM albums WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Album not found");
    }

    res.json({ message: "Album and associated songs deleted" });
  } catch (error) {
    console.error("Error deleting album:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
