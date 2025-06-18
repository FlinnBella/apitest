import express from "express";
import dotenv from "dotenv";
import apiRouter from "./api";  // adjust the path if needed
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(cors());
app.use(express.json());

// Mount your router at a path, e.g. '/api'
app.use("/api", apiRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
