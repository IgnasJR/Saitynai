import fetch from "node-fetch";

async function searchMusicBrainz(artist, track) {
  const query = encodeURIComponent(
    `artist:"${artist}" AND recording:"${track}"`
  );
  const url = `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=5`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "TuneFederate/1.0 (https://kanapinskas.live)",
      Accept: "application/json",
    },
  });
  const data = await response.json();
  return data.recordings || [];
}

async function getAcousticBrainzData(mbid) {
  const url = `https://acousticbrainz.org/api/v1/${mbid}/low-level`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function findAcousticBrainz(artist, track) {
  const recordings = await searchMusicBrainz(artist, track);
  for (const rec of recordings) {
    console.log(`Checking MBID: ${rec.id} - ${rec.title}`);
    const abData = await getAcousticBrainzData(rec.id);
    if (abData) {
      console.log(`Found AcousticBrainz data for: ${rec.title} (${rec.id})`);
      return { recording: rec, acousticBrainz: abData };
    }
  }
  console.log("No AcousticBrainz data found for any recording.");
  return null;
}

(async () => {
  const artist = "Swans";
  const track = "Helpless Child";
  const result = await findAcousticBrainz(artist, track);
  if (result) {
    console.log("\n--- AcousticBrainz Data ---");
    console.log(result.acousticBrainz);
  }
})();
