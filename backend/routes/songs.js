import express from "express";
import { postgres } from "../utils/db.js";
import { formatLength } from "../utils/parser.js";
import { verifyToken } from "../utils/auth.js";
const router = express.Router();

router.get("/song/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Song ID is required");
  }

  try {
    const result = await postgres.query(
      `SELECT songs.id, songs.mbid, songs.title, songs.length, songs.track_number,
                         albums.title AS album, artists.name AS artist
                         FROM songs
                         JOIN albums ON songs.album_id = albums.id
                         JOIN artists ON albums.artist_id = artists.id
                         WHERE songs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Song not found");
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching song from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/songs", async (req, res) => {
  const {
    title = "",
    artist = "",
    album = "",
    id = "",
    page = 1,
    limit = 100,
  } = req.query;
  const offset = (page - 1) * limit;

  if (limit > 500) {
    return res.status(400).send("Limit cannot exceed 500");
  }

  try {
    const result = await postgres.query(
      `SELECT songs.id, songs.mbid, songs.title, albums.title AS album, artists.name AS artist
                         FROM songs
                         JOIN albums ON songs.album_id = albums.id
                         JOIN artists ON albums.artist_id = artists.id
                         WHERE ($1::text IS NULL OR LOWER(songs.title) LIKE $1)
                             AND ($2::text IS NULL OR LOWER(artists.name) LIKE $2)
                             AND ($3::text IS NULL OR LOWER(albums.title) LIKE $3)
                             AND ($4::int IS NULL OR songs.id = $4)
                         LIMIT $5 OFFSET $6`,
      [
        `%${title.toLowerCase()}%`,
        `%${artist.toLowerCase()}%`,
        `%${album.toLowerCase()}%`,
        id.toString() || null,
        parseInt(limit),
        parseInt(offset),
      ]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching songs from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.patch("/song", async (req, res) => {
  const { id } = req.query;
  const { title, length, track_number } = req.body;

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

  if (!title && !length && !track_number) {
    return res.status(400).send("No fields to update");
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (title) {
    fields.push(`title = $${idx++}`);
    values.push(title);
  }
  if (length) {
    fields.push(`length = $${idx++}`);
    values.push(formatLength(length));
  }
  if (track_number) {
    fields.push(`track_number = $${idx++}`);
    values.push(track_number);
  }
  values.push(id);

  const query = `UPDATE songs SET ${fields.join(
    ", "
  )} WHERE id = $${idx} RETURNING *`;

  try {
    const result = await postgres.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).send("Song not found");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating song:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/song", async (req, res) => {
  const { title, album_id, length, track_number, mbid } = req.body;

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

  if (!title || !album_id) {
    return res.status(400).send("Title and album_id are required");
  }

  if (isNaN(album_id)) {
    return res.status(400).send("Invalid album_id");
  }

  res.mbid = await postgres.query(`select * from songs where mbid = $1`, [
    mbid,
  ]);
  if (res.mbid.rows.length > 0) {
    return res.status(409).send("Song with this MBID already exists");
  }

  try {
    const result = await postgres.query(
      `INSERT INTO songs (album_id, title, length, track_number, mbid)
                         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        album_id,
        title,
        formatLength(length) || null,
        track_number || null,
        mbid || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating song:", error);

    res.status(500).send("Internal Server Error");
  }
});

router.delete("/song", async (req, res) => {
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

  try {
    const result = await postgres.query(
      "DELETE FROM songs WHERE id = $1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Song not found");
    }
    res.json({ message: "Song deleted", song: result.rows[0] });
  } catch (error) {
    console.error("Error deleting song:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;
