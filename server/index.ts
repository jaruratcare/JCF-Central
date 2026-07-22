import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleLogout, handleRequestPasswordReset } from "./routes/auth";
import { handleChangePassword } from "./routes/password";
import techRouter from "./routes/tech/index";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth proxy routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.post("/api/auth/request-password-reset", handleRequestPasswordReset);
  app.post("/api/auth/change-password", handleChangePassword);

  app.use("/api/tech", techRouter);

  return app;
}
