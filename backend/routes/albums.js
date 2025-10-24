import express from "express";
import { postgres } from "../utils/db.js";
import { formatDate } from "../utils/parser.js";
import { verifyToken } from "../utils/auth.js";

const router = express.Router();

/**
 * @swagger
 * /album:
 *   get:
 *     summary: Get album by ID
 *     description: Retrieves a single album by its ID, including the artist's name.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the album to retrieve
 *         schema:
 *           type: integer
 *           example: 5
 *     responses:
 *       200:
 *         description: Album retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 5
 *                 mbid:
 *                   type: string
 *                   example: null
 *                 title:
 *                   type: string
 *                   example: "Albumo pavadinimas"
 *                 release_date:
 *                   type: string
 *                   format: date
 *                   example: "2020-05-01"
 *                 artist:
 *                   type: string
 *                   example: "Atlik4jo vardas"
 *       400:
 *         description: Album ID is required
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Album ID is required"
 *       404:
 *         description: Album not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Album not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

router.get("/album/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).send("Album ID is required");
  }

  try {
    const result = await postgres.query(
      `SELECT albums.id, albums.mbid, albums.title, albums.release_date, artists.name as artist
       FROM albums 
       JOIN artists ON albums.artist_id = artists.id
       WHERE albums.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Album not found");
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching album from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /albums:
 *   get:
 *     summary: Get a list of albums
 *     description: Retrieves albums filtered by title, artist, and/or release year.
 *     parameters:
 *       - in: query
 *         name: title
 *         required: false
 *         description: Filter by album title (case-insensitive, partial match)
 *         schema:
 *           type: string
 *           example: "albumo pav. fragmentas"
 *       - in: query
 *         name: artist
 *         required: false
 *         description: Filter by artist name (case-insensitive, partial match)
 *         schema:
 *           type: string
 *           example: "atlik4jo vardas"
 *       - in: query
 *         name: year
 *         required: false
 *         description: Filter by release year
 *         schema:
 *           type: integer
 *           example: 1980
 *     responses:
 *       200:
 *         description: List of albums retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 7
 *                   mbid:
 *                     type: string
 *                     example: null
 *                   title:
 *                     type: string
 *                     example: "Laukinis Šuo"
 *                   artist:
 *                     type: string
 *                     example: "Alina Orlova"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

router.get("/albums", async (req, res) => {
  const { title = "", artist = "", year } = req.query;

  try {
    const result = await postgres.query(
      `SELECT albums.id, albums.mbid, albums.title, albums.AlbumCoverLink as cover_url, artists.name as artist
       FROM albums 
       JOIN artists ON albums.artist_id = artists.id
       WHERE ($1::text IS NULL OR LOWER(albums.title) LIKE $1) 
         AND ($2::text IS NULL OR LOWER(artists.name) LIKE $2)
         AND ($3::int IS NULL OR EXTRACT(YEAR FROM albums.release_date) = $3)`,
      [`%${title.toLowerCase()}%`, `%${artist.toLowerCase()}%`, year || null]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching albums from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /album:
 *   patch:
 *     summary: Update an album
 *     description: Updates an album's title and/or release date. At least one field (`title` or `release_date`) must be provided.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the album to update
 *         schema:
 *           type: integer
 *           example: 10
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Album Title"
 *               release_date:
 *                 type: string
 *                 format: date
 *                 example: "2021-12-01"
 *               mbid:
 *                 type: string
 *                 description: Optional MBID field (not required by this endpoint)
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Album updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 10
 *                 mbid:
 *                   type: string
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *                 title:
 *                   type: string
 *                   example: "Updated Album Title"
 *                 release_date:
 *                   type: string
 *                   format: date
 *                   example: "2021-12-01"
 *       400:
 *         description: No fields to update
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "No fields to update"
 *       404:
 *         description: Album not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Album not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

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

/**
 * @swagger
 * /album:
 *   post:
 *     summary: Add a new album
 *     description: Inserts a new album into the database. Requires title, artist_id, and release_date.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - artist_id
 *               - release_date
 *             properties:
 *               title:
 *                 type: string
 *                 example: "New Album"
 *               artist_id:
 *                 type: integer
 *                 example: 3
 *               release_date:
 *                 type: string
 *                 format: date
 *                 example: "2023-08-15"
 *               mbid:
 *                 type: string
 *                 nullable: true
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Album created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 15
 *                 title:
 *                   type: string
 *                   example: "New Album"
 *                 artist_id:
 *                   type: integer
 *                   example: 3
 *                 release_date:
 *                   type: string
 *                   format: date
 *                   example: "2023-08-15"
 *                 mbid:
 *                   type: string
 *                   nullable: true
 *                   example: "550e8400-e29b-41d4-a716-446655440000"
 *       400:
 *         description: Missing required fields
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Missing required fields"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

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

/**
 * @swagger
 * /album:
 *   delete:
 *     summary: Delete an album
 *     description: Deletes an album by ID along with all associated songs.
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         description: ID of the album to delete
 *         schema:
 *           type: integer
 *           example: 12
 *     responses:
 *       200:
 *         description: Album and associated songs deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Album and associated songs deleted"
 *       400:
 *         description: Album ID is required
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Album ID is required"
 *       404:
 *         description: Album not found
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Album not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Internal Server Error"
 */

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
