import type Song from "./Song";

export default class Album {
  id: string;
  title: string;
  artist: string;
  cover_url: string;
  songs: Song[];
  mbid: string;
  artist_id: string;

  constructor(
    id: string,
    title: string,
    artist: string,
    cover_url: string,
    songs: Song[],
    mbid: string,
    artist_id: string
  ) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.cover_url = cover_url;
    this.songs = songs;
    this.mbid = mbid;
    this.artist_id = artist_id;
  }
}
