import dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";
import { postgres } from "./utils/db.js";

const HEADERS = {
  "User-Agent":
    "TuneFederate/1.0 (https://yourdomain.com contact@yourdomain.com)", // <-- replace
  Accept: "application/json",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 5, backoff = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (res.ok) {
        return await res.json();
      }

      if (res.status === 503 && attempt < retries) {
        console.warn(
          `⚠️ Got 503 from MusicBrainz, retrying in ${backoff}ms (attempt ${attempt})`
        );
        await sleep(backoff);
        backoff *= 2;
        continue;
      }

      throw new Error(`MusicBrainz error ${res.status}`);
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`⚠️ Fetch failed: ${err.message}, retrying in ${backoff}ms`);
      await sleep(backoff);
      backoff *= 2;
    }
  }
}

function parseReleaseDate(date) {
  if (!date) return null;
  const parts = date.split("-");
  if (parts.length === 1) return `${parts[0]}-01-01`;
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`;
  return date;
}

async function fetchArtists(query, limit = 100) {
  const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(
    query
  )}&fmt=json&limit=${limit}`;
  console.log(`Fetching artists for "${query}"`);
  const data = await fetchWithRetry(url);
  console.log(`Found ${data.artists?.length || 0} artists`);
  return data.artists || [];
}

async function fetchReleaseGroups(artistMbid, limit = 100) {
  const url = `https://musicbrainz.org/ws/2/release-group?artist=${artistMbid}&type=album&fmt=json&limit=${limit}`;
  console.log(`  Fetching release groups for artist ${artistMbid}`);
  const data = await fetchWithRetry(url);
  console.log(`  Found ${data["release-groups"]?.length || 0} release groups`);
  return data["release-groups"] || [];
}

async function fetchFirstRelease(releaseGroupMbid) {
  const url = `https://musicbrainz.org/ws/2/release?release-group=${releaseGroupMbid}&fmt=json&limit=1`;
  console.log(
    `    Fetching first release for release group ${releaseGroupMbid}`
  );
  const data = await fetchWithRetry(url);
  const release = data.releases?.[0] || null;
  if (release)
    console.log(`    Found release: ${release.title} (${release.id})`);
  else
    console.warn(`    No release found for release group ${releaseGroupMbid}`);
  return release;
}

async function fetchSongs(releaseMbid) {
  const url = `https://musicbrainz.org/ws/2/release/${releaseMbid}?inc=recordings&fmt=json`;
  console.log(`      Fetching recordings for release ${releaseMbid}`);
  const data = await fetchWithRetry(url);
  const tracks = data.media?.flatMap((m) => m.tracks) || [];
  console.log(`      Found ${tracks.length} tracks`);
  return tracks;
}

async function saveArtist(artist) {
  const lifeSpan = artist["life-span"] || {};
  const founded = lifeSpan.begin ? parseReleaseDate(lifeSpan.begin) : null;
  const disbanded = lifeSpan.end ? parseReleaseDate(lifeSpan.end) : null;

  const result = await postgres.query(
    `INSERT INTO artists(mbid, name, country, founded, disbanded)
     VALUES($1, $2, $3, $4, $5)
     ON CONFLICT(mbid) DO UPDATE 
       SET name = EXCLUDED.name,
           country = EXCLUDED.country,
           founded = EXCLUDED.founded,
           disbanded = EXCLUDED.disbanded
     RETURNING id`,
    [artist.id, artist.name, artist.country || null, founded, disbanded]
  );
  return result.rows[0]?.id;
}

async function saveAlbum(album, artistId) {
  const releaseDate = parseReleaseDate(album.date);
  const result = await postgres.query(
    `INSERT INTO albums(artist_id, mbid, title, release_date)
     VALUES($1, $2, $3, $4)
     ON CONFLICT(mbid) DO UPDATE 
       SET title = EXCLUDED.title,
           release_date = EXCLUDED.release_date
     RETURNING id`,
    [artistId, album.id, album.title, releaseDate]
  );
  return result.rows[0]?.id;
}

async function saveSong(song, albumId) {
  await postgres.query(
    `INSERT INTO songs(album_id, mbid, title, length, track_number)
     VALUES($1, $2, $3, $4, $5)
     ON CONFLICT(mbid) DO UPDATE 
       SET title = EXCLUDED.title,
           length = EXCLUDED.length,
           track_number = EXCLUDED.track_number`,
    [albumId, song.id, song.title, song.length || null, song.position || null]
  );
}

async function main() {
  try {
    const artistName = process.argv[2];
    if (!artistName) {
      console.error("Please provide an artist name as an argument");
      process.exit(1);
    }

    const artists = await fetchArtists(artistName);

    for (const artist of artists) {
      console.log(`\n== Artist: ${artist.name} (${artist.id}) ==`);
      const artistId = await saveArtist(artist);
      if (!artistId) continue;

      const releaseGroups = await fetchReleaseGroups(artist.id);
      if (!releaseGroups.length) {
        console.warn("  No release groups found, skipping artist");
        continue;
      }

      for (const group of releaseGroups) {
        await sleep(1000);
        console.log(`  Release Group: ${group.title} (${group.id})`);

        const release = await fetchFirstRelease(group.id);
        if (!release) continue;

        const albumId = await saveAlbum(release, artistId);
        if (!albumId) continue;

        const songs = await fetchSongs(release.id);
        if (!songs.length) {
          console.warn("      No tracks found for this release");
          continue;
        }

        for (const song of songs) {
          console.log(`      Saving song: ${song.title}`);
          await saveSong(song, albumId);
        }
      }
    }

    console.log("\n✅ Done importing all data!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error importing data:", err);
    process.exit(1);
  }
}

main();
