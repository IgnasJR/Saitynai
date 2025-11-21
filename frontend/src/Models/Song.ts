export default class Song {
  id: string;
  mbid: string;
  title: string;
  track_number: number;
  length: number;
  album: string;
  album_id: string;
  artist: string;

  constructor(
    id: string,
    mbid: string,
    title: string,
    track_number: number,
    length: number,
    album: string,
    album_id: string,
    artist: string
  ) {
    this.id = id;
    this.mbid = mbid;
    this.title = title;
    this.track_number = track_number;
    this.length = length;
    this.album = album;
    this.artist = artist;
    this.album_id = album_id;
  }
}
