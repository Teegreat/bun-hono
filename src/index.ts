import { Hono } from "hono";
import { initDatabase } from "./database/db";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { register } from "./controllers/auth";

const app = new Hono();
const db = initDatabase();

// middleware
app.use("*", cors());
app.use("*", logger());

// Input validation
const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(25, "Username is too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).optional(),
});

app.post("/register-user", zValidator("json", registerSchema), (c) =>
  register(c, db),
);

app.get("/", (c) => {
  return c.text("Hello, User and Task management using Bun & Hono!");
});

app.get("/db-test", (c) => {
  const result = db.query("SELECT sqlite_version()").get();

  return c.json({
    message: "DB connected successfully",
    sqlite_version: result,
  });
});

export default app;
