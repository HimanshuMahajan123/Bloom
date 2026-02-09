import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import locationRoutes from "./routes/location.routes.js";
import matchRoutes from "./routes/match.routes.js";
import "./jobs/perfectMatchjob.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api/location", locationRoutes);

app.use("/api/profile", profileRoutes);

app.use('/api/match', matchRoutes);

export default app;
