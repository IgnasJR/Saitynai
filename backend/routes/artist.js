import express from "express";
import { postgres } from "../utils/db.js"; // your Postgres connection

const router = express.Router();

/**
 * @swagger
 * /artist:
 *   get:
 *     summary: Search for artists by name
 *     description: Returns a list of artists from the local database whose names match the query.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the artist to search for (case-insensitive, partial match allowed)
 *     responses:
 *       200:
 *         description: A list of matching artists
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   mbid:
 *                     type: string
 *                     example: "cc197bad-dc9c-440d-a5b5-d52ba2e14234"
 *                   name:
 *                     type: string
 *                     example: "Alina Orlova"
 *       400:
 *         description: Missing 'name' query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing 'name' query parameter"
 *       404:
 *         description: No artists found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No artists found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.get("/artist", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).send("Missing 'name' query parameter");
  }

  try {
    const result = await postgres.query(
      `SELECT id, mbid, name 
       FROM artists 
       WHERE LOWER(name) LIKE $1`,
      [`%${name.toLowerCase()}%`]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No artists found" });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching artists from DB:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /discography:
 *   get:
 *     summary: Get artist details with albums and songs
 *     description: Returns information about an artist, including their albums and songs.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the artist to retrieve (case-insensitive, partial match allowed)
 *     responses:
 *       200:
 *         description: Artist details with albums and songs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   mbid:
 *                     type: string
 *                     example: "cc197bad-dc9c-440d-a5b5-d52ba2e14234"
 *                   name:
 *                     type: string
 *                     example: "Alina Orlova"
 *                   albums:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 10
 *                         title:
 *                           type: string
 *                           example: "Laukinis šuo dingo"
 *                         release_date:
 *                           type: string
 *                           format: date
 *                           example: "2007-03-15"
 *                         songs:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                                 example: 100
 *                               title:
 *                                 type: string
 *                                 example: "Paukščiai"
 *                               track_number:
 *                                 type: integer
 *                                 example: 1
 *       400:
 *         description: Missing 'name' query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing 'name' query parameter"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.get("/discography", async (req, res) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).send("Missing 'name' query parameter");
  }

  try {
    const result = await postgres.query(
      `SELECT artists.id, artists.mbid, artists.name, 
              albums.id AS album_id, albums.title AS album_title, albums.release_date,
              songs.id AS song_id, songs.title AS song_title, songs.track_number
       FROM artists
       LEFT JOIN albums ON artists.id = albums.artist_id
       LEFT JOIN songs ON albums.id = songs.album_id
       WHERE LOWER(artists.name) LIKE $1
       ORDER BY albums.release_date, songs.track_number`,
      [`%${name.toLowerCase()}%`]
    );

    const artistsMap = {};

    for (const row of result.rows) {
      if (!artistsMap[row.id]) {
        artistsMap[row.id] = {
          id: row.id,
          mbid: row.mbid,
          name: row.name,
          albums: [],
        };
      }

      if (row.album_id) {
        let artist = artistsMap[row.id];
        let album = artist.albums.find((a) => a.id === row.album_id);

        if (!album) {
          album = {
            id: row.album_id,
            title: row.album_title,
            release_date: row.release_date,
            songs: [],
          };
          artist.albums.push(album);
        }

        if (row.song_id) {
          album.songs.push({
            id: row.song_id,
            title: row.song_title,
            track_number: row.track_number,
          });
        }
      }
    }

    res.json(Object.values(artistsMap));
  } catch (error) {
    console.error(
      "Error fetching artists with albums and songs from DB:",
      error
    );
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /artist:
 *   post:
 *     summary: Add a new artist
 *     description: Inserts a new artist into the local database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Artist"
 *               country:
 *                 type: string
 *                 example: "Lithuania"
 *               founded:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *               disbanded:
 *                 type: string
 *                 format: date
 *                 example: "2010-01-01"
 *     responses:
 *       201:
 *         description: Artist created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 mbid:
 *                   type: string
 *                   example: null
 *                 name:
 *                   type: string
 *                   example: "New Artist"
 *       400:
 *         description: Missing 'name' in request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing 'name' in request body"
 *       409:
 *         description: Artist already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Artist already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.post("/artist", async (req, res) => {
  const { name, country, founded, disbanded } = req.body;
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
    result = await postgres.query(
      `INSERT INTO artists (name) VALUES ($1) RETURNING *`,
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error inserting artist:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /artist/{id}:
 *   patch:
 *     summary: Update an existing artist
 *     description: Updates an existing artist in the local database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Artist"
 *               country:
 *                 type: string
 *                 example: "LT"
 *               founded:
 *                 type: string
 *                 format: date
 *                 example: "2000-01-01"
 *               disbanded:
 *                 type: string
 *                 format: date
 *                 example: "2010-01-01"
 *     responses:
 *       201:
 *         description: Artist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 mbid:
 *                   type: string
 *                   example: null
 *                 name:
 *                   type: string
 *                   example: "New Artist"
 *                 country:
 *                   type: string
 *                   example: "LT"
 *                 founded:
 *                  type: string
 *                  format: date
 *                  example: "2000-01-01"
 *                 disbanded:
 *                  type: string
 *                  format: date
 *                  example: "2010-01-01"
 *
 *       400:
 *         description: Missing 'name' in request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Missing 'name' in request body"
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Artist not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.patch("/artist/:id", async (req, res) => {
  const { id } = req.params;
  const { name, country, founded, disbanded } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Missing 'name' in request body" });
  }

  try {
    const result = await postgres.query(
      `UPDATE artists 
       SET name = $1, 
           country = $2, 
           founded = $3, 
           disbanded = $4 
       WHERE id = $5 
       RETURNING *`,
      [name, country, founded, disbanded, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Artist not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating artist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /artist/{id}:
 *   delete:
 *     summary: Delete an existing artist
 *     description: Deletes an existing artist along with all their albums and songs from the local database.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the artist to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Artist deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Artist deleted"
 *                 artist:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 10
 *                     mbid:
 *                       type: string
 *                       example: "964afd38-8f0c-4f60-b3d1-9e1349a7ccf3"
 *                     name:
 *                       type: string
 *                       example: "Nina Orlova"
 *                     dateadded:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-19T05:47:02.223Z"
 *                     country:
 *                       type: string
 *                       nullable: true
 *                     founded:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *                     disbanded:
 *                       type: string
 *                       format: date
 *                       nullable: true
 *       404:
 *         description: Artist not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Artist not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.delete("/artist/:id", async (req, res) => {
  const { id } = req.params;

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

    res.status(200).json({ message: "Artist deleted", artist: result.rows[0] });
  } catch (error) {
    console.error("Error deleting artist:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
