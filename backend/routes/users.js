import express from "express";
import { postgres } from "../utils/db.js";
import bcrypt from "bcrypt";
import {
  generateTokens,
  refreshTokens,
  revokeRefreshToken,
  verifyToken,
} from "../utils/auth.js";

const router = express.Router();
router.use(express.json());

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await postgres
      .query("SELECT * FROM users WHERE username = $1", [username])
      .then((res) => res.rows[0]);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const { accessToken, refreshToken } = await generateTokens(
      user.id,
      user.role
    );

    // ✅ store refresh token in http-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // use true in production (HTTPS)
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshToken = req.cookies.refreshToken;

    if (!authHeader) {
      return res.status(400).json({ error: "Authorization header missing" });
    }

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token missing" });
    }

    const accessToken = authHeader.split(" ")[1];
    const decoded = verifyToken(accessToken);

    if (!decoded?.userId) {
      return res.status(400).json({ error: "Invalid access token" });
    }

    await revokeRefreshToken(decoded.userId, refreshToken);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await postgres
      .query("SELECT id FROM users WHERE username = $1", [username])
      .then((result) => result.rows[0]);

    if (existingUser) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await postgres
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

router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  const tokens = await refreshTokens(refreshToken);

  if (!tokens) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }

  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: tokens.accessToken });
});

export default router;
