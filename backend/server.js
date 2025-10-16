import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { setupSwagger } from "./swagger.js";
import artistRoutes from "./routes/artist.js";
import albumRoutes from "./routes/albums.js";
import songRoutes from "./routes/songs.js";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
setupSwagger(app);

app.use("/api", artistRoutes);
app.use("/api", albumRoutes);
app.use("/api", songRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
