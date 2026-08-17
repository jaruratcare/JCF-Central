import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleLogin, handleLogout } from "./routes/auth";
import { handleChangePassword } from "./routes/password";
import tasksRouter from "./routes/tasks";
import doctorsRouter from "./routes/doctors";
import webinarsRouter from "./routes/webinars";
import socialRouter from "./routes/social";
import notificationsRouter from "./routes/notifications";
import teamRouter from "./routes/team";
import dashboardRouter from "./routes/dashboard";

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
  app.post("/api/auth/change-password", handleChangePassword);

  app.use("/api/tasks", tasksRouter);
  app.use("/api/doctors", doctorsRouter);
  app.use("/api/webinars", webinarsRouter);
  app.use("/api/social", socialRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/team", teamRouter);
  app.use("/api/dashboard", dashboardRouter);

  return app;
}
