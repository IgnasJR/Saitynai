export default class Album {
  id: string;
  title: string;
  artist: string;
  cover_url: string;

  constructor(id: string, title: string, artist: string, cover_url: string) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.cover_url = cover_url;
  }
}
