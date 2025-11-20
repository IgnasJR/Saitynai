export default class User {
  id: string;
  username: string;
  token: string;
  role: string;

  constructor(id: string, username: string, token: string, role: string) {
    this.id = id;
    this.username = username;
    this.token = token;
    this.role = role;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
