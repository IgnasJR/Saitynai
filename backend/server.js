import dotenv from "dotenv";
import cookieParser from "cookie-parser";
dotenv.config();

import express from "express";
import { setupSwagger } from "./swagger.js";
import artistRoutes from "./routes/artist.js";
import albumRoutes from "./routes/albums.js";
import songRoutes from "./routes/songs.js";
import userRoutes from "./routes/users.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());
setupSwagger(app);

app.use("/api", artistRoutes);
app.use("/api", albumRoutes);
app.use("/api", songRoutes);
app.use("/api", userRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
