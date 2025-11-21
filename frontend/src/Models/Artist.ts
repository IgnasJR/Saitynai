import Album from "./Album";
export default class Artist {
  id: string;
  mbid: string;
  name: string;
  albums?: Album[];
  constructor(id: string, mbid: string, name: string, albums?: Album[]) {
    this.id = id;
    this.mbid = mbid;
    this.name = name;
    this.albums = albums || [];
  }
}
