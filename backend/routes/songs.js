import express from "express";
import { postgres } from "../utils/db.js"; // your Postgres connection
import { formatLength } from "../utils/parser.js";
import { verifyToken } from "../utils/auth.js";
const router = express.Router();

/**
 * @swagger
 * /song:
 *   get:
 *     summary: Get song by ID
 *     description: Retrieves a single song by its ID, including album and artist information.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the song to retrieve
 *         schema:
 *           type: integer
 *           example: 25
 *     responses:
 *       200:
 *         description: Song retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 25
 *                 mbid:
 *                   type: string
 *                   example: null
 *                 title:
 *                   type: string
 *                   example: "Menulis"
 *                 length:
 *                   type: integer
 *                   description: Song length in seconds
 *                   example: 354
 *                 track_number:
 *                   type: integer
 *                   example: 1
 *                 album:
 *                   type: string
 *                   example: "Laukinis Šuo"
 *                 artist:
 *                   type: string
 *                   example: "Alina Orlova"
 *       400:
 *         description: Song ID is required
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Song ID is required"
 *       404:
 *         description: Song not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Song not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

router.get("/song", async (req, res) => {
  const { id } = req.query;

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
/**
 * @swagger
 * /songs:
 *   get:
 *     summary: Get a list of songs
 *     description: Retrieves songs filtered by title, artist, album, or song ID. Supports pagination with page and limit.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: false
 *         description: Filter by song title (case-insensitive, partial match)
 *         schema:
 *           type: string
 *           example: "love"
 *       - in: query
 *         name: artist
 *         required: false
 *         description: Filter by artist name (case-insensitive, partial match)
 *         schema:
 *           type: string
 *           example: "orlova"
 *       - in: query
 *         name: album
 *         required: false
 *         description: Filter by album title (case-insensitive, partial match)
 *         schema:
 *           type: string
 *           example: "laukin"
 *       - in: query
 *         name: id
 *         required: false
 *         description: Filter by specific song ID
 *         schema:
 *           type: integer
 *           example: 42
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number for pagination (default = 1)
 *         schema:
 *           type: integer
 *           example: 2
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of results per page (default = 100, max = 500)
 *         schema:
 *           type: integer
 *           example: 50
 *     responses:
 *       200:
 *         description: List of songs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 42
 *                   mbid:
 *                     type: string
 *                     example: null
 *                   title:
 *                     type: string
 *                     example: "1"
 *                   album:
 *                     type: string
 *                     example: "2"
 *                   artist:
 *                     type: string
 *                     example: "artist"
 *       400:
 *         description: Limit exceeds maximum allowed value
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Limit cannot exceed 500"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

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

/**
 * @swagger
 * /song:
 *   patch:
 *     summary: Update a song
 *     description: Updates a song's title, length, and/or track number. At least one field must be provided.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the song to update
 *         schema:
 *           type: integer
 *           example: 25
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Song Title"
 *               length:
 *                 type: string
 *                 description: Song length in "mm:ss" format
 *                 example: "05:30"
 *               track_number:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Song updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 25
 *                 title:
 *                   type: string
 *                   example: "Updated Song Title"
 *                 length:
 *                   type: string
 *                   example: "05:30"
 *                 track_number:
 *                   type: integer
 *                   example: 2
 *                 album:
 *                   type: string
 *                   example: "album"
 *                 artist:
 *                   type: string
 *                   example: "artist"
 *       400:
 *         description: No fields to update
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "No fields to update"
 *       404:
 *         description: Song not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Song not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

router.patch("/song", async (req, res) => {
  const { id } = req.query;
  const { title, length, track_number } = req.body;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyToken(token);
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

  console.log("Update Query:", query);
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

/**
 * @swagger
 * /song:
 *   post:
 *     summary: Add a new song
 *     description: Inserts a new song into the database. Requires `title` and `album_id`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - album_id
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Menulis"
 *               album_id:
 *                 type: integer
 *                 example: 7
 *               length:
 *                 type: string
 *                 description: Song length in "mm:ss" format
 *                 example: "05:55"
 *               track_number:
 *                 type: integer
 *                 example: 1
 *               mbid:
 *                 type: string
 *                 nullable: true
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Song created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 25
 *                 album_id:
 *                   type: integer
 *                   example: 7
 *                 title:
 *                   type: string
 *                   example: "Menulis"
 *                 length:
 *                   type: string
 *                   example: "05:55"
 *                 track_number:
 *                   type: integer
 *                   example: 1
 *                 mbid:
 *                   type: string
 *                   nullable: true
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Title and album_id are required
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Title and album_id are required"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

router.post("/song", async (req, res) => {
  const { title, album_id, length, track_number, mbid } = req.body;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyToken(token);
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

/**
 * @swagger
 * /song:
 *   delete:
 *     summary: Delete a song
 *     description: Deletes a song by its ID.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the song to delete
 *         schema:
 *           type: integer
 *           example: 25
 *     responses:
 *       200:
 *         description: Song deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Song deleted"
 *                 song:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 25
 *                     album_id:
 *                       type: integer
 *                       example: 7
 *                     title:
 *                       type: string
 *                       example: "Menulis"
 *                     length:
 *                       type: string
 *                       example: "05:55"
 *                     track_number:
 *                       type: integer
 *                       example: 1
 *                     mbid:
 *                       type: string
 *                       nullable: true
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *       404:
 *         description: Song not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Song not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

router.delete("/song", async (req, res) => {
  const { id } = req.query;

  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = verifyToken(token);
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
