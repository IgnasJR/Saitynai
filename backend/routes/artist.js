import express from "express";
import { postgres } from "../utils/db.js";
import { formatDate } from "../utils/parser.js";
import { verifyToken } from "../utils/auth.js";

const router = express.Router();

router.get("/artists", async (req, res) => {
  const { name } = req.query;
  let result;
  try {
    if (!name) {
      result = await postgres.query(
        `SELECT id, mbid, name, country, founded, disbanded
         FROM artists`
      );
    } else {
      result = await postgres.query(
        `SELECT id, mbid, name, country, founded, disbanded
         FROM artists
         WHERE LOWER(name) LIKE $1`,
        [`%${name.toLowerCase()}%`]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json(result.rows);
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching artists from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/artist/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const artistResult = await postgres.query(
      `SELECT id, mbid, name
       FROM artists
       WHERE id = $1`,
      [id]
    );

    if (artistResult.rows.length === 0) {
      return res.status(404).json({ message: "Artist not found" });
    }

    const albumsResult = await postgres.query(
      `SELECT id, title, release_date
       FROM albums
       WHERE artist_id = $1
       ORDER BY release_date`,
      [id]
    );

    const artist = artistResult.rows[0];
    artist.albums = albumsResult.rows;

    res.json(artist);
  } catch (error) {
    console.error("Error fetching artist and albums from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/artist", async (req, res) => {
  const { name, country, founded, disbanded } = req.body;

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

  if (!name) {
    return res.status(400).send("Missing 'name' in request body");
  }

  try {
    let query = `SELECT * FROM artists WHERE name = $1`;
    let values = [name];
    const existing = await postgres.query(query, values);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Artist already exists" });
    }
    const result = await postgres.query(
      `INSERT INTO artists (name, country, founded, disbanded) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, country, formatDate(founded), formatDate(disbanded)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting artist:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.patch("/artist/:id", async (req, res) => {
  const { id } = req.params;
  const { name, country, founded, disbanded, mbid } = req.body;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    let decoded;
    try {
      decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }
      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  } else {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (name) {
      fields.push(`name = $${idx++}`);
      values.push(name);
    }
    if (country) {
      fields.push(`country = $${idx++}`);
      values.push(country);
    }
    if (founded) {
      fields.push(`founded = $${idx++}`);
      values.push(founded);
    }
    if (disbanded) {
      fields.push(`disbanded = $${idx++}`);
      values.push(disbanded);
    }
    if (mbid) {
      fields.push(`mbid = $${idx++}`);
      values.push(mbid);
    }

    if (fields.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one field must be provided for update" });
    }

    values.push(id);

    const query = `UPDATE artists SET ${fields.join(
      ", "
    )} WHERE id = $${idx} RETURNING *`;

    const result = await postgres.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating artist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/artist", async (req, res) => {
  const { id } = req.query;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = await verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
  } catch (error) {
    return res.status(401).json({ error: error.message });
  }

  try {
    await postgres.query(
      `DELETE FROM songs
       USING albums
       WHERE songs.album_id = albums.id
         AND albums.artist_id = $1`,
      [id]
    );

    await postgres.query(
      `DELETE FROM albums
       WHERE artist_id = $1`,
      [id]
    );

    const result = await postgres.query(
      `DELETE FROM artists
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Artist not found" });
    }

    return res
      .status(200)
      .json({ message: "Artist deleted successfully", artist: result.rows[0] });
  } catch (error) {
    console.error("Error deleting artist:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/artist_album", (req, res) => {
  const { artist_id, album_id } = req.query;

  if (!artist_id && !album_id) {
    return res.status(400).json({ message: "Missing artist_id or album_id" });
  }

  const query = `
    SELECT albums.id as album_id, albums.title as album_title, 
           albums.release_date, artists.name as artist,
           songs.id as song_id, songs.title as song_title, songs.track_number
    FROM albums
    JOIN artists ON albums.artist_id = artists.id
    JOIN songs ON songs.album_id = albums.id
    WHERE ($1::int IS NULL OR albums.artist_id = $1)
      AND ($2::int IS NULL OR albums.id = $2)
    ORDER BY albums.release_date, songs.track_number
  `;

  postgres
    .query(query, [artist_id || null, album_id || null])
    .then(async (result) => {
      const albums = {};

      result.rows.forEach((row) => {
        if (!albums[row.album_id]) {
          albums[row.album_id] = {
            album_id: row.album_id,
            album_title: row.album_title,
            release_date: row.release_date,
            artist: row.artist,
            songs: [],
          };
        }

        albums[row.album_id].songs.push({
          id: row.song_id,
          title: row.song_title,
          track_number: row.track_number,
        });
      });

      if (Object.keys(albums).length === 0) {
        const artistQuery = `SELECT * FROM artists WHERE id = $1`;
        const artistResult = await postgres.query(artistQuery, [artist_id]);

        if (artistResult.rows.length === 0) {
          return res.status(404).json({ message: "Artist not found" });
        }

        return res
          .status(404)
          .json({ message: "No albums found for this artist" });
      }
      res.json(Object.values(albums));
    })
    .catch((error) => {
      console.error("Error fetching artist albums:", error);
      res.status(500).json({ message: "Internal Server Error" });
    });
});

export default router;
