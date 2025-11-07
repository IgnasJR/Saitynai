import jwt from "jsonwebtoken";
import { redis, postgres } from "./db.js";

export const generateTokens = async (userId, role) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "10m",
    }
  );

  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  await redis.sAdd(`refresh:${userId}`, refreshToken);

  return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) return null;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const exists = await redis.sIsMember(
      `refresh:${decoded.userId}`,
      refreshToken
    );

    if (!exists) return null;

    const { rows } = await postgres.query(
      "SELECT role FROM users WHERE id = $1",
      [decoded.userId]
    );

    if (!rows.length) return null;
    const role = rows[0].role;

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      decoded.userId,
      role
    );

    await redis.sRem(`refresh:${decoded.userId}`, refreshToken);
    await redis.sAdd(`refresh:${decoded.userId}`, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    return null;
  }
};

export const revokeRefreshToken = async (userId, refreshToken) => {
  await redis.sRem(`refresh:${userId}`, refreshToken);
};
