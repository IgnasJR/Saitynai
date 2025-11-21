import Album from "./Album";
export default class Artist {
  id: string;
  mbid: string;
  name: string;
  country?: string;
  founded?: string;
  disbanded?: string;
  albums?: Album[];
  constructor(
    id: string,
    mbid: string,
    name: string,
    country?: string,
    founded?: string,
    disbanded?: string,
    albums?: Album[]
  ) {
    this.id = id;
    this.mbid = mbid;
    this.name = name;
    this.country = country;
    this.founded = founded;
    this.disbanded = disbanded;
    this.albums = albums || [];
  }
}
