export default class User {
  id: string;
  username: string;
  token: string;

  constructor(id: string, username: string, token: string) {
    this.id = id;
    this.username = username;
    this.token = token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
