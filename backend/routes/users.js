import express from "express";
import { postgres } from "../utils/db.js";
import bcrypt from "bcrypt";
import { generateToken, revokeToken } from "../utils/auth.js";

const router = express.Router();
router.use(express.json());

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await postgres
      .query("SELECT * FROM users WHERE username = $1", [username])
      .then((result) => result.rows[0]);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.role);

    res.json({ token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  revokeToken(token)
    .then(() => {
      res.json({ message: "Logged out successfully" });
    })
    .catch((error) => {
      console.error("Error logging out:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await postgres
      .query("SELECT * FROM users WHERE username = $1", [username])
      .then((result) => result.rows[0]);

    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [newUser] = await postgres
      .query(
        "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username",
        [username, password_hash]
      )
      .then((result) => result.rows[0]);

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
