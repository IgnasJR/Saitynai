import jwt from "jsonwebtoken";
import { redis } from "./db.js";

export const generateToken = (userId, role) => {
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
  redis.set(`token:${token}`, JSON.stringify({ userId, role }), "EX", 86400);
  return token;
};

export const verifyToken = async (token) => {
  try {
    const cached = await redis.get(`token:${token}`);
    if (!cached) {
      return null;
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const revokeToken = async (token) => {
  await redis.del(`token:${token}`);
};
