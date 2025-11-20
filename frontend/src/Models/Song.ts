export default class Song {
  id: string;
  title: string;
  track_number: number;
  length: number;
  constructor(id: string, title: string, track_number: number, length: number) {
    this.id = id;
    this.title = title;
    this.track_number = track_number;
    this.length = length;
  }
}
