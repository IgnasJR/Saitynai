import express from "express";
import { postgres } from "../utils/db.js";
import { formatDate } from "../utils/parser.js";
import { verifyToken } from "../utils/auth.js";

const router = express.Router();

/**
 * @swagger
 * /artists:
 *   get:
 *     summary: Search for artists by name
 *     description: Returns a list of artists from the  database whose names match the query.
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: false
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
router.get("/artists", async (req, res) => {
  const { name } = req.query;
  let result;
  try {
    if (!name) {
      result = await postgres.query(
        `SELECT id, mbid, name
         FROM artists`
      );
    } else {
      result = await postgres.query(
        `SELECT id, mbid, name
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
  console.log(id);

  try {
    const result = await postgres.query(
      `SELECT id, mbid, name
       FROM artists
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Artist not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching artist from DB:", error);
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
 *     description: Inserts a new artist into the  database.
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

/**
 * @swagger
 * /artist:
 *   patch:
 *     summary: Update an existing artist
 *     description: Updates artist details by ID. The field `name` is required.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the artist to update
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Artist Name"
 *               country:
 *                 type: string
 *                 example: "USA"
 *               founded:
 *                 type: string
 *                 format: date
 *                 example: "1995-01-01"
 *               disbanded:
 *                 type: string
 *                 format: date
 *                 example: "2005-01-01"
 *     responses:
 *       200:
 *         description: Artist updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Updated Artist Name"
 *                 country:
 *                   type: string
 *                   example: "USA"
 *                 founded:
 *                   type: string
 *                   format: date
 *                   example: "1995-01-01"
 *                 disbanded:
 *                   type: string
 *                   format: date
 *                   example: "2005-01-01"
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

/**
 * @swagger
 * /artist:
 *   delete:
 *     summary: Delete an existing artist
 *     description: Deletes an existing artist along with all their albums and songs from the  database.
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

// http://localhost:3001/api/artist_album?artist_id=45&album_id=365
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
